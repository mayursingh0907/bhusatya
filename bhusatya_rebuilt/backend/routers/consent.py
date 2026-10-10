from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db
from backend.models import User, LandDocument, ConsentRequest, ConsentVerification
from backend.schemas import (
    ConsentCreateRequest,
    ConsentRequestResponse,
    ConsentActionRequest,
    SendOTPRequest,
    VerifyOTPRequest
)
from backend.security import get_current_user
from backend.services.consent_service import consent_security, get_otp_provider
from backend.services.audit_service import record_audit_log

router = APIRouter(prefix="/api/consent-requests", tags=["Landowner Consent & OTP Verification"])

def to_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

@router.post("", response_model=ConsentRequestResponse, status_code=status.HTTP_201_CREATED)
def create_consent_request(
    req: ConsentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(LandDocument).filter(LandDocument.id == req.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Referenced land document not found")

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    consent = ConsentRequest(
        document_id=req.document_id,
        requester_id=current_user.id,
        intended_owner_name=req.intended_owner_name.strip(),
        intended_owner_contact=req.intended_owner_contact.strip(),
        consent_purpose=req.consent_purpose.strip(),
        status="PENDING",
        expires_at=expires_at
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)

    # Initialize verification challenge container
    verification = ConsentVerification(
        consent_request_id=consent.id,
        verification_method="OTP_SMS",
        verification_status="PENDING",
        attempts_count=0,
        last_sent_at=None
    )
    db.add(verification)
    db.commit()

    record_audit_log(
        db,
        action="CONSENT_REQUEST_CREATED",
        resource_type="ConsentRequest",
        user_id=current_user.id,
        resource_id=consent.id,
        details=f"Created consent request to {consent.intended_owner_name} ({consent.consent_purpose})"
    )

    res = ConsentRequestResponse.model_validate(consent)
    res.requester_name = current_user.full_name
    res.verification_status = "PENDING"
    return res

@router.get("", response_model=List[ConsentRequestResponse])
def list_consent_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        requests = db.query(ConsentRequest).order_by(ConsentRequest.requested_at.desc()).all()
    else:
        # Match as requester OR as intended owner
        requests = db.query(ConsentRequest).filter(
            (ConsentRequest.requester_id == current_user.id) |
            (ConsentRequest.intended_owner_contact == current_user.email) |
            (ConsentRequest.intended_owner_contact == current_user.mobile_number)
        ).order_by(ConsentRequest.requested_at.desc()).all()

    output = []
    for r in requests:
        item = ConsentRequestResponse.model_validate(r)
        item.requester_name = r.requester.full_name if r.requester else "Applicant"
        if r.verification:
            item.verification_status = r.verification.verification_status
            item.attempts_remaining = max(0, settings.OTP_MAX_ATTEMPTS - r.verification.attempts_count)
        output.append(item)
    return output

@router.get("/{request_id}", response_model=ConsentRequestResponse)
def get_consent_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ConsentRequest).filter(ConsentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Consent request not found")

    item = ConsentRequestResponse.model_validate(req)
    item.requester_name = req.requester.full_name if req.requester else "Applicant"
    if req.verification:
        item.verification_status = req.verification.verification_status
        item.attempts_remaining = max(0, settings.OTP_MAX_ATTEMPTS - req.verification.attempts_count)
    return item

@router.post("/{request_id}/send-otp")
def send_otp(
    request_id: str,
    send_req: SendOTPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consent = db.query(ConsentRequest).filter(ConsentRequest.id == request_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent request not found")

    if consent.status == "EXPIRED" or (consent.expires_at and to_utc(consent.expires_at) < datetime.now(timezone.utc)):
        consent.status = "EXPIRED"
        db.commit()
        raise HTTPException(status_code=400, detail="Consent request has expired")

    verification = db.query(ConsentVerification).filter(
        ConsentVerification.consent_request_id == request_id
    ).first()

    if not verification:
        verification = ConsentVerification(
            consent_request_id=request_id,
            verification_method="OTP_SMS",
            attempts_count=0
        )
        db.add(verification)

    # Check resend cooldown
    if verification.last_sent_at:
        elapsed = (datetime.now(timezone.utc) - to_utc(verification.last_sent_at)).total_seconds()
        if elapsed < settings.OTP_RESEND_COOLDOWN_SECONDS:
            cooldown_left = int(settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {cooldown_left}s before requesting a new OTP."
            )

    # Reset attempts for new OTP challenge
    otp_code, hashed_challenge = consent_security.generate_secure_otp()
    verification.hashed_otp_challenge = hashed_challenge
    verification.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    verification.attempts_count = 0
    verification.last_sent_at = datetime.now(timezone.utc)
    verification.verification_status = "PENDING"

    # Dispatch via configured provider
    provider = get_otp_provider()
    success, prov_ref = provider.send_otp(
        recipient=consent.intended_owner_contact,
        otp_code=otp_code,
        purpose=f"BhuSatya Consent: {consent.consent_purpose}"
    )

    verification.provider_reference = prov_ref
    db.commit()

    record_audit_log(
        db,
        action="OTP_DISPATCHED",
        resource_type="ConsentVerification",
        user_id=current_user.id,
        resource_id=verification.id,
        details=f"Dispatched OTP challenge to {consent.intended_owner_contact[:3]}... via {settings.OTP_PROVIDER}"
    )

    # Security rule: NEVER return plaintext OTP in API response.
    # We return provider dispatch confirmation and expiry info.
    return {
        "success": True,
        "message": f"Verification code sent to {consent.intended_owner_contact[:3]}••••{consent.intended_owner_contact[-3:] if len(consent.intended_owner_contact) >= 6 else ''}",
        "provider": settings.OTP_PROVIDER,
        "expires_in_minutes": settings.OTP_EXPIRY_MINUTES,
        "cooldown_seconds": settings.OTP_RESEND_COOLDOWN_SECONDS,
        # In development console mode, provide guidance that it was printed to the server terminal
        "delivery_note": "For local development/testing, check the backend console logs for the issued verification code."
    }

@router.post("/{request_id}/verify-otp")
def verify_otp(
    request_id: str,
    req: VerifyOTPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consent = db.query(ConsentRequest).filter(ConsentRequest.id == request_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent request not found")

    verification = db.query(ConsentVerification).filter(
        ConsentVerification.consent_request_id == request_id
    ).first()

    if not verification or not verification.hashed_otp_challenge:
        raise HTTPException(status_code=400, detail="No active OTP challenge found. Please request a new code.")

    # Check expiry
    if verification.otp_expires_at and to_utc(verification.otp_expires_at) < datetime.now(timezone.utc):
        verification.verification_status = "EXPIRED"
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new code.")

    # Check attempt limits
    if verification.attempts_count >= settings.OTP_MAX_ATTEMPTS:
        verification.verification_status = "FAILED"
        verification.hashed_otp_challenge = None  # Invalidate challenge
        db.commit()
        raise HTTPException(
            status_code=403,
            detail="Maximum verification attempts exceeded. Please request a new challenge."
        )

    # Increment attempt count
    verification.attempts_count += 1

    # Verify challenge
    is_valid = consent_security.verify_otp_challenge(req.otp, verification.hashed_otp_challenge)
    if not is_valid:
        remaining = max(0, settings.OTP_MAX_ATTEMPTS - verification.attempts_count)
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining."
        )

    # Invalidate challenge on success to prevent replay
    verification.hashed_otp_challenge = None
    verification.verification_status = "VERIFIED"
    verification.verified_at = datetime.now(timezone.utc)
    db.commit()

    record_audit_log(
        db,
        action="OTP_VERIFIED_SUCCESS",
        resource_type="ConsentVerification",
        user_id=current_user.id,
        resource_id=verification.id,
        details="OTP channel verification successfully confirmed"
    )

    return {
        "success": True,
        "verified": True,
        "message": "Contact channel verified successfully. You may now approve or decline consent."
    }

@router.post("/{request_id}/action")
def take_consent_action(
    request_id: str,
    action_req: ConsentActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consent = db.query(ConsentRequest).filter(ConsentRequest.id == request_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent request not found")

    action = action_req.action.lower()
    if action not in ["approve", "decline"]:
        raise HTTPException(status_code=400, detail="Action must be either 'approve' or 'decline'")

    # Set explicit outcome
    consent.status = "APPROVED" if action == "approve" else "DECLINED"
    consent.responded_at = datetime.now(timezone.utc)
    db.commit()

    record_audit_log(
        db,
        action=f"CONSENT_{consent.status}",
        resource_type="ConsentRequest",
        user_id=current_user.id,
        resource_id=consent.id,
        details=f"Owner consent {consent.status.lower()}ed. Reason: {action_req.reason or 'None'}"
    )

    return {
        "success": True,
        "status": consent.status,
        "message": f"Consent request has been {consent.status.lower()}ed."
    }
