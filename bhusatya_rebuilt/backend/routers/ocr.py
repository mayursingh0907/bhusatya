from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, LandDocument, ExtractedDocumentData
from backend.schemas import ExtractedDataResponse, ExtractedDataUpdateRequest
from backend.security import get_current_user
from backend.services.ocr_engine import ocr_engine
from backend.services.audit_service import record_audit_log

router = APIRouter(prefix="/api/documents", tags=["OCR Extraction Engine"])

@router.post("/{document_id}/ocr", response_model=ExtractedDataResponse)
def trigger_ocr(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(LandDocument).filter(LandDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to process this document")

    # Run OCR Pipeline
    ocr_result = ocr_engine.process_document(
        file_path=doc.secure_storage_path,
        mime_type=doc.mime_type,
        filename=doc.original_filename
    )

    fields = ocr_result["fields"]
    confidences = ocr_result["confidences"]

    # Check if existing extracted record exists
    extracted = db.query(ExtractedDocumentData).filter(
        ExtractedDocumentData.document_id == document_id
    ).first()

    if not extracted:
        extracted = ExtractedDocumentData(
            document_id=document_id,
            owner_name=fields.get("owner_name"),
            co_owners=fields.get("co_owners", []),
            khasra_number=fields.get("khasra_number"),
            khata_number=fields.get("khata_number"),
            land_area=fields.get("land_area"),
            village=fields.get("village"),
            tehsil=fields.get("tehsil"),
            district=fields.get("district"),
            state=fields.get("state"),
            registration_number=fields.get("registration_number"),
            registration_date=fields.get("registration_date"),
            extracted_text=ocr_result["raw_text"],
            ocr_confidence=ocr_result["overall_confidence"],
            field_confidences=confidences,
            corrections_history=[],
            processing_status="COMPLETED"
        )
        db.add(extracted)
    else:
        extracted.owner_name = fields.get("owner_name")
        extracted.co_owners = fields.get("co_owners", [])
        extracted.khasra_number = fields.get("khasra_number")
        extracted.khata_number = fields.get("khata_number")
        extracted.land_area = fields.get("land_area")
        extracted.village = fields.get("village")
        extracted.tehsil = fields.get("tehsil")
        extracted.district = fields.get("district")
        extracted.state = fields.get("state")
        extracted.registration_number = fields.get("registration_number")
        extracted.registration_date = fields.get("registration_date")
        extracted.extracted_text = ocr_result["raw_text"]
        extracted.ocr_confidence = ocr_result["overall_confidence"]
        extracted.field_confidences = confidences
        extracted.processing_status = "COMPLETED"

    doc.document_status = "OCR_COMPLETED"
    db.commit()
    db.refresh(extracted)

    record_audit_log(
        db,
        action="OCR_EXTRACTION_COMPLETED",
        resource_type="ExtractedDocumentData",
        user_id=current_user.id,
        resource_id=extracted.id,
        details=f"Extracted fields for document {document_id} with confidence {extracted.ocr_confidence}"
    )

    return ExtractedDataResponse.model_validate(extracted)

@router.get("/{document_id}/ocr", response_model=ExtractedDataResponse)
def get_extracted_data(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(LandDocument).filter(LandDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this document")

    extracted = db.query(ExtractedDocumentData).filter(
        ExtractedDocumentData.document_id == document_id
    ).first()

    if not extracted:
        # Auto-trigger if not yet run
        return trigger_ocr(document_id, current_user, db)

    return ExtractedDataResponse.model_validate(extracted)

@router.patch("/{document_id}/extracted-data", response_model=ExtractedDataResponse)
def update_extracted_data(
    document_id: str,
    req: ExtractedDataUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(LandDocument).filter(LandDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this document")

    extracted = db.query(ExtractedDocumentData).filter(
        ExtractedDocumentData.document_id == document_id
    ).first()
    if not extracted:
        raise HTTPException(status_code=400, detail="Run OCR extraction first before editing")

    changes = {}
    if req.owner_name is not None and req.owner_name != extracted.owner_name:
        changes["owner_name"] = {"old": extracted.owner_name, "new": req.owner_name}
        extracted.owner_name = req.owner_name
    if req.khasra_number is not None and req.khasra_number != extracted.khasra_number:
        changes["khasra_number"] = {"old": extracted.khasra_number, "new": req.khasra_number}
        extracted.khasra_number = req.khasra_number
    if req.khata_number is not None and req.khata_number != extracted.khata_number:
        changes["khata_number"] = {"old": extracted.khata_number, "new": req.khata_number}
        extracted.khata_number = req.khata_number
    if req.land_area is not None and req.land_area != extracted.land_area:
        changes["land_area"] = {"old": extracted.land_area, "new": req.land_area}
        extracted.land_area = req.land_area
    if req.village is not None and req.village != extracted.village:
        changes["village"] = {"old": extracted.village, "new": req.village}
        extracted.village = req.village
    if req.tehsil is not None and req.tehsil != extracted.tehsil:
        changes["tehsil"] = {"old": extracted.tehsil, "new": req.tehsil}
        extracted.tehsil = req.tehsil
    if req.district is not None and req.district != extracted.district:
        changes["district"] = {"old": extracted.district, "new": req.district}
        extracted.district = req.district
    if req.registration_number is not None and req.registration_number != extracted.registration_number:
        changes["registration_number"] = {"old": extracted.registration_number, "new": req.registration_number}
        extracted.registration_number = req.registration_number

    if changes:
        history_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "editor_id": current_user.id,
            "editor_name": current_user.full_name,
            "reason": req.correction_reason,
            "changes": changes
        }
        extracted.corrections_history = (extracted.corrections_history or []) + [history_entry]
        db.commit()
        db.refresh(extracted)

        record_audit_log(
            db,
            action="OCR_FIELD_CORRECTION",
            resource_type="ExtractedDocumentData",
            user_id=current_user.id,
            resource_id=extracted.id,
            details=f"Fields corrected: {list(changes.keys())} ({req.correction_reason})"
        )

    return ExtractedDataResponse.model_validate(extracted)
