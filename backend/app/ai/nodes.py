import re
import logging
from typing import Dict, Any, List
from app.ai.prompts import EXTRACTION_SYSTEM_PROMPT, RISK_ASSESSMENT_PROMPT, CAPA_RECOMMENDATIONS_PROMPT
from app.ai.groq_client import groq_manager

logger = logging.getLogger("aivoa_nodes")

def input_processing_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Node 1: Clean and prepare incoming text input."""
    raw_input = state.get("raw_input", "")
    source = state.get("source", "Text Prompt")
    
    cleaned_input = raw_input.strip()
    return {
        **state,
        "cleaned_input": cleaned_input,
        "source": source
    }

def extraction_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Node 2: Extract structured complaint details using Groq Gemma2-9b-it or fallback heuristics with relevance gating."""
    text = state.get("cleaned_input", "")
    source = state.get("source", "Text Prompt")

    extracted = groq_manager.generate_json(
        system_prompt=EXTRACTION_SYSTEM_PROMPT,
        user_prompt=f"Input Document Content:\n{text}"
    )

    if not extracted or not isinstance(extracted, dict):
        logger.info("Using smart rule-based pharma extraction fallback with relevance check.")
        extracted = _heuristic_pharma_extraction(text, source)

    is_rel = extracted.get("is_relevant", True)
    if is_rel is False or (not extracted.get("product_name") and not extracted.get("complaint_description") and not extracted.get("batch_number")):
        is_rel = False
        extracted["is_relevant"] = False

    if not extracted.get("source"):
        extracted["source"] = source
    if not extracted.get("priority") and is_rel:
        extracted["priority"] = "Medium"

    return {
        **state,
        "is_relevant": is_rel,
        "relevance_explanation": extracted.get("relevance_explanation", ""),
        "extracted_complaint": extracted
    }

def completeness_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Node 3: Validate completeness and identify missing critical QMS fields."""
    is_relevant = state.get("is_relevant", True)
    if not is_relevant:
        return {
            **state,
            "completeness": {
                "is_complete": False,
                "missing_fields": ["product_name", "batch_number", "complaint_description"],
                "confidence": 0.0
            }
        }

    complaint = state.get("extracted_complaint", {})
    required_fields = ["customer_name", "product_name", "batch_number", "complaint_type", "complaint_description"]
    missing = []
    
    for f in required_fields:
        val = complaint.get(f)
        if val is None or str(val).strip() == "" or str(val).lower() == "unknown" or str(val).lower() == "none":
            missing.append(f)
            
    total_fields = len(required_fields) + 1 # include quantity_affected
    present_count = total_fields - len(missing)
    if not complaint.get("quantity_affected"):
        missing.append("quantity_affected")
    
    confidence = round(present_count / total_fields, 2)
    is_complete = len(missing) == 0

    return {
        **state,
        "completeness": {
            "is_complete": is_complete,
            "missing_fields": missing,
            "confidence": max(0.2, confidence)
        }
    }

def duplicate_check_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Node 4: Search database context to identify potential duplicate complaints."""
    is_relevant = state.get("is_relevant", True)
    if not is_relevant:
        return {
            **state,
            "duplicate_check": {
                "is_duplicate_suspected": False,
                "similar_complaint_ids": [],
                "explanation": "No duplicate check performed for non-complaint document."
            }
        }

    complaint = state.get("extracted_complaint", {})
    existing_complaints = state.get("db_complaints_history", [])
    
    batch = str(complaint.get("batch_number", "")).strip().upper()
    product = str(complaint.get("product_name", "")).strip().lower()
    
    similar_ids = []
    explanation = ""

    if batch and len(batch) > 2:
        for item in existing_complaints:
            item_batch = str(item.get("batch_number", "")).strip().upper()
            if item_batch == batch:
                similar_ids.append(item.get("id"))
    
    if similar_ids:
        is_duplicate = True
        explanation = f"Flagged potential duplicate: {len(similar_ids)} existing complaint(s) share batch number '{batch}'."
    else:
        is_duplicate = False
        explanation = "No matching batch number found in existing active complaint logs."

    return {
        **state,
        "duplicate_check": {
            "is_duplicate_suspected": is_duplicate,
            "similar_complaint_ids": similar_ids,
            "explanation": explanation
        }
    }

def risk_assessment_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Node 5: AI Copilot Risk Assessment (Severity, Risk Level, Impact Rationale)."""
    is_relevant = state.get("is_relevant", True)
    if not is_relevant:
        return {
            **state,
            "risk_assessment": {
                "risk_level": "N/A",
                "severity": "N/A",
                "priority": "N/A",
                "reason": "No quality defect identified in document.",
                "potential_impact": "None"
            }
        }

    complaint = state.get("extracted_complaint", {})

    prompt_data = RISK_ASSESSMENT_PROMPT.format(
        product_name=complaint.get("product_name") or "Unspecified Product",
        product_strength=complaint.get("product_strength") or "Standard Strength",
        batch_number=complaint.get("batch_number") or "Unspecified Batch",
        complaint_type=complaint.get("complaint_type") or "General Quality Issue",
        complaint_description=complaint.get("complaint_description") or "",
        quantity_affected=complaint.get("quantity_affected") or 0
    )

    risk_res = groq_manager.generate_json(
        system_prompt="You are a Pharmaceutical Quality Risk Management (QRM) expert.",
        user_prompt=prompt_data
    )

    if not risk_res or not isinstance(risk_res, dict):
        logger.info("Using smart QRM heuristic risk evaluation fallback.")
        risk_res = _heuristic_risk_assessment(complaint)

    return {
        **state,
        "risk_assessment": risk_res
    }

def recommendations_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Node 6: Generate Containment Actions, Root Cause Suggestions, CAPA Plan, and Summary."""
    is_relevant = state.get("is_relevant", True)
    if not is_relevant:
        return {
            **state,
            "recommendations": [],
            "root_cause_suggestions": [],
            "capa_recommendations": [],
            "summary": "The uploaded document or text is not a pharmaceutical customer complaint."
        }

    complaint = state.get("extracted_complaint", {})
    risk = state.get("risk_assessment", {})

    prompt_data = CAPA_RECOMMENDATIONS_PROMPT.format(
        product_name=complaint.get("product_name") or "Pharmaceutical Dosage Form",
        batch_number=complaint.get("batch_number") or "Unknown",
        complaint_type=complaint.get("complaint_type") or "Quality Defect",
        complaint_description=complaint.get("complaint_description") or "",
        risk_level=risk.get("risk_level", "Medium")
    )

    capa_res = groq_manager.generate_json(
        system_prompt="You are a Senior QMS Engineer generating CAPA recommendations.",
        user_prompt=prompt_data
    )

    if not capa_res or not isinstance(capa_res, dict):
        logger.info("Using QMS heuristic CAPA recommendation engine fallback.")
        capa_res = _heuristic_capa_recommendations(complaint, risk)

    return {
        **state,
        "recommendations": capa_res.get("recommendations", []),
        "root_cause_suggestions": capa_res.get("root_cause_suggestions", []),
        "capa_recommendations": capa_res.get("capa_recommendations", []),
        "summary": capa_res.get("summary", "")
    }

def structured_output_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Node 7: Format final structured response dictionary."""
    return {
        "is_relevant": state.get("is_relevant", True),
        "relevance_explanation": state.get("relevance_explanation", ""),
        "complaint": state.get("extracted_complaint", {}),
        "completeness": state.get("completeness", {}),
        "risk_assessment": state.get("risk_assessment", {}),
        "recommendations": state.get("recommendations", []),
        "capa_recommendations": state.get("capa_recommendations", []),
        "root_cause_suggestions": state.get("root_cause_suggestions", []),
        "duplicate_check": state.get("duplicate_check", {}),
        "summary": state.get("summary", "")
    }

# --- HEURISTIC FALLBACK ENGINES FOR ZERO-DEPENDENCY OFFLINE RESILIENCE ---

def _heuristic_pharma_extraction(text: str, source: str) -> Dict[str, Any]:
    """Parses text using regex and pharmaceutical keyword patterns when API is offline or returns unstructured data."""
    text_lower = text.lower()
    
    # 1. Check for negative indicators (e.g. resumes, software docs, company profiles)
    negative_indicators = [
        "resume", "curriculum vitae", "software engineer", "developer", "technologies",
        "programming", "skills", "experience", "education", "github", "linkedin",
        "portfolio", "university", "bachelor", "master of", "solutions pvt", "consultancy"
    ]
    neg_score = sum(1 for term in negative_indicators if term in text_lower)

    # 2. Check for positive pharmaceutical complaint indicators
    pharma_keywords = [
        "tablet", "capsule", "vial", "syrup", "injection", "batch", "lot", "expiry",
        "dosage", "drug", "medicine", "pharmaceutical", "packaging", "defect",
        "contamination", "discoloration", "adverse", "paracetamol", "amoxicillin",
        "ibuprofen", "metformin", "ciprofloxacin", "qc", "sop", "quality control",
        "complaint", "pharma", "clinical", "hospital", "pharmacy", "recall", "seal"
    ]
    pharma_score = sum(1 for term in pharma_keywords if term in text_lower)

    complaint_keywords = [
        "broken", "damaged", "leak", "leaking", "contamination", "discoloration",
        "foreign particle", "seal broken", "missing", "defect", "complaint", "adverse",
        "side effect", "odor", "smell", "crushed", "shortage", "expiry", "expired",
        "precipitation", "turbid", "labeling error", "mislabel"
    ]
    complaint_score = sum(1 for term in complaint_keywords if term in text_lower)

    # If document has high negative score or zero pharma/complaint relevance, mark irrelevant
    if (neg_score >= 2 and pharma_score < 3) or (pharma_score == 0 and complaint_score == 0):
        return {
            "is_relevant": False,
            "relevance_explanation": "The uploaded document or text is not recognized as a pharmaceutical product complaint or quality issue.",
            "customer_name": "",
            "source": source,
            "product_name": "",
            "product_strength": "",
            "batch_number": "",
            "mfg_date": "",
            "expiry_date": "",
            "quantity_affected": "",
            "originating_site_block": "Manufacturing",
            "impacted_npm": "",
            "structured_defect_summary": "",
            "complaint_type": "",
            "complaint_description": "",
            "complaint_date": "",
            "priority": "Low"
        }

    customer = ""
    cust_match = re.search(r"(?:Customer|Client|From|Hospital|Pharmacy):\s*([^\n,]+)", text, re.IGNORECASE)
    if cust_match:
        customer = cust_match.group(1).strip()
    elif "Healthcare" in text or "Pharmacy" in text or "Hospital" in text:
        words = re.findall(r"([A-Z0-9\.\s]+(?:Healthcare|Pharmacy|Hospital|Clinic|Distributor|Medical Center))", text)
        if words:
            customer = words[0].strip()

    product = ""
    prod_strength = ""
    prod_match = re.search(r"(?:Product|Drug|Medication|Item):\s*([^\n,]+)", text, re.IGNORECASE)
    if prod_match:
        product = prod_match.group(1).strip()
    else:
        for p in ["Paracetamol", "Amoxicillin", "Insulin Vials", "Ibuprofen", "Metformin", "Ciprofloxacin"]:
            if p.lower() in text.lower():
                product = p
                break

    strength_match = re.search(r"\b(\d+\s*(?:mg|g|mcg|IU|ml|%|USP|BP))\b", text, re.IGNORECASE)
    if strength_match:
        prod_strength = strength_match.group(1).strip()

    batch = ""
    batch_match = re.search(r"(?:Batch|Lot|Lot#|Batch#):\s*([A-Za-z0-9\-]+)", text, re.IGNORECASE)
    if batch_match:
        batch = batch_match.group(1).strip().upper()
    else:
        b_raw = re.findall(r"\b([A-Z]{2,4}\d{4,8})\b", text)
        if b_raw:
            batch = b_raw[0]

    qty = ""
    qty_match = re.search(r"(?:Quantity|Units|Packs|Boxes|Volume|Affected):\s*(\d+)", text, re.IGNORECASE)
    if qty_match:
        qty = f"{qty_match.group(1)} units"
    else:
        q_raw = re.findall(r"(\d+)\s*(?:units|tablets|vials|boxes|packs|bottles|kg|capsules)", text, re.IGNORECASE)
        if q_raw:
            qty = f"{q_raw[0]} units"

    mfg_date = ""
    mfg_match = re.search(r"(?:Mfg|Manufacturing|MFD)(?:\s*Date)?:\s*([A-Za-z0-9\s,\-\/]+)", text, re.IGNORECASE)
    if mfg_match:
        mfg_date = mfg_match.group(1).strip()

    exp_date = ""
    exp_match = re.search(r"(?:Exp|Expiry|EXP)(?:\s*Date)?:\s*([A-Za-z0-9\s,\-\/]+)", text, re.IGNORECASE)
    if exp_match:
        exp_date = exp_match.group(1).strip()

    c_type = "Packaging Defect"
    if "broken" in text_lower or "damaged" in text_lower or "crushed" in text_lower:
        c_type = "Packaging Defect / Physical Damage"
    elif "color" in text_lower or "discoloration" in text_lower or "particle" in text_lower or "cloudy" in text_lower:
        c_type = "Physical Integrity / Contamination"
    elif "seal" in text_lower or "leak" in text_lower or "leaking" in text_lower:
        c_type = "Container Closure Seal Integrity"
    elif "label" in text_lower or "mislabel" in text_lower:
        c_type = "Labeling & Packaging Error"
    elif "side effect" in text_lower or "reaction" in text_lower or "nausea" in text_lower:
        c_type = "Adverse Event / Pharmacovigilance"

    date_str = ""
    date_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text)
    if date_match:
        date_str = date_match.group(1)

    # Check for site block
    site_block = "Manufacturing"
    if "packaging" in text_lower or "bottle" in text_lower or "blister" in text_lower or "foil" in text_lower or "carton" in text_lower:
        site_block = "Packaging Block A"
    elif "api" in text_lower or "synthesis" in text_lower or "chemical" in text_lower:
        site_block = "API Synthesis Block"
    elif "warehouse" in text_lower or "storage" in text_lower or "transit" in text_lower:
        site_block = "Warehouse & Storage"
    elif "qc" in text_lower or "lab" in text_lower or "assay" in text_lower:
        site_block = "Quality Control Lab"

    # Check for impacted NPM
    impacted_npm = ""
    if "blister" in text_lower or "foil" in text_lower:
        impacted_npm = "Blister Foil"
    elif "bottle" in text_lower or "cap" in text_lower:
        impacted_npm = "Primary Packaging (Bottle)"
    elif "carton" in text_lower or "box" in text_lower:
        impacted_npm = "Secondary Packaging (Carton)"
    elif "stopper" in text_lower or "vial" in text_lower:
        impacted_npm = "Rubber Stopper / Glass Vial"
    elif "label" in text_lower:
        impacted_npm = "Adhesive Labeling Material"

    defect_summary = f"{product or 'Reported Product'} ({batch or 'Unspecified Batch'}): {c_type} reported. Quality review initiated." if product or batch else ""

    return {
        "is_relevant": True,
        "relevance_explanation": "",
        "customer_name": customer,
        "source": source,
        "product_name": product,
        "product_strength": prod_strength,
        "batch_number": batch,
        "mfg_date": mfg_date,
        "expiry_date": exp_date,
        "quantity_affected": qty,
        "originating_site_block": site_block,
        "impacted_npm": impacted_npm,
        "structured_defect_summary": defect_summary,
        "complaint_type": c_type,
        "complaint_description": text if len(text) < 300 else text[:300] + "...",
        "complaint_date": date_str,
        "priority": "High" if "broken" in text_lower or "leak" in text_lower or "discolor" in text_lower else "Medium"
    }

def _heuristic_risk_assessment(complaint: Dict[str, Any]) -> Dict[str, Any]:
    c_type = str(complaint.get("complaint_type", "")).lower()
    desc = str(complaint.get("complaint_description", "")).lower()
    try:
        qty = int(complaint.get("quantity_affected") or 0)
    except (ValueError, TypeError):
        qty = 0

    if "leak" in c_type or "leak" in desc or "contaminat" in c_type or "contaminat" in desc or "steril" in desc or "adverse" in c_type:
        return {
            "risk_level": "High",
            "severity": "Critical",
            "priority": "Urgent",
            "reason": "Container closure compromise or contamination poses immediate risk to product sterility and patient safety.",
            "potential_impact": "High safety risk. Requires immediate batch quarantine and health hazard evaluation (HHE)."
        }
    elif "broken" in desc or "damage" in c_type or qty > 50:
        return {
            "risk_level": "High" if qty > 50 else "Medium",
            "severity": "Major",
            "priority": "High",
            "reason": "Physical defect in primary/secondary packaging impacts dosage unit stability and barrier protection.",
            "potential_impact": "Potential distribution hold on affected shipping lot pending retention sample testing."
        }
    else:
        return {
            "risk_level": "Low",
            "severity": "Minor",
            "priority": "Medium",
            "reason": "Defect is localized or cosmetic, with no apparent compromise to API potency or container closure integrity.",
            "potential_impact": "Localized impact. Standard QMS customer credit and routine trend review."
        }

def _heuristic_capa_recommendations(complaint: Dict[str, Any], risk: Dict[str, Any]) -> Dict[str, Any]:
    batch = complaint.get("batch_number") or "the batch"
    risk_level = risk.get("risk_level", "Medium")

    recs = [
        f"Immediately place batch {batch} on Quality Hold in ERP system.",
        "Request physical sample return from customer for QC Laboratory examination.",
        "Perform visual inspection on retain samples from the manufactured lot."
    ]
    
    root_causes = [
        "Mechanical stress during automated packaging and box sealing operation.",
        "Variability in packaging component material specification.",
        "Thermal or physical impact during third-party logistics transit."
    ]

    capas = [
        "Calibrate sealing pressure and sensor tolerances on Packaging Line 2.",
        "Initiate Vendor Quality Audit with packaging material supplier.",
        "Update Standard Operating Procedure (SOP-QA-042) for shipping carton drop tests."
    ]

    summary = f"Customer complaint regarding {complaint.get('product_name', 'product')} (Batch {batch}) classified as {risk_level} Risk. Quality investigation and containment initialized."

    return {
        "recommendations": recs,
        "root_cause_suggestions": root_causes,
        "capa_recommendations": capas,
        "summary": summary
    }
