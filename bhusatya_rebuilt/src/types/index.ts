export type NavScreen =
  | 'citizen-dashboard'
  | 'extract-and-review'
  | 'parcel-check-and-red-flag-gate'
  | 'cadastral-map'
  | 'heir-consent-tracker'
  | 'should-i-buy-this-report'
  | 'certificate-and-verifier'
  | 'revenue-officer-queue';

export type Language = string;

export interface Parcel {
  id: string;
  surveyNo: string;
  gatNo: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  stateCode?: string;
  ulpin: string;
  areaHa: number;
  areaAcres: number;
  classification: string;
  ownerName: string;
  ownerNameMarathi: string;
  jointShareText: string;
  trustScore: number;
  status: 'PASS' | 'WARN' | 'BLOCK';
  statusLabel: string;
  tags: string[];
  lastUpdated: string;
  askingPriceCr: number;
  govtReadyReckonerCr: number;
  unreleasedMortgageAmount: number;
  bankLienHolder: string;
  cersaiId: string;
  hasLitigation: boolean;
  courtCaseNo: string;
  courtCaseDetails: string;
  boundaryOverlapHa: number;
  canalBufferOverlapHa: number;
}

export interface VerificationGate {
  id: number;
  title: string;
  status: 'PASS' | 'WARN' | 'BLOCK';
  description: string;
  icon: string;
  details?: string;
}

export interface DiligencePillar {
  id: number;
  title: string;
  status: 'CLEAR' | 'ACTION REQUIRED' | 'VERIFY ON GROUND' | 'FAIR VALUATION' | 'HIGH RISK';
  scoreBadge?: string;
  badgeType: 'secondary' | 'tertiary' | 'error';
  icon: string;
  description: string;
  metadataText: string;
  nextActionTitle: string;
  nextActionText: string;
  isWide?: boolean;
  courtDetails?: {
    case: string;
    status: string;
    coram: string;
  };
}

export interface RealtimeAlert {
  id: string;
  type: 'consent' | 'mutation' | 'bank';
  title: string;
  timestamp: string;
  description: string;
  badge?: string;
}

export interface Heir {
  id: string;
  name: string;
  relationship: string;
  share: string;
  aadhaarMasked: string;
  status: 'SIGNED' | 'PENDING' | 'DISPUTED';
  signedDate?: string;
  phoneMasked: string;
}
