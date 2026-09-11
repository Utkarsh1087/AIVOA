import logging
from typing import Dict, Any, TypedDict, List, Optional
from langgraph.graph import StateGraph, START, END

from app.ai.nodes import (
    input_processing_node,
    extraction_node,
    completeness_node,
    duplicate_check_node,
    risk_assessment_node,
    recommendations_node,
    structured_output_node
)

logger = logging.getLogger("aivoa_workflow")

# Define LangGraph State Schema
class QmsComplaintState(TypedDict, total=False):
    raw_input: str
    source: str
    cleaned_input: str
    is_relevant: bool
    relevance_explanation: str
    extracted_complaint: Dict[str, Any]
    completeness: Dict[str, Any]
    db_complaints_history: List[Dict[str, Any]]
    duplicate_check: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    recommendations: List[str]
    root_cause_suggestions: List[str]
    capa_recommendations: List[str]
    summary: str

def build_qms_langgraph_workflow() -> StateGraph:
    """
    Constructs and compiles the LangGraph StateGraph workflow for
    Pharmaceutical QMS Customer Complaint Analysis.
    """
    builder = StateGraph(QmsComplaintState)

    # 1. Add Graph Nodes
    builder.add_node("input_processing", input_processing_node)
    builder.add_node("complaint_extraction", extraction_node)
    builder.add_node("information_validation", completeness_node)
    builder.add_node("duplicate_check", duplicate_check_node)
    builder.add_node("risk_assessment", risk_assessment_node)
    builder.add_node("ai_recommendations", recommendations_node)
    builder.add_node("structured_final_output", structured_output_node)

    # 2. Add Sequential Directed Edges
    builder.add_edge(START, "input_processing")
    builder.add_edge("input_processing", "complaint_extraction")
    builder.add_edge("complaint_extraction", "information_validation")
    builder.add_edge("information_validation", "duplicate_check")
    builder.add_edge("duplicate_check", "risk_assessment")
    builder.add_edge("risk_assessment", "ai_recommendations")
    builder.add_edge("ai_recommendations", "structured_final_output")
    builder.add_edge("structured_final_output", END)

    # 3. Compile Graph
    return builder.compile()

# Instantiate compiled workflow
qms_app_graph = build_qms_langgraph_workflow()

def run_qms_complaint_workflow(
    raw_input: str,
    source: str = "Text Prompt",
    db_complaints_history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Executes the LangGraph workflow given an incoming complaint document / text.
    Returns structured QMS AI response object conforming to StructuredAIResponse schema.
    """
    logger.info("Executing LangGraph QMS Complaint Workflow...")
    
    initial_state: QmsComplaintState = {
        "raw_input": raw_input,
        "source": source,
        "db_complaints_history": db_complaints_history or []
    }

    final_state = qms_app_graph.invoke(initial_state)

    complaint_data = final_state.get("extracted_complaint") or final_state.get("complaint") or {}

    return {
        "is_relevant": final_state.get("is_relevant", True),
        "relevance_explanation": final_state.get("relevance_explanation", ""),
        "complaint": complaint_data,
        "completeness": final_state.get("completeness") or {"is_complete": False, "missing_fields": [], "confidence": 0.0},
        "risk_assessment": final_state.get("risk_assessment") or {"risk_level": "Medium", "severity": "Major", "reason": "", "potential_impact": ""},
        "recommendations": final_state.get("recommendations") or [],
        "capa_recommendations": final_state.get("capa_recommendations") or [],
        "root_cause_suggestions": final_state.get("root_cause_suggestions") or [],
        "duplicate_check": final_state.get("duplicate_check") or {"is_duplicate_suspected": False, "similar_complaint_ids": [], "explanation": ""},
        "summary": final_state.get("summary") or ""
    }
