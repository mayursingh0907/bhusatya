# BhuSatya (भू-सत्य) — AI-Powered Land Document Verification Platform

BhuSatya is an enterprise-grade cadastral title verification, document tampering analysis, and landowner-consent platform built under the principles of India's Digital India Land Records Modernization Programme (DILRMP).

---

## Key Features

1. **Secure Authentication & RBAC**:
   - Role-based access control for **Applicant**, **Landowner (Consent Approver)**, and **Administrator (Revenue Officer)**.
   - Salted `bcrypt` password hashing, signed JWT tokens, and strict server-side authorization.

2. **Protected Land Document Ingestion**:
   - Multi-format support: PDF, JPEG, PNG, WEBP.
   - File signature validation (magic bytes), size enforcement (max 15MB), path traversal prevention, and private server-side storage paths.

3. **OCR Extraction Pipeline**:
   - OpenCV-based image preprocessing: CLAHE contrast enhancement, deskewing via Hough transform, Gaussian noise reduction, and adaptive binarization.
   - Rule-based multi-lingual parser extracting: Primary Owner, Co-owners, Khasra/Gat Number, Khata Number, Area (Ha/Acres), Village, Tehsil, District, State, Registration Number, and Date.
   - Field-level confidence scores, missing-field alerts, and editable corrections with immutable audit history.

4. **AI-Based Tampering & Inconsistency Analysis**:
   - **Error Level Analysis (ELA)**: 90% Q-factor compression disparity analysis to detect spliced or composited text blocks.
   - Contour and line baseline irregularity detection.
   - Revenue stamp and official seal optical spectrum segmentation using HSV dye masks.
   - Explicit finding evidence with bounding box coordinates `[x, y, w, h]`, severity ratings, model confidence, and statutory limitations.

5. **Landowner Consent & Secure OTP Engine**:
   - Consent-first workflow separating channel verification from legal ownership claims.
   - Pluggable provider adapter (`ConsoleMockOTPProvider`, `Msg91OTPProvider`, `FirebaseOTPProvider`).
   - Short-lived, salted HMAC-SHA256 OTP challenges (never stored in plaintext).
   - Rate limiting: 60-second cooldown, max 3 attempts limit, 5-minute expiry, and immediate post-use challenge invalidation.

6. **Interactive Cadastral GIS & GPS Map**:
   - Leaflet with OpenStreetMap tiles (not a static image).
   - "Use My Location" browser Geolocation API with explicit permission, lat/lng readout, and accuracy circle.
   - Cadastral parcel markers, polygon boundary overlays, village/district/survey search, and nearest parcel match.

7. **Reference Record Verification**:
   - Provider-independent comparison against official state cadastral reference records.
   - Explicit data source statuses (`Verified against authorized reference record`, `Mismatch detected`, `Reference record unavailable`, `Manual review required`).

8. **Verifiable PDF Docket Generator**:
   - ReportLab generation of official diligence dockets with cryptographic SHA-256 fingerprint, evidence tables, Satya Trust Score, and statutory legal disclaimers.

9. **Administrator Dashboard**:
   - Real-time system metrics, user activation/suspension, manual-review adjudication queue, and immutable audit logs.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Leaflet, Lucide Icons, Motion.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy ORM, Pydantic v2, PyJWT, Bcrypt, PyPDF, ReportLab, OpenCV (cv2), NumPy.
- **Database**: SQLite (default local development) / PostgreSQL with PostGIS support.
- **Testing**: Pytest, HTTPX TestClient.

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22)
- **Python**: 3.10+ (tested on Python 3.13)

### 2. Install Dependencies

```bash
# Frontend dependencies
npm install --legacy-peer-deps

# Backend Python dependencies
pip install -r requirements.txt
```

### 3. Initialize & Seed Database

```bash
# Seed default users, reference records, and cadastral parcels
python -m backend.seed_data
```

### 4. Run the Backend API

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
*API Documentation will be accessible at: `http://localhost:8000/docs`*

### 5. Run the Frontend Dev Server

```bash
npm run dev
```
*Open `http://localhost:3000` in your browser.*

---

## Automated Test Suite

Run the full pytest suite covering authentication, file upload security, OCR extraction, tampering analyzer, consent OTP lifecycle, and admin RBAC:

```bash
python -m pytest backend/tests/test_bhusatya.py -v
```

---

## Seed Accounts (Quick Evaluation)

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@bhusatya.gov.in` | `Admin@12345` | System Metrics, User Management, Adjudication Queue, Audit Logs |
| **Applicant** | `citizen@bhusatya.in` | `Citizen@12345` | Document Upload, OCR Review, Diligence Report, Map Inspector |
| **Landowner** | `owner@bhusatya.in` | `Owner@12345` | Consent Request Review, OTP Challenge Authorization |

---

## Docker Deployment

Build and run using Docker Compose:

```bash
docker-compose up --build -d
```

Check health status:
```bash
curl http://localhost:8000/api/health
```

---

## Statutory Disclaimer
BhuSatya diligence reports represent automated computer-assisted preliminary screenings. They do **not** constitute an official Land Title Certificate or conclusive judicial proof of ownership. Physical registry verification at the Sub-Registrar's Office remains mandatory.

---

## Deployment

- **Backend (FastAPI)** → Render, using `render.yaml` (Docker). Health check: `/api/health`.
- **Frontend (Vite/React)** → Vercel, using `vercel.json`. Set the env var
  `VITE_API_BASE_URL` to the Render backend URL (no trailing slash) before deploying.
