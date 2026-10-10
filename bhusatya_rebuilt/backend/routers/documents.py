import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db
from backend.models import User, LandDocument
from backend.schemas import DocumentResponse
from backend.security import get_current_user
from backend.services.audit_service import record_audit_log

router = APIRouter(prefix="/api/documents", tags=["Land Documents"])

MAGIC_NUMBERS = {
    "pdf": b"%PDF-",
    "png": b"\x89PNG\r\n\x1a\n",
    "jpg": b"\xff\xd8\xff",
    "jpeg": b"\xff\xd8\xff",
    "webp": b"RIFF"
}

def validate_file_signature(content: bytes, filename: str) -> str:
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '.{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Magic byte check
    expected_magic = MAGIC_NUMBERS.get(ext)
    if expected_magic:
        if ext == "webp":
            if not content.startswith(b"RIFF") or b"WEBP" not in content[:16]:
                raise HTTPException(status_code=400, detail="Invalid WEBP file signature")
        elif not content.startswith(expected_magic):
            raise HTTPException(
                status_code=400,
                detail=f"Corrupted or invalid file signature for format '{ext}'"
            )

    return ext

@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form("7/12_extract"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Read and validate size
    content = await file.read()
    file_size = len(content)
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
        )
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    ext = validate_file_signature(content, file.filename or "uploaded.pdf")

    # Safe server-side filename (UUID + ext)
    safe_name = f"{uuid.uuid4().hex}.{ext}"
    storage_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    # Write securely
    with open(storage_path, "wb") as f:
        f.write(content)

    doc = LandDocument(
        uploaded_by=current_user.id,
        document_type=document_type,
        secure_storage_path=storage_path,
        original_filename=file.filename or safe_name,
        mime_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        document_status="UPLOADED"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    record_audit_log(
        db,
        action="DOCUMENT_UPLOAD",
        resource_type="LandDocument",
        user_id=current_user.id,
        resource_id=doc.id,
        details=f"Uploaded {doc.original_filename} ({doc.document_type})"
    )

    return DocumentResponse.model_validate(doc)

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        docs = db.query(LandDocument).order_by(LandDocument.upload_timestamp.desc()).all()
    else:
        docs = db.query(LandDocument).filter(
            LandDocument.uploaded_by == current_user.id
        ).order_by(LandDocument.upload_timestamp.desc()).all()
    
    return [DocumentResponse.model_validate(d) for d in docs]

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(LandDocument).filter(LandDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Authorization check
    if doc.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this document")

    return DocumentResponse.model_validate(doc)

@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(LandDocument).filter(LandDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this document")

    if not os.path.exists(doc.secure_storage_path):
        raise HTTPException(status_code=404, detail="Underlying document file not found")

    return FileResponse(
        path=doc.secure_storage_path,
        media_type=doc.mime_type,
        filename=doc.original_filename
    )

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(LandDocument).filter(LandDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")

    if os.path.exists(doc.secure_storage_path):
        try:
            os.remove(doc.secure_storage_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()

    record_audit_log(
        db,
        action="DOCUMENT_DELETE",
        resource_type="LandDocument",
        user_id=current_user.id,
        resource_id=document_id,
        details=f"Deleted document {document_id}"
    )
    return None
