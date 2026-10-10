from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.seed_data import seed_database
from backend.routers import (
    auth,
    documents,
    ocr,
    verification,
    consent,
    parcels,
    admin
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[*] Starting {settings.APP_NAME}")
    seed_database()
    print("[*] Database initialized and verified.")
    yield

app = FastAPI(
    title="BhuSatya API",
    description="AI-Powered Land Document Verification & Owner-Consent Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # open in development for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(ocr.router)
app.include_router(verification.router)
app.include_router(consent.router)
app.include_router(parcels.router)
app.include_router(admin.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": "BhuSatya Verification Backend",
        "version": "1.0.0",
        "otp_provider": settings.OTP_PROVIDER,
        "storage": "ACTIVE",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
