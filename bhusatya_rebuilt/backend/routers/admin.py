from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db
from backend.models import User, LandDocument, VerificationReport, ConsentRequest, AuditLog
from backend.schemas import (
    UserResponse,
    AdminMetricsResponse,
    AuditLogResponse,
    VerificationReportResponse
)
from backend.security import get_current_user, require_role
from backend.services.audit_service import record_audit_log

router = APIRouter(prefix="/api/admin", tags=["Administrator Dashboard"])

class UpdateUserStatusRequest(BaseModel):
    verification_status: str  # VERIFIED, SUSPENDED, PENDING
    role: Optional[str] = None  # applicant, approver, admin

class ResolveReviewRequest(BaseModel):
    decision: str  # APPROVED, REJECTED, ESCALATED
    notes: str

@router.get("/metrics", response_model=AdminMetricsResponse)
def get_admin_metrics(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_documents = db.query(LandDocument).count()
    pending_ocr = db.query(LandDocument).filter(LandDocument.document_status == "UPLOADED").count()
    manual_review_queue = db.query(LandDocument).filter(LandDocument.document_status.in_(["FLAGGED", "PROCESSING"])).count()
    pending_consent = db.query(ConsentRequest).filter(ConsentRequest.status == "PENDING").count()
    verified_reports = db.query(VerificationReport).count()
    tampering_flags = db.query(VerificationReport).filter(VerificationReport.risk_level.in_(["HIGH", "MODERATE"])).count()

    return AdminMetricsResponse(
        total_users=total_users,
        total_documents=total_documents,
        pending_ocr=pending_ocr,
        manual_review_queue=manual_review_queue,
        pending_consent_requests=pending_consent,
        verified_reports=verified_reports,
        tampering_flags=tampering_flags,
    )

@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    role: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if status_filter:
        q = q.filter(User.verification_status == status_filter)
    
    users = q.order_by(User.created_at.desc()).all()
    return [UserResponse.model_validate(u) for u in users]

@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: str,
    req: UpdateUserStatusRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.verification_status = req.verification_status
    if req.role:
        user.role = req.role
    db.commit()
    db.refresh(user)

    record_audit_log(
        db,
        action="ADMIN_USER_MODIFICATION",
        resource_type="User",
        user_id=current_user.id,
        resource_id=user.id,
        details=f"Admin updated user status to {req.verification_status}, role to {user.role}"
    )

    return UserResponse.model_validate(user)

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(50, le=200),
    action: Optional[str] = Query(None),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action.ilike(f"%{action}%"))
    logs = q.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [AuditLogResponse.model_validate(l) for l in logs]

@router.get("/review-queue", response_model=List[VerificationReportResponse])
def get_manual_review_queue(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    reports = db.query(VerificationReport).filter(
        VerificationReport.risk_level.in_(["HIGH", "MODERATE"])
    ).order_by(VerificationReport.generated_at.desc()).all()
    return [VerificationReportResponse.model_validate(r) for r in reports]

@router.post("/review-queue/{report_id}/resolve")
def resolve_review(
    report_id: str,
    req: ResolveReviewRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    report = db.query(VerificationReport).filter(VerificationReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.risk_level = "LOW" if req.decision == "APPROVED" else "BLOCKED"
    if report.document:
        report.document.document_status = "VERIFIED" if req.decision == "APPROVED" else "REJECTED"

    db.commit()

    record_audit_log(
        db,
        action="ADMIN_REVIEW_RESOLVED",
        resource_type="VerificationReport",
        user_id=current_user.id,
        resource_id=report.id,
        details=f"Decision: {req.decision} | Notes: {req.notes}"
    )

    return {
        "success": True,
        "report_id": report_id,
        "new_status": report.risk_level,
        "decision": req.decision
    }
