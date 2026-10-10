import os
import io
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import User, LandDocument, ConsentRequest, ConsentVerification
from backend.database import SessionLocal
from backend.services.consent_service import consent_security

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "service" in data

def test_user_registration_and_login():
    # 1. Register a new user
    reg_payload = {
        "full_name": "Test Applicant",
        "email": "testapplicant@example.com",
        "mobile_number": "+919811223344",
        "password": "Password@123",
        "role": "applicant",
        "terms_accepted": True
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code in [201, 409]  # 201 on first run, 409 if exists

    # 2. Login
    login_payload = {
        "email": "testapplicant@example.com",
        "password": "Password@123"
    }
    res_login = client.post("/api/auth/login", json=login_payload)
    assert res_login.status_code == 200
    token_data = res_login.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # 3. Access /api/auth/me
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "testapplicant@example.com"

def test_unauthorized_access_rejected():
    res = client.get("/api/documents")
    assert res.status_code == 401

def test_invalid_file_upload_rejected():
    # Login as seeded citizen
    login_res = client.post("/api/auth/login", json={
        "email": "citizen@bhusatya.in",
        "password": "Citizen@12345"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Try uploading a disallowed exe / malicious file
    fake_file = io.BytesIO(b"MALICIOUS_EXEC_CONTENT")
    res = client.post(
        "/api/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("malware.exe", fake_file, "application/octet-stream")},
        data={"document_type": "sale_deed"}
    )
    assert res.status_code == 400
    assert "Unsupported file extension" in res.json()["detail"]

def test_valid_pdf_upload_and_ocr():
    login_res = client.post("/api/auth/login", json={
        "email": "citizen@bhusatya.in",
        "password": "Citizen@12345"
    })
    token = login_res.json()["access_token"]

    # Valid PDF mock
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF"
    fake_pdf = io.BytesIO(pdf_content)

    upload_res = client.post(
        "/api/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("satbara_712_sample.pdf", fake_pdf, "application/pdf")},
        data={"document_type": "7/12_extract"}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    # Trigger OCR
    ocr_res = client.post(
        f"/api/documents/{doc_id}/ocr",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert ocr_res.status_code == 200
    ocr_data = ocr_res.json()
    assert ocr_data["owner_name"] is not None
    assert ocr_data["khasra_number"] is not None
    assert ocr_data["ocr_confidence"] > 0

    # Verification Report
    verify_res = client.post(
        f"/api/documents/{doc_id}/verify",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert verify_res.status_code == 200
    report_data = verify_res.json()
    assert "risk_score" in report_data
    assert "findings" in report_data
    assert "reference_comparison" in report_data

def test_consent_request_and_otp_workflow():
    login_res = client.post("/api/auth/login", json={
        "email": "citizen@bhusatya.in",
        "password": "Citizen@12345"
    })
    token = login_res.json()["access_token"]

    # Get user documents
    docs_res = client.get("/api/documents", headers={"Authorization": f"Bearer {token}"})
    assert docs_res.status_code == 200
    docs = docs_res.json()
    assert len(docs) > 0
    doc_id = docs[0]["id"]

    # Create consent request
    consent_res = client.post(
        "/api/consent-requests",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "document_id": doc_id,
            "intended_owner_name": "Vasantrao Ganpatrao Deshmukh",
            "intended_owner_contact": "+919422034567",
            "consent_purpose": "Bank Home Loan Due Diligence"
        }
    )
    assert consent_res.status_code == 201
    consent_id = consent_res.json()["id"]

    # Send OTP
    send_otp_res = client.post(
        f"/api/consent-requests/{consent_id}/send-otp",
        headers={"Authorization": f"Bearer {token}"},
        json={"channel": "SMS"}
    )
    assert send_otp_res.status_code == 200
    assert send_otp_res.json()["success"] is True

    # Test bad OTP rejection
    bad_otp_res = client.post(
        f"/api/consent-requests/{consent_id}/verify-otp",
        headers={"Authorization": f"Bearer {token}"},
        json={"otp": "000000"}
    )
    assert bad_otp_res.status_code == 400
    assert "Invalid verification code" in bad_otp_res.json()["detail"]

    # Approve consent action
    action_res = client.post(
        f"/api/consent-requests/{consent_id}/action",
        headers={"Authorization": f"Bearer {token}"},
        json={"action": "approve", "reason": "Land owner verified"}
    )
    assert action_res.status_code == 200
    assert action_res.json()["status"] == "APPROVED"

def test_admin_metrics_and_rbca():
    # Regular citizen trying to access admin metrics should be denied
    citizen_login = client.post("/api/auth/login", json={
        "email": "citizen@bhusatya.in",
        "password": "Citizen@12345"
    })
    citizen_token = citizen_login.json()["access_token"]

    denied_res = client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {citizen_token}"})
    assert denied_res.status_code == 403

    # Admin access should succeed
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@bhusatya.gov.in",
        "password": "Admin@12345"
    })
    admin_token = admin_login.json()["access_token"]

    admin_res = client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_res.status_code == 200
    metrics = admin_res.json()
    assert metrics["total_users"] >= 3
    assert metrics["total_documents"] >= 1
