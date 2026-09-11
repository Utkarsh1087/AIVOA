import json
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Complaint
from app.schemas import (
    ComplaintAnalyzeRequest,
    StructuredAIResponse,
    ComplaintCreateRequest,
    ComplaintResponse,
    ReAssessRiskRequest,
    RiskAssessmentData,
    DashboardStatsResponse,
    AssistantChatRequest,
    AssistantChatResponse
)
from app.ai.workflow import run_qms_complaint_workflow
from app.ai.nodes import _heuristic_risk_assessment
from app.ai.prompts import ASSISTANT_AGENT_PROMPT
from app.ai.groq_client import groq_manager
from app.utils.doc_processor import (
    extract_text_from_pdf,
    extract_text_from_eml,
    extract_text_from_image
)

logger = logging.getLogger("aivoa_routes")
router = APIRouter(prefix="/api/complaints", tags=["Customer Complaints"])

def _get_history_dict_list(db: Session) -> List[dict]:
    """Retrieves recent complaints history for LangGraph duplicate check."""
    complaints = db.query(Complaint).order_by(Complaint.id.desc()).limit(100).all()
    return [
        {
            "id": c.id,
            "product_name": c.product_name,
            "batch_number": c.batch_number,
            "complaint_description": c.complaint_description
        }
        for c in complaints
    ]

@router.post("/analyze", response_model=StructuredAIResponse)
def analyze_complaint_text(
    payload: ComplaintAnalyzeRequest,
    db: Session = Depends(get_db)
):
    """
    Analyzes raw text complaint input using the multi-step LangGraph workflow.
    """
    if not payload.input_text or not payload.input_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint input_text cannot be empty."
        )

    history = _get_history_dict_list(db)
    result = run_qms_complaint_workflow(
        raw_input=payload.input_text,
        source=payload.source or "Text Prompt",
        db_complaints_history=history
    )
    return result

@router.post("/upload", response_model=StructuredAIResponse)
def upload_and_analyze_complaint(
    file: UploadFile = File(...),
    source_type: Optional[str] = Form("File Upload"),
    db: Session = Depends(get_db)
):
    """
    Accepts PDF, Email (.eml), Image, or Text file, extracts usable content,
    and executes the LangGraph AI workflow in a worker thread.
    """
    file_bytes = file.file.read()
    filename = file.filename or "uploaded_file"
    ext = filename.split(".")[-1].lower()

    if ext in ["pdf"]:
        extracted_text = extract_text_from_pdf(file_bytes)
        source = f"PDF File ({filename})"
    elif ext in ["eml", "msg"]:
        extracted_text = extract_text_from_eml(file_bytes)
        source = f"Email Attachment ({filename})"
    elif ext in ["png", "jpg", "jpeg", "webp", "tiff", "bmp"]:
        extracted_text = extract_text_from_image(file_bytes, filename)
        source = f"Image OCR ({filename})"
    elif ext in ["txt", "log", "csv", "json"]:
        try:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            extracted_text = f"Content from text file {filename}"
        source = f"Text File ({filename})"
    else:
        try:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            extracted_text = f"Content from uploaded file {filename}"
        source = f"Uploaded Document ({filename})"

    history = _get_history_dict_list(db)
    result = run_qms_complaint_workflow(
        raw_input=extracted_text,
        source=source,
        db_complaints_history=history
    )
    return result

from app.ai.prompts import ASSISTANT_AGENT_PROMPT

@router.post("/assistant-chat", response_model=AssistantChatResponse)
def complaint_assistant_chat(
    payload: AssistantChatRequest,
    db: Session = Depends(get_db)
):
    """
    Agentic AI Assistant for:
    1. Log Complaint Tool: parses natural language prompts and fills the complaint form & risk assessment.
    2. Edit Complaint Tool: modifies/updates specific complaint fields while preserving existing data.
    3. Natural Q&A Chat.
    """
    ctx = payload.context or {}
    user_q = payload.message.strip()
    if not user_q:
        return AssistantChatResponse(reply="Please type a complaint description, update request, or question.")

    history = _get_history_dict_list(db)

    prompt_formatted = ASSISTANT_AGENT_PROMPT.format(
        customer_name=ctx.get("customer_name") or "None",
        product_name=ctx.get("product_name") or "None",
        product_strength=ctx.get("product_strength") or "None",
        batch_number=ctx.get("batch_number") or "None",
        mfg_date=ctx.get("mfg_date") or "None",
        expiry_date=ctx.get("expiry_date") or "None",
        quantity_affected=ctx.get("quantity_affected") or "None",
        originating_site_block=ctx.get("originating_site_block") or "Manufacturing",
        impacted_npm=ctx.get("impacted_npm") or "Primary Packaging (Bottle)",
        structured_defect_summary=ctx.get("structured_defect_summary") or "None",
        complaint_type=ctx.get("complaint_type") or "None",
        complaint_description=ctx.get("complaint_description") or "None",
        severity=ctx.get("severity") or "None",
        priority=ctx.get("priority") or "None",
        source=ctx.get("source") or "Pharmacy",
        user_message=user_q
    )

    parsed = groq_manager.generate_json(
        system_prompt="You are AIVOA Copilot. Analyze the user request and return structured JSON.",
        user_prompt=prompt_formatted
    )

    action_type = "chat"
    if parsed and isinstance(parsed, dict):
        action_type = parsed.get("action_type", "chat")
    else:
        # Heuristic intent detection if offline or LLM did not return JSON
        q_lower = user_q.lower()
        if any(w in q_lower for w in ["sorry", "batch", "quantity", "update", "change", "edit", "instead of", "correct"]):
            action_type = "edit_complaint"
        elif any(w in q_lower for w in ["reported", "complaint", "defect", "broken", "discolor", "capsule", "tablet", "vial", "found", "problem", "amoxicillin", "paracetamol"]):
            action_type = "log_complaint"
        else:
            action_type = "chat"

    # --- Tool 1: Log Complaint Tool ---
    if action_type == "log_complaint":
        workflow_res = run_qms_complaint_workflow(
            raw_input=user_q,
            source="Pharmacy",
            db_complaints_history=history
        )
        c_data = workflow_res.get("complaint") or {}
        risk_data = workflow_res.get("risk_assessment") or {}
        
        updated_form = {
            "customer_name": c_data.get("customer_name") or "",
            "product_name": c_data.get("product_name") or "",
            "product_strength": c_data.get("product_strength") or "",
            "batch_number": c_data.get("batch_number") or "",
            "mfg_date": c_data.get("mfg_date") or "",
            "expiry_date": c_data.get("expiry_date") or "",
            "quantity_affected": c_data.get("quantity_affected") or "",
            "originating_site_block": c_data.get("originating_site_block") or "Manufacturing",
            "impacted_npm": c_data.get("impacted_npm") or "Primary Packaging (Bottle)",
            "structured_defect_summary": c_data.get("structured_defect_summary") or "",
            "complaint_type": c_data.get("complaint_type") or "",
            "complaint_description": c_data.get("complaint_description") or user_q,
            "complaint_date": c_data.get("complaint_date") or datetime.now().strftime("%Y-%m-%d"),
            "source": c_data.get("source") or "Pharmacy",
            "status": "Open",
            "severity": risk_data.get("severity") or "Major",
            "priority": risk_data.get("priority") or "Medium",
            "risk_level": risk_data.get("risk_level") or "Medium",
            "risk_reason": risk_data.get("reason") or "",
            "potential_impact": risk_data.get("potential_impact") or ""
        }

        reply_msg = (
            parsed.get("reply") if (parsed and parsed.get("reply"))
            else f"Complaint parsed successfully. I've extracted the product details, mapped the batch information, and generated an initial risk assessment for the defect."
        )

        return AssistantChatResponse(
            reply=reply_msg,
            action_type="log_complaint",
            updated_form=updated_form,
            ai_response=workflow_res,
            suggested_actions=["Review Complaint Details", "Save Complaint"]
        )

    # --- Tool 2: Edit Complaint Tool ---
    elif action_type == "edit_complaint":
        extracted_fields = (parsed.get("extracted_fields") if parsed else {}) or {}
        
        # Fallback manual regex extraction if LLM didn't extract fields
        if not extracted_fields or all(v is None or str(v).strip() == "" for v in extracted_fields.values()):
            import re
            batch_match = re.search(r'\b(?:batch|lot|number|is)\s*[:#]?\s*([A-Z0-9-]{4,15})\b', user_q, re.I)
            qty_match = re.search(r'(\d+)\s*(?:capsules|tablets|units|kg|drums|bottles|vials|hdp|hdpe)?', user_q, re.I)
            if batch_match:
                extracted_fields["batch_number"] = batch_match.group(1)
            if qty_match:
                extracted_fields["quantity_affected"] = int(qty_match.group(1))

        # Merge with existing context (preserve untouched values)
        updated_form = dict(ctx)
        for k, v in extracted_fields.items():
            if v is not None and str(v).strip() != "":
                updated_form[k] = v

        # Re-assess risk based on updated fields (LLM with heuristic fallback)
        try:
            from app.ai.prompts import RISK_ASSESSMENT_PROMPT
            reassess_prompt = RISK_ASSESSMENT_PROMPT.format(
                product_name=updated_form.get("product_name") or "Unspecified Product",
                product_strength=updated_form.get("product_strength") or "Standard Strength",
                batch_number=updated_form.get("batch_number") or "Unspecified Batch",
                complaint_type=updated_form.get("complaint_type") or "General Quality Issue",
                complaint_description=updated_form.get("complaint_description") or "",
                quantity_affected=updated_form.get("quantity_affected") or 0
            )
            reassessed_risk = groq_manager.generate_json(
                system_prompt="You are a Pharmaceutical Quality Risk Management (QRM) expert.",
                user_prompt=reassess_prompt
            )
        except Exception:
            reassessed_risk = None

        if not reassessed_risk or not isinstance(reassessed_risk, dict):
            reassessed_risk = _heuristic_risk_assessment(updated_form)
        
        updated_form["risk_level"] = reassessed_risk.get("risk_level", updated_form.get("risk_level", "Medium"))
        updated_form["severity"] = reassessed_risk.get("severity", updated_form.get("severity", "Major"))
        updated_form["priority"] = reassessed_risk.get("priority", updated_form.get("priority", "Medium"))
        updated_form["risk_reason"] = reassessed_risk.get("reason", updated_form.get("risk_reason", ""))
        updated_form["potential_impact"] = reassessed_risk.get("potential_impact", updated_form.get("potential_impact", ""))

        ai_response_obj = {
            "complaint": {
                "customer_name": updated_form.get("customer_name", ""),
                "product_name": updated_form.get("product_name", ""),
                "product_strength": updated_form.get("product_strength", ""),
                "batch_number": updated_form.get("batch_number", ""),
                "mfg_date": updated_form.get("mfg_date", ""),
                "expiry_date": updated_form.get("expiry_date", ""),
                "quantity_affected": updated_form.get("quantity_affected") or 0,
                "complaint_type": updated_form.get("complaint_type", ""),
                "complaint_description": updated_form.get("complaint_description", ""),
                "source": updated_form.get("source", "AI Assistant Chat"),
                "priority": updated_form.get("priority", "Medium")
            },
            "completeness": {"is_complete": True, "missing_fields": [], "confidence": 1.0},
            "risk_assessment": {
                "risk_level": updated_form["risk_level"],
                "severity": updated_form["severity"],
                "priority": updated_form.get("priority", "Medium"),
                "reason": updated_form["risk_reason"],
                "potential_impact": updated_form["potential_impact"]
            },
            "recommendations": [
                f"Quarantine batch {updated_form.get('batch_number', 'N/A')} pending investigation.",
                "Verify packaging and inspection logs for affected shipment."
            ],
            "capa_recommendations": [
                "Perform equipment inspection on packaging line.",
                "Update secondary packaging handling standard operating procedures."
            ],
            "root_cause_suggestions": [
                "Mechanical stress during transport / carton packing.",
                "Packaging foil sealing tolerance deviation."
            ],
            "duplicate_check": {"is_duplicate_suspected": False, "similar_complaint_ids": [], "explanation": ""},
            "summary": f"Updated complaint for {updated_form.get('product_name', 'product')} (Batch {updated_form.get('batch_number', 'N/A')})."
        }

        reply_msg = (
            parsed.get("reply") if (parsed and parsed.get("reply"))
            else f"I have updated the complaint with batch number {updated_form.get('batch_number')} and quantity {updated_form.get('quantity_affected')}, while preserving all other complaint details."
        )

        return AssistantChatResponse(
            reply=reply_msg,
            action_type="edit_complaint",
            updated_form=updated_form,
            ai_response=ai_response_obj,
            suggested_actions=["Review Updated Form", "Save Complaint"]
        )

    # --- Tool 3: Chat / Inquiries ---
    reply_msg = parsed.get("reply") if (parsed and parsed.get("reply")) else ""
    if not reply_msg:
        if user_q.lower() in ["hi", "hii", "hello", "hey"]:
            reply_msg = "Hello! 👋 I’m here to help you log, edit, or review customer complaints. You can give me a prompt or ask any questions."
        else:
            reply_msg = "I can help you log or edit complaints. Type a complaint details prompt or specify which fields you'd like to update."

    return AssistantChatResponse(
        reply=reply_msg,
        action_type="chat",
        suggested_actions=["Log a Complaint", "Ask a Question"]
    )

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    payload: ComplaintCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Persists reviewed/edited customer complaint and AI assessment into database.
    """
    prod = (payload.product_name or "").strip()
    batch = (payload.batch_number or "").strip()
    cust = (payload.customer_name or "").strip()
    desc = (payload.complaint_description or "").strip()
    summary = (payload.structured_defect_summary or "").strip()

    if not prod and not batch and not cust and not desc and not summary:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot save an empty complaint. Please provide at least a Product Name, Customer Name, Batch Number, or Complaint Description."
        )

    new_complaint = Complaint(
        customer_name=cust or "Customer",
        product_name=prod or "Pharmaceutical Product",
        product_strength=payload.product_strength or "",
        batch_number=batch or "N/A",
        mfg_date=payload.mfg_date or "",
        expiry_date=payload.expiry_date or "",
        complaint_type=payload.complaint_type or "General Quality Issue",
        complaint_description=desc or summary or "Complaint registered without detailed notes.",
        quantity_affected=str(payload.quantity_affected or 0),
        complaint_date=payload.complaint_date or datetime.now().strftime("%Y-%m-%d"),
        source=payload.source or "Pharmacy",
        status=payload.status or "Open",
        
        originating_site_block=payload.originating_site_block or "Manufacturing",
        impacted_npm=payload.impacted_npm or "Primary Packaging (Bottle)",
        structured_defect_summary=payload.structured_defect_summary or "",
        
        risk_level=payload.risk_level or "Medium",
        severity=payload.severity or "Major",
        priority=payload.priority or "Medium",
        risk_reason=payload.risk_reason or "",
        potential_impact=payload.potential_impact or "",

        completeness_confidence=payload.completeness_confidence or 1.0,
        missing_fields_json=json.dumps(payload.missing_fields or []),
        recommendations_json=json.dumps(payload.recommendations or []),
        capa_recommendations_json=json.dumps(payload.capa_recommendations or []),
        root_cause_suggestions_json=json.dumps(payload.root_cause_suggestions or []),
        ai_summary=payload.ai_summary or "",

        is_duplicate_suspected=payload.is_duplicate_suspected or False,
        similar_complaint_ids_json=json.dumps(payload.similar_complaint_ids or []),
        duplicate_explanation=payload.duplicate_explanation or ""
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint

@router.get("", response_model=List[ComplaintResponse])
def get_complaints(
    search: Optional[str] = None,
    risk_level: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieves logged complaints with optional filtering and search.
    """
    query = db.query(Complaint)

    if risk_level and risk_level.lower() != "all":
        query = query.filter(Complaint.risk_level.ilike(risk_level))

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Complaint.status.ilike(status_filter))

    if search:
        s = f"%{search}%"
        query = query.filter(
            (Complaint.customer_name.ilike(s)) |
            (Complaint.product_name.ilike(s)) |
            (Complaint.batch_number.ilike(s)) |
            (Complaint.complaint_description.ilike(s)) |
            (Complaint.complaint_type.ilike(s))
        )

    complaints = query.order_by(Complaint.created_at.desc()).all()
    return complaints

@router.get("/stats/dashboard", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Computes QMS aggregate stats for overview dashboard widgets.
    """
    all_complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()

    total = len(all_complaints)
    high_risk = sum(1 for c in all_complaints if str(c.risk_level).lower() == "high")
    med_risk = sum(1 for c in all_complaints if str(c.risk_level).lower() == "medium")
    low_risk = sum(1 for c in all_complaints if str(c.risk_level).lower() == "low")

    open_c = sum(1 for c in all_complaints if str(c.status).lower() == "open")
    investigating = sum(1 for c in all_complaints if str(c.status).lower() in ["under investigation", "investigating"])
    capa_pending = sum(1 for c in all_complaints if str(c.status).lower() in ["capa pending", "capa"])
    closed = sum(1 for c in all_complaints if str(c.status).lower() == "closed")

    recent = all_complaints[:5]

    return {
        "total_complaints": total,
        "high_risk_count": high_risk,
        "medium_risk_count": med_risk,
        "low_risk_count": low_risk,
        "open_count": open_c,
        "investigating_count": investigating,
        "capa_pending_count": capa_pending,
        "closed_count": closed,
        "recent_complaints": recent
    }

@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint_detail(complaint_id: int, db: Session = Depends(get_db)):
    """
    Retrieves full details for a specific customer complaint.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint ID #{complaint_id} not found."
        )
    return complaint

@router.post("/{complaint_id}/risk-assessment", response_model=RiskAssessmentData)
def re_assess_complaint_risk(
    complaint_id: int,
    payload: ReAssessRiskRequest,
    db: Session = Depends(get_db)
):
    """
    Re-runs AI Copilot risk evaluation on edited form values.
    """
    data_dict = {
        "customer_name": payload.customer_name,
        "product_name": payload.product_name,
        "product_strength": payload.product_strength,
        "batch_number": payload.batch_number,
        "complaint_type": payload.complaint_type,
        "complaint_description": payload.complaint_description,
        "quantity_affected": payload.quantity_affected
    }

    # Run heuristic or LLM risk re-eval
    risk = _heuristic_risk_assessment(data_dict)
    
    # Update stored complaint if exists
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if complaint:
        complaint.risk_level = risk["risk_level"]
        complaint.severity = risk["severity"]
        complaint.priority = risk.get("priority", "Medium")
        complaint.risk_reason = risk["reason"]
        complaint.potential_impact = risk["potential_impact"]
        db.commit()

    return risk
