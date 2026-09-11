from typing import List, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

# Input Schema for raw text/prompt analysis
class ComplaintAnalyzeRequest(BaseModel):
    input_text: str = Field(..., description="Raw complaint description, email body, or transcript")
    source: Optional[str] = "Text Prompt"

# Extracted complaint sub-structure
class ExtractedComplaintData(BaseModel):
    customer_name: Optional[str] = ""
    product_name: Optional[str] = ""
    product_strength: Optional[str] = ""
    batch_number: Optional[str] = ""
    mfg_date: Optional[str] = ""
    expiry_date: Optional[str] = ""
    complaint_type: Optional[str] = ""
    complaint_description: str = ""
    quantity_affected: Optional[Any] = None
    complaint_date: Optional[str] = ""
    source: Optional[str] = "Pharmacy"
    priority: Optional[str] = "Medium"
    originating_site_block: Optional[str] = "Manufacturing"
    impacted_npm: Optional[str] = "Primary Packaging (Bottle)"
    structured_defect_summary: Optional[str] = ""

# Completeness evaluation
class CompletenessInfo(BaseModel):
    is_complete: bool = False
    missing_fields: List[str] = []
    confidence: float = 0.0

# Risk Assessment sub-structure
class RiskAssessmentData(BaseModel):
    risk_level: str = "Medium" # High, Medium, Low
    severity: str = "Major" # Critical, Major, Minor
    priority: Optional[str] = "Medium" # Urgent, High, Medium, Low
    reason: str = ""
    potential_impact: str = ""

# Duplicate Check sub-structure
class DuplicateCheckData(BaseModel):
    is_duplicate_suspected: bool = False
    similar_complaint_ids: List[int] = []
    explanation: str = ""

# Structured Output returned from LangGraph workflow
class StructuredAIResponse(BaseModel):
    is_relevant: bool = True
    relevance_explanation: Optional[str] = ""
    complaint: ExtractedComplaintData
    completeness: CompletenessInfo
    risk_assessment: RiskAssessmentData
    recommendations: List[str] = []
    capa_recommendations: List[str] = []
    root_cause_suggestions: List[str] = []
    duplicate_check: DuplicateCheckData
    summary: str = ""

# DB Save / Update Request Schema
class ComplaintCreateRequest(BaseModel):
    customer_name: Optional[str] = ""
    product_name: Optional[str] = ""
    product_strength: Optional[str] = ""
    batch_number: Optional[str] = ""
    mfg_date: Optional[str] = ""
    expiry_date: Optional[str] = ""
    complaint_type: Optional[str] = ""
    complaint_description: str
    quantity_affected: Optional[Any] = "0"
    complaint_date: Optional[str] = ""
    source: Optional[str] = "Pharmacy"
    status: Optional[str] = "Open"
    originating_site_block: Optional[str] = "Manufacturing"
    impacted_npm: Optional[str] = "Primary Packaging (Bottle)"
    structured_defect_summary: Optional[str] = ""
    
    risk_level: Optional[str] = "Medium"
    severity: Optional[str] = "Major"
    priority: Optional[str] = "Medium"
    risk_reason: Optional[str] = ""
    potential_impact: Optional[str] = ""

    completeness_confidence: Optional[float] = 1.0
    missing_fields: Optional[List[str]] = []
    recommendations: Optional[List[str]] = []
    capa_recommendations: Optional[List[str]] = []
    root_cause_suggestions: Optional[List[str]] = []
    ai_summary: Optional[str] = ""

    is_duplicate_suspected: Optional[bool] = False
    similar_complaint_ids: Optional[List[int]] = []
    duplicate_explanation: Optional[str] = ""

# Re-assess Risk Request Schema
class ReAssessRiskRequest(BaseModel):
    customer_name: Optional[str] = ""
    product_name: Optional[str] = ""
    product_strength: Optional[str] = ""
    batch_number: Optional[str] = ""
    complaint_type: Optional[str] = ""
    complaint_description: str
    quantity_affected: Optional[Any] = 0

# Response Schema for saved complaint
class ComplaintResponse(BaseModel):
    id: int
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    product_strength: Optional[str] = None
    batch_number: Optional[str] = None
    mfg_date: Optional[str] = None
    expiry_date: Optional[str] = None
    complaint_type: Optional[str] = None
    complaint_description: str
    quantity_affected: Optional[Any] = None
    complaint_date: Optional[str] = None
    source: Optional[str] = None
    originating_site_block: Optional[str] = None
    impacted_npm: Optional[str] = None
    structured_defect_summary: Optional[str] = None
    status: str
    
    risk_level: str
    severity: str
    priority: Optional[str] = "Medium"
    risk_reason: Optional[str] = None
    potential_impact: Optional[str] = None

    completeness_confidence: float
    missing_fields: List[str]
    recommendations: List[str]
    capa_recommendations: List[str]
    root_cause_suggestions: List[str]
    ai_summary: Optional[str] = None

    is_duplicate_suspected: bool
    similar_complaint_ids: List[int]
    duplicate_explanation: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Interactive Assistant Chat Schemas
class AssistantChatRequest(BaseModel):
    message: str = Field(..., description="User question or inquiry about the complaint")
    context: Optional[dict] = Field(default_factory=dict, description="Current complaint form & AI context")

class AssistantChatResponse(BaseModel):
    reply: str
    action_type: str = "chat" # "log_complaint", "edit_complaint", "chat"
    updated_form: Optional[dict] = None
    ai_response: Optional[StructuredAIResponse] = None
    suggested_actions: Optional[List[str]] = []

# Dashboard Stats Response
class DashboardStatsResponse(BaseModel):
    total_complaints: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    open_count: int
    investigating_count: int
    capa_pending_count: int
    closed_count: int
    recent_complaints: List[ComplaintResponse]
