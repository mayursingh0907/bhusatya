// BhuSatya Real API Client with Offline Resilience & Session Token Management

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  mobile_number?: string;
  role: 'applicant' | 'approver' | 'admin';
  verification_status: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface DocumentMeta {
  id: string;
  uploaded_by: string;
  document_type: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  document_status: string;
  upload_timestamp: string;
}

export interface ExtractedData {
  id: string;
  document_id: string;
  owner_name?: string;
  co_owners: string[];
  khasra_number?: string;
  khata_number?: string;
  land_area?: string;
  village?: string;
  tehsil?: string;
  district?: string;
  state?: string;
  registration_number?: string;
  registration_date?: string;
  extracted_text?: string;
  ocr_confidence: number;
  field_confidences: Record<string, number>;
  corrections_history: Array<{
    timestamp: string;
    editor_name: string;
    reason: string;
    changes: Record<string, { old: any; new: any }>;
  }>;
  processing_status: string;
}

export interface Finding {
  finding_id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detection_method: string;
  confidence: number;
  page_number: number;
  region_bbox?: [number, number, number, number];
  limitations: string;
}

export interface VerificationReport {
  id: string;
  document_id: string;
  report_reference: string;
  risk_score: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'BLOCKED';
  findings: Finding[];
  limitations: string[];
  sha256_hash?: string;
  generated_at: string;
  reference_comparison?: {
    status: string;
    status_label: string;
    source: string;
    discrepancies: string[];
    fields_compared: Record<string, any>;
  };
}

export interface ConsentRequestItem {
  id: string;
  document_id: string;
  requester_id: string;
  requester_name?: string;
  intended_owner_name: string;
  intended_owner_contact: string;
  consent_purpose: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED';
  requested_at: string;
  expires_at: string;
  responded_at?: string;
  verification_status?: string;
  attempts_remaining?: number;
}

export interface CadastralParcel {
  id: string;
  state: string;
  district: string;
  tehsil: string;
  village: string;
  khasra_number: string;
  gat_number?: string;
  ulpin?: string;
  owner_name?: string;
  latitude: number;
  longitude: number;
  area_ha: number;
  classification: string;
  coordinate_source: string;
  location_accuracy: string;
}

class ApiService {
  private tokenKey = 'bhusatya_auth_token';
  private userKey = 'bhusatya_auth_user';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setSession(token: string, user: AuthUser) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let detail = `Error ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) detail = errJson.detail;
      } catch {}
      throw new Error(detail);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  }

  // Auth API
  async register(data: {
    full_name: string;
    email: string;
    mobile_number?: string;
    password: string;
    role?: string;
    terms_accepted: boolean;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setSession(res.access_token, res.user);
    return res;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setSession(res.access_token, res.user);
    return res;
  }

  async getMe(): Promise<AuthUser> {
    return this.request<AuthUser>('/api/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {}
    this.clearSession();
  }

  // Documents API
  async uploadDocument(file: File, document_type: string = '7/12_extract'): Promise<DocumentMeta> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', document_type);

    return this.request<DocumentMeta>('/api/documents', {
      method: 'POST',
      body: formData,
    });
  }

  async listDocuments(): Promise<DocumentMeta[]> {
    return this.request<DocumentMeta[]>('/api/documents');
  }

  async getDocument(id: string): Promise<DocumentMeta> {
    return this.request<DocumentMeta>(`/api/documents/${id}`);
  }

  getDocumentDownloadUrl(id: string): string {
    const token = this.getToken();
    return `${API_BASE_URL}/api/documents/${id}/download${token ? `?token=${token}` : ''}`;
  }

  // OCR API
  async triggerOCR(documentId: string): Promise<ExtractedData> {
    return this.request<ExtractedData>(`/api/documents/${documentId}/ocr`, {
      method: 'POST',
    });
  }

  async getOCRData(documentId: string): Promise<ExtractedData> {
    return this.request<ExtractedData>(`/api/documents/${documentId}/ocr`);
  }

  async updateExtractedData(
    documentId: string,
    updates: Partial<ExtractedData> & { correction_reason?: string }
  ): Promise<ExtractedData> {
    return this.request<ExtractedData>(`/api/documents/${documentId}/extracted-data`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Verification & Risk Engine API
  async verifyDocument(documentId: string): Promise<VerificationReport> {
    return this.request<VerificationReport>(`/api/documents/${documentId}/verify`, {
      method: 'POST',
    });
  }

  async getVerificationReport(documentId: string): Promise<VerificationReport> {
    return this.request<VerificationReport>(`/api/documents/${documentId}/report`);
  }

  getReportPdfUrl(documentId: string): string {
    const token = this.getToken();
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${API_BASE_URL}/api/documents/${documentId}/report/pdf${query}`;
  }

  async downloadReportPdfBlob(documentId: string): Promise<void> {
    const url = this.getReportPdfUrl(documentId);
    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to download report PDF (Status: ${res.status})`);
    }
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `BhuSatya_Docket_${documentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  }

  // Consent & OTP API
  async createConsentRequest(data: {
    document_id: string;
    intended_owner_name: string;
    intended_owner_contact: string;
    consent_purpose: string;
  }): Promise<ConsentRequestItem> {
    return this.request<ConsentRequestItem>('/api/consent-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listConsentRequests(): Promise<ConsentRequestItem[]> {
    return this.request<ConsentRequestItem[]>('/api/consent-requests');
  }

  async getConsentRequest(id: string): Promise<ConsentRequestItem> {
    return this.request<ConsentRequestItem>(`/api/consent-requests/${id}`);
  }

  async sendConsentOTP(requestId: string): Promise<{
    success: boolean;
    message: string;
    provider: string;
    expires_in_minutes: number;
    cooldown_seconds: number;
    delivery_note?: string;
  }> {
    return this.request(`/api/consent-requests/${requestId}/send-otp`, {
      method: 'POST',
      body: JSON.stringify({ channel: 'SMS' }),
    });
  }

  async verifyConsentOTP(requestId: string, otp: string): Promise<{
    success: boolean;
    verified: boolean;
    message: string;
  }> {
    return this.request(`/api/consent-requests/${requestId}/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  }

  async takeConsentAction(requestId: string, action: 'approve' | 'decline', reason?: string): Promise<{
    success: boolean;
    status: string;
    message: string;
  }> {
    return this.request(`/api/consent-requests/${requestId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  }

  // GIS Parcels API
  async listParcels(params?: { state?: string; district?: string; village?: string; query?: string }): Promise<CadastralParcel[]> {
    const q = new URLSearchParams();
    if (params?.state) q.append('state', params.state);
    if (params?.district) q.append('district', params.district);
    if (params?.village) q.append('village', params.village);
    if (params?.query) q.append('query', params.query);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return this.request<CadastralParcel[]>(`/api/parcels${queryString}`);
  }

  async matchNearestParcel(lat: number, lng: number): Promise<{
    parcel: CadastralParcel;
    distance_meters: number;
    coordinate_source: string;
    location_accuracy: string;
  }> {
    return this.request('/api/parcels/match-nearest', {
      method: 'POST',
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    });
  }

  // Admin API
  async getAdminMetrics(): Promise<{
    total_users: number;
    total_documents: number;
    pending_ocr: number;
    manual_review_queue: number;
    pending_consent_requests: number;
    verified_reports: number;
    tampering_flags: number;
  }> {
    return this.request('/api/admin/metrics');
  }

  async listAdminUsers(role?: string): Promise<AuthUser[]> {
    const q = role ? `?role=${role}` : '';
    return this.request<AuthUser[]>(`/api/admin/users${q}`);
  }

  async updateAdminUserStatus(userId: string, status: string, role?: string): Promise<AuthUser> {
    return this.request<AuthUser>(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ verification_status: status, role }),
    });
  }

  async getAdminAuditLogs(limit: number = 50): Promise<Array<{
    id: string;
    user_id?: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    details?: string;
    ip_address?: string;
    timestamp: string;
  }>> {
    return this.request(`/api/admin/audit-logs?limit=${limit}`);
  }

  async getAdminReviewQueue(): Promise<VerificationReport[]> {
    return this.request<VerificationReport[]>('/api/admin/review-queue');
  }

  async resolveReview(reportId: string, decision: 'APPROVED' | 'REJECTED' | 'ESCALATED', notes: string): Promise<any> {
    return this.request(`/api/admin/review-queue/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    });
  }
}

export const api = new ApiService();
