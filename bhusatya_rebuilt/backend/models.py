import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from backend.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    mobile_number = Column(String(20), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    authentication_provider = Column(String(50), default="local")
    role = Column(String(50), default="applicant", nullable=False)  # applicant, approver, admin
    verification_status = Column(String(50), default="VERIFIED")  # PENDING, VERIFIED, SUSPENDED
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    documents = relationship("LandDocument", back_populates="uploader", cascade="all, delete-orphan")
    consent_requests_made = relationship("ConsentRequest", foreign_keys="ConsentRequest.requester_id", back_populates="requester")
    audit_logs = relationship("AuditLog", back_populates="user")

class LandDocument(Base):
    __tablename__ = "land_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    document_type = Column(String(100), nullable=False)  # 7/12_extract, sale_deed, khasra_khatauni, b1, land_map
    secure_storage_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    document_status = Column(String(50), default="UPLOADED")  # UPLOADED, PROCESSING, OCR_COMPLETED, VERIFIED, FLAGGED, REJECTED
    upload_timestamp = Column(DateTime, default=utc_now)

    # Relationships
    uploader = relationship("User", back_populates="documents")
    extracted_data = relationship("ExtractedDocumentData", back_populates="document", uselist=False, cascade="all, delete-orphan")
    parcels = relationship("LandParcel", back_populates="document", cascade="all, delete-orphan")
    consent_requests = relationship("ConsentRequest", back_populates="document", cascade="all, delete-orphan")
    verification_report = relationship("VerificationReport", back_populates="document", uselist=False, cascade="all, delete-orphan")

class ExtractedDocumentData(Base):
    __tablename__ = "extracted_document_data"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("land_documents.id"), nullable=False, unique=True, index=True)
    owner_name = Column(String(255), nullable=True)
    co_owners = Column(JSON, default=list)  # list of strings
    khasra_number = Column(String(100), nullable=True)
    khata_number = Column(String(100), nullable=True)
    land_area = Column(String(100), nullable=True)
    village = Column(String(150), nullable=True)
    tehsil = Column(String(150), nullable=True)
    district = Column(String(150), nullable=True)
    state = Column(String(100), nullable=True)
    registration_number = Column(String(100), nullable=True)
    registration_date = Column(String(50), nullable=True)
    extracted_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, default=0.0)
    field_confidences = Column(JSON, default=dict)
    corrections_history = Column(JSON, default=list)  # list of edit events with user, timestamp, previous, new
    processing_status = Column(String(50), default="COMPLETED")  # PENDING, PROCESSING, COMPLETED, FAILED

    # Relationships
    document = relationship("LandDocument", back_populates="extracted_data")

class LandParcel(Base):
    __tablename__ = "land_parcels"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("land_documents.id"), nullable=True, index=True)
    state = Column(String(100), nullable=False)
    district = Column(String(150), nullable=False)
    tehsil = Column(String(150), nullable=False)
    village = Column(String(150), nullable=False)
    khasra_number = Column(String(100), nullable=False)
    gat_number = Column(String(100), nullable=True)
    ulpin = Column(String(50), index=True, nullable=True)
    owner_name = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area_ha = Column(Float, default=0.0)
    classification = Column(String(100), default="Agricultural")
    coordinate_source = Column(String(100), default="Approximate Inferred")  # Official Cadastral, Approximate Inferred, User GPS, Manual Marker
    location_accuracy = Column(String(50), default="Approximate (10-50m)")
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    document = relationship("LandDocument", back_populates="parcels")

class ConsentRequest(Base):
    __tablename__ = "consent_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("land_documents.id"), nullable=False, index=True)
    requester_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    intended_owner_name = Column(String(255), nullable=False)
    intended_owner_contact = Column(String(150), nullable=False)  # email or phone
    consent_purpose = Column(String(255), nullable=False)  # Due Diligence, Loan Underwriting, Land Purchase
    status = Column(String(50), default="PENDING")  # PENDING, APPROVED, DECLINED, EXPIRED
    requested_at = Column(DateTime, default=utc_now)
    expires_at = Column(DateTime, nullable=False)
    responded_at = Column(DateTime, nullable=True)

    # Relationships
    document = relationship("LandDocument", back_populates="consent_requests")
    requester = relationship("User", foreign_keys=[requester_id], back_populates="consent_requests_made")
    verification = relationship("ConsentVerification", back_populates="consent_request", uselist=False, cascade="all, delete-orphan")

class ConsentVerification(Base):
    __tablename__ = "consent_verifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    consent_request_id = Column(String(36), ForeignKey("consent_requests.id"), nullable=False, unique=True, index=True)
    verification_method = Column(String(50), default="OTP_SMS")  # OTP_SMS, OTP_EMAIL, AADHAAR_ESIGN
    provider_reference = Column(String(150), nullable=True)
    verification_status = Column(String(50), default="PENDING")  # PENDING, VERIFIED, FAILED, EXPIRED
    hashed_otp_challenge = Column(String(255), nullable=True)  # Salted SHA-256 hash, NEVER plaintext
    otp_expires_at = Column(DateTime, nullable=True)
    attempts_count = Column(Integer, default=0)
    last_sent_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)

    # Relationships
    consent_request = relationship("ConsentRequest", back_populates="verification")

class VerificationReport(Base):
    __tablename__ = "verification_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("land_documents.id"), nullable=False, unique=True, index=True)
    report_reference = Column(String(100), unique=True, index=True, nullable=False)
    risk_score = Column(Integer, default=85)  # 0 to 100
    risk_level = Column(String(50), default="LOW")  # LOW, MODERATE, HIGH, BLOCKED
    findings = Column(JSON, default=list)  # list of finding dicts
    limitations = Column(JSON, default=list)  # legal limitations and disclaimers
    sha256_hash = Column(String(64), nullable=True)  # cryptographic document hash
    generated_at = Column(DateTime, default=utc_now)

    # Relationships
    document = relationship("LandDocument", back_populates="verification_report")

class ReferenceRecord(Base):
    __tablename__ = "reference_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    state = Column(String(100), nullable=False)
    district = Column(String(150), nullable=False)
    tehsil = Column(String(150), nullable=False)
    village = Column(String(150), nullable=False)
    khasra_number = Column(String(100), nullable=False)
    gat_number = Column(String(100), nullable=True)
    owner_name = Column(String(255), nullable=False)
    land_area = Column(String(100), nullable=False)
    area_ha = Column(Float, default=1.0)
    is_disputed = Column(Boolean, default=False)
    dispute_details = Column(String(255), nullable=True)
    mortgage_details = Column(String(255), nullable=True)
    source_name = Column(String(100), default="Official State Bhulekh Registry")
    verified_at = Column(DateTime, default=utc_now)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # LOGIN, UPLOAD, OCR_CORRECT, CONSENT_REQUEST, OTP_VERIFY, REPORT_GENERATE
    resource_type = Column(String(50), nullable=False)  # User, Document, Consent, Report
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=utc_now)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
