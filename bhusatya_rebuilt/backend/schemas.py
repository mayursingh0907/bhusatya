from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- Auth Schemas ---
class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    mobile_number: Optional[str] = Field(None, max_length=20)
    password: str = Field(..., min_length=6, max_length=100)
    role: Optional[str] = "applicant"  # applicant, approver, admin
    terms_accepted: bool = Field(..., description="Must accept terms and privacy policy")

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    mobile_number: Optional[str] = None
    role: str
    verification_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Document Schemas ---
class DocumentResponse(BaseModel):
    id: str
    uploaded_by: str
    document_type: str
    original_filename: str
    mime_type: str
    file_size: int
    document_status: str
    upload_timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

# --- OCR & Extraction Schemas ---
class ExtractedDataUpdateRequest(BaseModel):
    owner_name: Optional[str] = None
    co_owners: Optional[List[str]] = None
    khasra_number: Optional[str] = None
    khata_number: Optional[str] = None
    land_area: Optional[str] = None
    village: Optional[str] = None
    tehsil: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    registration_number: Optional[str] = None
    registration_date: Optional[str] = None
    correction_reason: Optional[str] = "Manual user revision"

class ExtractedDataResponse(BaseModel):
    id: str
    document_id: str
    owner_name: Optional[str] = None
    co_owners: List[str] = []
    khasra_number: Optional[str] = None
    khata_number: Optional[str] = None
    land_area: Optional[str] = None
    village: Optional[str] = None
    tehsil: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    registration_number: Optional[str] = None
    registration_date: Optional[str] = None
    extracted_text: Optional[str] = None
    ocr_confidence: float
    field_confidences: Dict[str, float] = {}
    corrections_history: List[Dict[str, Any]] = []
    processing_status: str

    model_config = ConfigDict(from_attributes=True)

# --- Tampering & Verification Schemas ---
class FindingEvidence(BaseModel):
    finding_id: str
    title: str
    description: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    detection_method: str
    confidence: float
    page_number: int = 1
    region_bbox: Optional[List[int]] = None  # [x, y, w, h]
    limitations: str

class VerificationReportResponse(BaseModel):
    id: str
    document_id: str
    report_reference: str
    risk_score: int
    risk_level: str
    findings: List[FindingEvidence]
    limitations: List[str]
    sha256_hash: Optional[str] = None
    generated_at: datetime
    extracted_data: Optional[ExtractedDataResponse] = None
    reference_comparison: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

# --- Consent Schemas ---
class ConsentCreateRequest(BaseModel):
    document_id: str
    intended_owner_name: str
    intended_owner_contact: str
    consent_purpose: str = "Land Purchase Due Diligence"

class ConsentActionRequest(BaseModel):
    action: str = Field(..., description="'approve' or 'decline'")
    reason: Optional[str] = None

class SendOTPRequest(BaseModel):
    channel: Optional[str] = "SMS"  # "SMS" or "EMAIL"

class VerifyOTPRequest(BaseModel):
    otp: str = Field(..., min_length=4, max_length=8)

class ConsentRequestResponse(BaseModel):
    id: str
    document_id: str
    requester_id: str
    requester_name: Optional[str] = None
    intended_owner_name: str
    intended_owner_contact: str
    consent_purpose: str
    status: str
    requested_at: datetime
    expires_at: datetime
    responded_at: Optional[datetime] = None
    verification_status: Optional[str] = None
    attempts_remaining: Optional[int] = 3

    model_config = ConfigDict(from_attributes=True)

# --- Parcel Schemas ---
class LandParcelResponse(BaseModel):
    id: str
    document_id: Optional[str] = None
    state: str
    district: str
    tehsil: str
    village: str
    khasra_number: str
    gat_number: Optional[str] = None
    ulpin: Optional[str] = None
    owner_name: Optional[str] = None
    latitude: float
    longitude: float
    area_ha: float
    classification: str
    coordinate_source: str
    location_accuracy: str

    model_config = ConfigDict(from_attributes=True)

# --- Admin & Audit Schemas ---
class AdminMetricsResponse(BaseModel):
    total_users: int
    total_documents: int
    pending_ocr: int
    manual_review_queue: int
    pending_consent_requests: int
    verified_reports: int
    tampering_flags: int

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
