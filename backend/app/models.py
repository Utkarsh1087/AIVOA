import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime
from app.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_name = Column(String(255), index=True, nullable=True)
    product_name = Column(String(255), index=True, nullable=True)
    product_strength = Column(String(100), nullable=True)
    batch_number = Column(String(100), index=True, nullable=True)
    mfg_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    complaint_type = Column(String(150), index=True, nullable=True)
    complaint_description = Column(Text, nullable=False)
    quantity_affected = Column(String(100), nullable=True, default="0")
    complaint_date = Column(String(50), nullable=True)
    source = Column(String(100), nullable=True, default="Direct Entry")
    
    # Facility & Material Impact
    originating_site_block = Column(String(150), nullable=True, default="Manufacturing")
    impacted_npm = Column(String(255), nullable=True, default="Primary Packaging (Bottle)")

    # Defect Analysis
    structured_defect_summary = Column(Text, nullable=True)
    
    # Workflow status: Open, Under Investigation, CAPA Pending, Closed
    status = Column(String(50), default="Open", index=True)

    # Risk Assessment & Priority
    risk_level = Column(String(50), default="Medium", index=True) # High, Medium, Low
    severity = Column(String(50), default="Major") # Critical, Major, Minor
    priority = Column(String(50), default="Medium") # Urgent, High, Medium, Low
    risk_reason = Column(Text, nullable=True)
    potential_impact = Column(Text, nullable=True)

    # AI Quality metrics & features
    completeness_confidence = Column(Float, default=1.0)
    missing_fields_json = Column(Text, default="[]")
    recommendations_json = Column(Text, default="[]")
    capa_recommendations_json = Column(Text, default="[]")
    root_cause_suggestions_json = Column(Text, default="[]")
    ai_summary = Column(Text, nullable=True)

    # Duplicate check
    is_duplicate_suspected = Column(Boolean, default=False)
    similar_complaint_ids_json = Column(Text, default="[]")
    duplicate_explanation = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Helpers for JSON deserialization
    @property
    def missing_fields(self):
        try:
            return json.loads(self.missing_fields_json) if self.missing_fields_json else []
        except Exception:
            return []

    @property
    def recommendations(self):
        try:
            return json.loads(self.recommendations_json) if self.recommendations_json else []
        except Exception:
            return []

    @property
    def capa_recommendations(self):
        try:
            return json.loads(self.capa_recommendations_json) if self.capa_recommendations_json else []
        except Exception:
            return []

    @property
    def root_cause_suggestions(self):
        try:
            return json.loads(self.root_cause_suggestions_json) if self.root_cause_suggestions_json else []
        except Exception:
            return []

    @property
    def similar_complaint_ids(self):
        try:
            return json.loads(self.similar_complaint_ids_json) if self.similar_complaint_ids_json else []
        except Exception:
            return []
