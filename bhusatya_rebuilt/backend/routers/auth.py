from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from backend.database import get_db
from backend.models import User
from backend.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    PasswordResetRequest,
    UserResponse,
    TokenResponse
)
from backend.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)
from backend.services.audit_service import record_audit_log

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    # Validate terms
    if not req.terms_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must accept the terms of service and privacy policy."
        )

    # Check duplicate
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    # Valid role: applicant, approver, admin
    role = req.role if req.role in ["applicant", "approver", "admin"] else "applicant"

    user = User(
        full_name=req.full_name.strip(),
        email=req.email.lower(),
        mobile_number=req.mobile_number,
        hashed_password=hash_password(req.password),
        role=role,
        verification_status="VERIFIED"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    record_audit_log(
        db,
        action="USER_REGISTRATION",
        resource_type="User",
        user_id=user.id,
        resource_id=user.id,
        details=f"User registered with role {user.role}"
    )

    access_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if user.verification_status == "SUSPENDED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact the administrator."
        )

    record_audit_log(
        db,
        action="USER_LOGIN",
        resource_type="User",
        user_id=user.id,
        resource_id=user.id,
        details="Successful login"
    )

    access_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record_audit_log(
        db,
        action="USER_LOGOUT",
        resource_type="User",
        user_id=current_user.id,
        resource_id=current_user.id,
        details="Session terminated"
    )
    return {"message": "Logged out successfully"}

@router.post("/password-reset")
def password_reset(req: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        # Generic response to prevent email enumeration
        return {"message": "If this email is registered, the password has been updated."}

    user.hashed_password = hash_password(req.new_password)
    db.commit()

    record_audit_log(
        db,
        action="PASSWORD_RESET",
        resource_type="User",
        user_id=user.id,
        resource_id=user.id,
        details="Password reset via self-service verification"
    )

    return {"message": "If this email is registered, the password has been updated."}
