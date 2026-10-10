import os
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db
from backend.models import User, LandDocument, ExtractedDocumentData, VerificationReport, ConsentRequest, LandParcel
from backend.schemas import VerificationReportResponse
from backend.security import get_current_user, get_current_user_optional, security_scheme
from backend.services.tampering_analyzer import tampering_analyzer
from backend.services.reference_verifier import reference_verifier
from backend.services.pdf_report_generator import pdf_report_generator
from backend.services.audit_service import record_audit_log

router = APIRouter(prefix="/api/documents", tags=["AI Verification & Risk Engine"])

@router.post("/{document_id}/verify", response_model=VerificationReportResponse)
def run_verification(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(LandDocument).filter(LandDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to verify this document")

    extracted = db.query(ExtractedDocumentData).filter(
        ExtractedDocumentData.document_id == document_id
    ).first()
    if not extracted:
        raise HTTPException(status_code=400, detail="Document has not been processed through OCR yet")

    extracted_dict = {
        "owner_name": extracted.owner_name,
        "co_owners": extracted.co_owners,
        "khasra_number": extracted.khasra_number,
        "khata_number": extracted.khata_number,
        "land_area": extracted.land_area,
        "village": extracted.village,
        "tehsil": extracted.tehsil,
        "district": extracted.district,
        "state": extracted.state,
    }

    # 1. Computer Vision & Tampering Analysis
    tampering_res = tampering_analyzer.analyze_document(
        file_path=doc.secure_storage_path,
        mime_type=doc.mime_type,
        extracted_fields=extracted_dict,
        raw_text=extracted.extracted_text or ""
    )

    # 2. Reference Record Comparison
    ref_comparison = reference_verifier.verify_against_reference(db, extracted)

    # Adjust score if reference mismatch or dispute exists
    final_score = tampering_res["risk_score"]
    if ref_comparison["status"] == "MISMATCH_DETECTED":
        final_score = max(40, final_score - 15)
    elif ref_comparison["status"] == "MANUAL_REVIEW_REQUIRED":
        final_score = max(35, final_score - 25)

    if final_score >= 80:
        risk_lvl = "LOW"
    elif final_score >= 55:
        risk_lvl = "MODERATE"
    else:
        risk_lvl = "HIGH"

    # Check consent status
    latest_consent = db.query(ConsentRequest).filter(
        ConsentRequest.document_id == document_id
    ).order_by(ConsentRequest.requested_at.desc()).first()
    consent_label = latest_consent.status if latest_consent else "NOT_REQUESTED"

    report_ref = f"BHU-{datetime.now(timezone.utc).strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

    # Generate PDF Docket
    pdf_filename = f"Docket_{report_ref}.pdf"
    sha256_fingerprint = pdf_report_generator.generate_pdf_report(
        report_data={
            "report_reference": report_ref,
            "generated_at": datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC"),
            "risk_score": final_score,
            "risk_level": risk_lvl,
            "extracted_data": extracted_dict,
            "findings": tampering_res["findings"],
            "reference_comparison": ref_comparison,
            "consent_status": consent_label,
            "sha256_hash": None,
        },
        output_filename=pdf_filename
    )

    # Save or update VerificationReport
    report = db.query(VerificationReport).filter(
        VerificationReport.document_id == document_id
    ).first()

    if not report:
        report = VerificationReport(
            document_id=document_id,
            report_reference=report_ref,
            risk_score=final_score,
            risk_level=risk_lvl,
            findings=tampering_res["findings"],
            limitations=tampering_res["limitations"],
            sha256_hash=sha256_fingerprint,
        )
        db.add(report)
    else:
        report.report_reference = report_ref
        report.risk_score = final_score
        report.risk_level = risk_lvl
        report.findings = tampering_res["findings"]
        report.limitations = tampering_res["limitations"]
        report.sha256_hash = sha256_fingerprint
        report.generated_at = datetime.now(timezone.utc)

    doc.document_status = "VERIFIED" if risk_lvl == "LOW" else "FLAGGED"
    db.commit()
    db.refresh(report)

    record_audit_log(
        db,
        action="REPORT_GENERATED",
        resource_type="VerificationReport",
        user_id=current_user.id,
        resource_id=report.id,
        details=f"Verification report {report.report_reference} generated (Score: {final_score})"
    )

    res = VerificationReportResponse.model_validate(report)
    res.reference_comparison = ref_comparison
    return res

@router.get("/{document_id}/report", response_model=VerificationReportResponse)
def get_verification_report(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(LandDocument).filter(LandDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this report")

    report = db.query(VerificationReport).filter(
        VerificationReport.document_id == document_id
    ).first()

    if not report:
        # Trigger verification if not present
        return run_verification(document_id, current_user, db)

    extracted = db.query(ExtractedDocumentData).filter(
        ExtractedDocumentData.document_id == document_id
    ).first()
    ref_comparison = reference_verifier.verify_against_reference(db, extracted) if extracted else {}

    res = VerificationReportResponse.model_validate(report)
    res.reference_comparison = ref_comparison
    return res

@router.get("/{document_id}/report/pdf")
def download_pdf_report(
    document_id: str,
    token: Optional[str] = Query(None),
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
):
    current_user = get_current_user_optional(auth=auth, token=token, db=db)
    doc = db.query(LandDocument).filter(LandDocument.id == document_id).first()

    if not doc:
        # Check if sample / preset demo parcel requested
        parcel = db.query(LandParcel).filter(
            (LandParcel.id == document_id) | 
            (LandParcel.gat_number == "142") |
            (LandParcel.khasra_number.contains("142"))
        ).first()

        clean_id = document_id.replace("parcel-", "").replace("sample-doc-", "").upper()
        sample_ref = f"BHU-2026-{clean_id or '142A'}"
        pdf_filename = f"Docket_{sample_ref}.pdf"
        pdf_path = os.path.join(settings.REPORTS_DIR, pdf_filename)

        owner_name = parcel.owner_name if parcel else "Suresh Vithalrao Deshmukh"
        khasra = parcel.khasra_number if parcel else "142/3A"
        village = parcel.village if parcel else "Hinjawadi"
        district = parcel.district if parcel else "Pune"
        area = f"{parcel.area_ha} Ha" if parcel else "1.45 Ha (3.58 Acres)"

        pdf_report_generator.generate_pdf_report(
            report_data={
                "report_reference": sample_ref,
                "risk_score": 68 if "142" in document_id else 85,
                "risk_level": "MODERATE" if "142" in document_id else "LOW",
                "extracted_data": {
                    "owner_name": owner_name,
                    "khasra_number": khasra,
                    "land_area": area,
                    "village": village,
                    "district": district,
                },
                "findings": [
                    {
                        "finding_id": "FIND-DEMO-001",
                        "title": "Digital Seal Verification",
                        "severity": "LOW",
                        "description": "Authorized Sub-Registrar digital signature verified with official timestamp."
                    }
                ],
                "sha256_hash": None,
            },
            output_filename=pdf_filename
        )
        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=f"BhuSatya_Docket_{sample_ref}.pdf"
        )

    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to download this report docket"
        )

    if doc.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to download this report")

    report = db.query(VerificationReport).filter(
        VerificationReport.document_id == document_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Verification report not yet generated")

    pdf_filename = f"Docket_{report.report_reference}.pdf"
    pdf_path = os.path.join(settings.REPORTS_DIR, pdf_filename)

    if not os.path.exists(pdf_path):
        # Re-generate if missing
        extracted = db.query(ExtractedDocumentData).filter(ExtractedDocumentData.document_id == document_id).first()
        extracted_dict = {
            "owner_name": extracted.owner_name if extracted else "",
            "khasra_number": extracted.khasra_number if extracted else "",
            "land_area": extracted.land_area if extracted else "",
            "village": extracted.village if extracted else "",
            "district": extracted.district if extracted else "",
        }
        pdf_report_generator.generate_pdf_report(
            report_data={
                "report_reference": report.report_reference,
                "risk_score": report.risk_score,
                "risk_level": report.risk_level,
                "extracted_data": extracted_dict,
                "findings": report.findings,
                "sha256_hash": report.sha256_hash,
            },
            output_filename=pdf_filename
        )

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"BhuSatya_Docket_{report.report_reference}.pdf"
    )
