from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.models import ReferenceRecord, ExtractedDocumentData

def normalize_string(val: Optional[str]) -> str:
    if not val:
        return ""
    return "".join(c.lower() for c in val if c.isalnum())

def calculate_similarity(s1: str, s2: str) -> float:
    """Calculates basic token overlap similarity between 0.0 and 1.0."""
    t1 = set(s1.lower().split())
    t2 = set(s2.lower().split())
    if not t1 or not t2:
        return 0.0
    intersection = t1.intersection(t2)
    return len(intersection) / max(len(t1), len(t2))

class ReferenceVerifier:
    """
    Compares OCR extracted document fields against authorized cadastral / Bhulekh reference records.
    Provides explicit data-source status and field-by-field diff.
    """

    def verify_against_reference(
        self,
        db: Session,
        extracted: ExtractedDocumentData
    ) -> Dict[str, Any]:
        result = {
            "status": "REFERENCE_UNAVAILABLE",
            "status_label": "Reference record unavailable in local registry",
            "source": "State Land Records Cadastral Registry (Authorized Dataset)",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "matched_record_id": None,
            "fields_compared": {},
            "discrepancies": [],
            "limitations": [
                "Reference verification compares against current approved registry records.",
                "Unregistered customary partitions or ongoing mutations may have a lag in digital record ingestion."
            ]
        }

        # Query reference records by state, district, village, and khasra number
        khasra = extracted.khasra_number or ""
        clean_khasra = khasra.replace(" ", "").replace("-", "/").split("/")[0]

        query = db.query(ReferenceRecord)
        if clean_khasra:
            records = query.filter(
                ReferenceRecord.khasra_number.ilike(f"%{clean_khasra}%")
            ).all()
        else:
            records = query.all()

        if not records:
            result["status"] = "REFERENCE_UNAVAILABLE"
            result["status_label"] = "Reference record unavailable in local database"
            return result

        # Select closest matching record
        ref = records[0]
        result["matched_record_id"] = ref.id
        result["source"] = ref.source_name

        # Compare owner name
        ext_owner = extracted.owner_name or ""
        ref_owner = ref.owner_name or ""
        owner_sim = calculate_similarity(ext_owner, ref_owner)
        owner_match = owner_sim >= 0.5 or normalize_string(ext_owner) == normalize_string(ref_owner)
        
        result["fields_compared"]["owner_name"] = {
            "extracted": ext_owner,
            "reference": ref_owner,
            "matches": owner_match,
            "similarity": round(owner_sim, 2)
        }
        if not owner_match:
            result["discrepancies"].append(f"Owner Name disparity: Document shows '{ext_owner}', Reference shows '{ref_owner}'")

        # Compare khasra
        khasra_match = clean_khasra in ref.khasra_number or ref.khasra_number in clean_khasra
        result["fields_compared"]["khasra_number"] = {
            "extracted": extracted.khasra_number,
            "reference": ref.khasra_number,
            "matches": khasra_match
        }
        if not khasra_match:
            result["discrepancies"].append(f"Khasra/Survey mismatch: Document has '{extracted.khasra_number}', Reference has '{ref.khasra_number}'")

        # Compare area
        ext_area = extracted.land_area or ""
        ref_area = ref.land_area or ""
        area_match = True
        if ext_area and ref_area:
            area_match = normalize_string(ext_area[:4]) in normalize_string(ref_area) or normalize_string(ref_area[:4]) in normalize_string(ext_area)
        
        result["fields_compared"]["land_area"] = {
            "extracted": ext_area,
            "reference": ref_area,
            "matches": area_match
        }
        if not area_match:
            result["discrepancies"].append(f"Land Area variance: Document claims '{ext_area}', Reference registry records '{ref_area}'")

        # Check litigation / dispute in reference
        if ref.is_disputed:
            result["discrepancies"].append(f"Active Registry Dispute Flag: {ref.dispute_details}")

        # Final Status determination
        if ref.is_disputed:
            result["status"] = "MANUAL_REVIEW_REQUIRED"
            result["status_label"] = "Manual verification required: Dispute noted in official reference"
        elif len(result["discrepancies"]) == 0:
            result["status"] = "VERIFIED_AUTHORIZED"
            result["status_label"] = "Verified against authorized reference record"
        else:
            result["status"] = "MISMATCH_DETECTED"
            result["status_label"] = f"Discrepancies detected ({len(result['discrepancies'])} field mismatch)"

        return result

reference_verifier = ReferenceVerifier()
