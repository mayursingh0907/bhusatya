import os
from pathlib import Path
from typing import Set
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseModel):
    APP_NAME: str = "BhuSatya - AI-Powered Land Document Verification Platform"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'bhusatya.db'}")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "bhusatya-super-secure-production-jwt-key-2026-ind")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Upload and Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", str(BASE_DIR / "storage" / "uploads"))
    REPORTS_DIR: str = os.getenv("REPORTS_DIR", str(BASE_DIR / "storage" / "reports"))
    MAX_FILE_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: Set[str] = {"pdf", "png", "jpg", "jpeg", "webp"}
    ALLOWED_MIME_TYPES: Set[str] = {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/webp"
    }

    # OTP and Consent Provider
    OTP_PROVIDER: str = os.getenv("OTP_PROVIDER", "console")  # "console", "msg91", "firebase"
    OTP_PROVIDER_API_KEY: str = os.getenv("OTP_PROVIDER_API_KEY", "")
    OTP_EXPIRY_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 3
    OTP_RESEND_COOLDOWN_SECONDS: int = 60

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
