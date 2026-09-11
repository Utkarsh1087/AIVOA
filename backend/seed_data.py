import json
import logging
from datetime import datetime, timezone, timedelta
from app.database import SessionLocal, Base, engine
from app.models import Complaint

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_qms")

SAMPLE_DATA = [
    {
        "customer_name": "ABC Healthcare Facilities",
        "product_name": "Paracetamol",
        "product_strength": "500mg Tablets",
        "batch_number": "PCM202604",
        "mfg_date": "2026-01-15",
        "expiry_date": "2028-01-14",
        "complaint_type": "Packaging Defect / Physical Integrity",
        "complaint_description": "Received shipment of 20 boxes. 15 blister strips contain crushed foil and broken tablets with powder residue inside secondary cartons.",
        "quantity_affected": 20,
        "complaint_date": "2026-09-08",
        "source": "Customer Email",
        "status": "Under Investigation",
        "risk_level": "High",
        "severity": "Critical",
        "priority": "High",
        "risk_reason": "Broken tablets and compromised blister foil packaging lead to particulate loss and atmospheric moisture exposure, risking dosage inaccuracy.",
        "potential_impact": "Compromised barrier seal on batch PCM202604. Requires quarantine of remaining lot at warehouse.",
        "completeness_confidence": 0.95,
        "missing_fields": [],
        "recommendations": [
            "Initiate immediate warehouse quarantine for batch PCM202604.",
            "Request physical sample return from ABC Healthcare."
        ],
        "capa_recommendations": [
            "Inspect mechanical guide rails on Blister Packaging Line 4.",
            "Review shipping carton drop test protocol with third-party logistics."
        ],
        "root_cause_suggestions": [
            "Excessive sealing pressure on primary packaging station.",
            "Inadequate vibration dampening in shipping carton."
        ],
        "ai_summary": "Customer reported 20 units of Paracetamol 500mg (PCM202604) with crushed blister packaging and tablet breakage.",
        "is_duplicate_suspected": False,
        "similar_complaint_ids": [],
        "duplicate_explanation": "First reported incident for batch PCM202604."
    },
    {
        "customer_name": "Global Pharma Wholesalers",
        "product_name": "Amoxicillin",
        "product_strength": "250mg Suspension",
        "batch_number": "AMX8821",
        "mfg_date": "2025-11-20",
        "expiry_date": "2027-11-19",
        "complaint_type": "Physical Integrity / Discoloration",
        "complaint_description": "Suspension powder exhibits yellowish discoloration and clump formation prior to reconstitution.",
        "quantity_affected": 150,
        "complaint_date": "2026-09-05",
        "source": "Quality Incident Portal",
        "status": "CAPA Pending",
        "risk_level": "High",
        "severity": "Critical",
        "priority": "Urgent",
        "risk_reason": "Pre-reconstitution powder discoloration indicates moisture ingress or thermal degradation, affecting active ingredient potency.",
        "potential_impact": "Potential sub-potency of antibiotic treatment. High risk of field safety notice.",
        "completeness_confidence": 1.0,
        "missing_fields": [],
        "recommendations": [
            "Quarantine batch AMX8821 in active distribution warehouses.",
            "Perform HPLC assay and moisture content testing on retention samples."
        ],
        "capa_recommendations": [
            "Audit induction heat sealing parameters on Bottle Filling Line 2.",
            "Inspect desiccating cap supplier batch certificates for lot D-9901."
        ],
        "root_cause_suggestions": [
            "Inadequate induction seal foil adhesion allowing humidity ingress.",
            "Excursion above 25°C during sea freight transit."
        ],
        "ai_summary": "Powder discoloration and clumping in Amoxicillin 250mg suspension batch AMX8821 reported by wholesaler.",
        "is_duplicate_suspected": False,
        "similar_complaint_ids": [],
        "duplicate_explanation": "No prior duplicates logged."
    },
    {
        "customer_name": "St. Jude Hospital Pharmacy",
        "product_name": "Insulin Glargine Vials",
        "product_strength": "100 IU/mL (10mL)",
        "batch_number": "INS-7721",
        "mfg_date": "2026-03-01",
        "expiry_date": "2028-02-28",
        "complaint_type": "Labeling / Barcode Read Failure",
        "complaint_description": "Automated dispensing cabinet barcode scanner failed on 12 vials due to misaligned 2D Datamatrix code on vial labels.",
        "quantity_affected": 12,
        "complaint_date": "2026-09-02",
        "source": "Customer Call",
        "status": "Open",
        "risk_level": "Medium",
        "severity": "Major",
        "priority": "Medium",
        "risk_reason": "Barcode readability failure delays hospital medication dispensing, though product sterility and chemical potency are unaffected.",
        "potential_impact": "Hospital dispensing delays; potential manual administration entry errors.",
        "completeness_confidence": 0.88,
        "missing_fields": [],
        "recommendations": [
            "Provide St. Jude Pharmacy with verified replacement units.",
            "Test print quality and scan grade on retention batch INS-7721."
        ],
        "capa_recommendations": [
            "Install in-line machine vision verification camera on Vial Labeler 1.",
            "Establish daily print contrast calibration checklist for thermal transfer printheads."
        ],
        "root_cause_suggestions": [
            "Faded thermal transfer ribbon during end of labeling shift.",
            "Vial label curved surface distortion during high-speed wrap application."
        ],
        "ai_summary": "12 vials of Insulin Glargine INS-7721 failed automated dispensing scan due to barcode print misalignment.",
        "is_duplicate_suspected": False,
        "similar_complaint_ids": [],
        "duplicate_explanation": "Single occurrence logged."
    },
    {
        "customer_name": "Metro Community Health",
        "product_name": "Ibuprofen Liquid Gel Caps",
        "product_strength": "400mg",
        "batch_number": "IBU-9904",
        "mfg_date": "2025-08-10",
        "expiry_date": "2027-08-09",
        "complaint_type": "Cosmetic / Outer Carton Scuff",
        "complaint_description": "Secondary outer shipping carton arrived with minor scuffs and torn exterior tape. Inner blister cards and capsules are intact and undamaged.",
        "quantity_affected": 5,
        "complaint_date": "2026-08-28",
        "source": "Direct Entry",
        "status": "Closed",
        "risk_level": "Low",
        "severity": "Minor",
        "priority": "Low",
        "risk_reason": "Superficial exterior carton damage with fully intact tamper-evident seals and undamaged primary blister cavities.",
        "potential_impact": "None. Product safety, efficacy, and sterility fully maintained.",
        "completeness_confidence": 1.0,
        "missing_fields": [],
        "recommendations": [
            "Issue standard customer credit or outer packaging replacement.",
            "Log in QMS annual trend review report."
        ],
        "capa_recommendations": [
            "Feedback to logistics carrier regarding carton strapping tension."
        ],
        "root_cause_suggestions": [
            "Rough handling by courier during regional pallet cross-docking."
        ],
        "ai_summary": "Minor exterior shipping carton abrasion on Ibuprofen batch IBU-9904; internal product intact.",
        "is_duplicate_suspected": False,
        "similar_complaint_ids": [],
        "duplicate_explanation": "Low risk cosmetic issue."
    }
]

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        logger.info("Seeding database with updated pharmaceutical customer complaints...")
        for data in SAMPLE_DATA:
            c = Complaint(
                customer_name=data["customer_name"],
                product_name=data["product_name"],
                product_strength=data["product_strength"],
                batch_number=data["batch_number"],
                mfg_date=data["mfg_date"],
                expiry_date=data["expiry_date"],
                complaint_type=data["complaint_type"],
                complaint_description=data["complaint_description"],
                quantity_affected=data["quantity_affected"],
                complaint_date=data["complaint_date"],
                source=data["source"],
                status=data["status"],
                risk_level=data["risk_level"],
                severity=data["severity"],
                priority=data["priority"],
                risk_reason=data["risk_reason"],
                potential_impact=data["potential_impact"],
                completeness_confidence=data["completeness_confidence"],
                missing_fields_json=json.dumps(data["missing_fields"]),
                recommendations_json=json.dumps(data["recommendations"]),
                capa_recommendations_json=json.dumps(data["capa_recommendations"]),
                root_cause_suggestions_json=json.dumps(data["root_cause_suggestions"]),
                ai_summary=data["ai_summary"],
                is_duplicate_suspected=data["is_duplicate_suspected"],
                similar_complaint_ids_json=json.dumps(data["similar_complaint_ids"]),
                duplicate_explanation=data["duplicate_explanation"],
                created_at=datetime.now(timezone.utc) - timedelta(days=10)
            )
            db.add(c)
        
        db.commit()
        logger.info("Successfully seeded updated QMS sample complaints!")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
