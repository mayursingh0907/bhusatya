from typing import Optional
from sqlalchemy.orm import Session
from backend.models import AuditLog

def record_audit_log(
    db: Session,
    action: str,
    resource_type: str,
    user_id: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
):
    """Save an immutable audit record for security and regulatory compliance."""
    log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(log)
    db.commit()
    return log
