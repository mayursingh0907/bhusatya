import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Parcel } from '../../types';

interface CertificateVerifierProps {
  currentParcel: Parcel;
}

type VerifierTab = 'qr-generator' | 'field-scanner';
type DocumentType = 'diligence-report' | 'ror-712' | 'heir-noc' | 'cadastral-mojani' | 'mutation-ferfar';

export const CertificateVerifier: React.FC<CertificateVerifierProps> = ({ currentParcel }) => {
  const [activeTab, setActiveTab] = useState<VerifierTab>('qr-generator');

  // Document Type & Metadata for QR Generation
  const [docType, setDocType] = useState<DocumentType>('diligence-report');
  const [ulpin, setUlpin] = useState(currentParcel.ulpin);
  const [surveyNo, setSurveyNo] = useState(currentParcel.surveyNo);
  const [village, setVillage] = useState(currentParcel.village);
  const [district, setDistrict] = useState(currentParcel.district);
  const [ownerName, setOwnerName] = useState(currentParcel.ownerName);

  // QR Code Settings
  const [qrColor, setQrColor] = useState<'#0f172a' | '#065f46' | '#111827'>('#0f172a');
  const [qrSize, setQrSize] = useState<number>(240);
  const [embedEmblem, setEmbedEmblem] = useState<boolean>(true);
  const [payloadType, setPayloadType] = useState<'url' | 'compact-token'>('url');

  // Generated QR output state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Field Officer Verification Simulation
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    valid: boolean;
    docTitle: string;
    ulpin: string;
    surveyNo: string;
    owner: string;
    location: string;
    hash: string;
    certSerial: string;
    issuedBy: string;
    status: 'PASS' | 'WARN' | 'BLOCK';
    statusNotes: string;
    timestamp: string;
  } | null>(null);
  const [officerStampAdded, setOfficerStampAdded] = useState(false);

  // Sync state if currentParcel changes
  useEffect(() => {
    setUlpin(currentParcel.ulpin);
    setSurveyNo(currentParcel.surveyNo);
    setVillage(currentParcel.village);
    setDistrict(currentParcel.district);
    setOwnerName(currentParcel.ownerName);
  }, [currentParcel]);

  // Compute verifiable payload
  const verificationUrl = `https://bhusatya.gov.in/verify?ulpin=${encodeURIComponent(
    ulpin
  )}&survey=${encodeURIComponent(surveyNo)}&doc=${docType}&sha256=e87c32a819b9104fa`;

  const compactTokenPayload = JSON.stringify({
    iss: 'Govt. of India / BhuSatya DILRMP',
    doc: docType,
    ulpin,
    srv: surveyNo,
    vil: village,
    dist: district,
    own: ownerName,
    score: currentParcel.trustScore,
    status: currentParcel.status,
    sha: 'e87c32a819b9104fa2899bc0192837f4e1b9a9103c81928019a823b491823719',
    ts: new Date().toISOString(),
  });

  const rawPayload = payloadType === 'url' ? verificationUrl : compactTokenPayload;

  // Generate QR Code via qrcode package
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(rawPayload, {
      width: qrSize * 2, // 2x for sharp retina canvas
      margin: 2,
      color: {
        dark: qrColor,
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [rawPayload, qrColor, qrSize]);

  // Copy payload / link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopyFeedback('Verification URL copied to clipboard.');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // Download QR image
  const handleDownloadQR = (format: 'png' | 'svg') => {
    if (format === 'png') {
      const a = document.createElement('a');
      a.href = qrDataUrl;
      a.download = `BhuSatya_QRCode_${ulpin}_${docType}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      QRCode.toString(rawPayload, {
        type: 'svg',
        color: { dark: qrColor, light: '#ffffff' },
        errorCorrectionLevel: 'H',
      }).then((svgString) => {
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BhuSatya_QRCode_${ulpin}_${docType}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  };

  // Trigger Field Scan Simulation
  const handleSimulateScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setOfficerStampAdded(false);
    setActiveTab('field-scanner');

    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        valid: currentParcel.status !== 'BLOCK',
        docTitle:
          docType === 'diligence-report'
            ? 'BhuSatya Certified Title Diligence Report'
            : docType === 'ror-712'
            ? '7/12 Satbara Official Revenue Extract'
            : docType === 'heir-noc'
            ? 'Coparcenary Heir Consent & NOC Deed (HSA 2005)'
            : docType === 'cadastral-mojani'
            ? 'Field Measurement Book (FMB) Cadastral Map'
            : 'Mutation (Ferfar) Entry & Title Lineage',
        ulpin,
        surveyNo,
        owner: ownerName,
        location: `${village}, Taluka ${currentParcel.taluka}, Dist. ${district} (${currentParcel.state})`,
        hash: 'SHA256: e87c32a819b9104fa2899bc0192837f4e1b9a9103c81928019a823b491823719',
        certSerial: 'IN-DILRMP-2024-C3-994109',
        issuedBy: 'Digital India Land Records Modernization Programme (DoLR)',
        status: currentParcel.status,
        statusNotes:
          currentParcel.status === 'BLOCK'
            ? 'REGISTRY FROZEN: Active Injunction in Civil Suit 842/2021 & Court Review.'
            : currentParcel.status === 'WARN'
            ? 'CONDITIONAL: Pending Heir Signatory (Sunita Sharma) - 2 of 3 heirs consent verified.'
            : 'VERIFIED: Unbroken 30-year lineage, zero active mortgage liens, clear title.',
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      });
    }, 1000);
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Top Header Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
              </span>
              <div>
                <h1 className="text-xl md:text-2xl text-slate-900 font-bold tracking-tight">
                  Document Authenticator & Field Officer QR Engine
                </h1>
                <p className="text-xs text-slate-500">
                  Generate secure tamper-proof verification badges for revenue officers, buyers, and field inspection squads
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              NIC DILRMP Verifier Live
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('qr-generator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'qr-generator'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">qr_code_scanner</span>
            <span>Document QR Code Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('field-scanner')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'field-scanner'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">document_scanner</span>
            <span>Field Officer Verification Dossier</span>
          </button>
        </div>
      </section>

      {/* TAB 1: QR CODE GENERATOR */}
      {activeTab === 'qr-generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Document Configuration & Parameters */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-700 text-[18px]">tune</span>
                Configure Land Document Authentication QR
              </h2>
              <p className="text-xs text-slate-500">
                Select target document type and customize the verification payload encoded for field officials.
              </p>
            </div>

            {/* Document Type Selector Grid */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Target Land Document Classification
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  {
                    id: 'diligence-report',
                    title: 'Title Diligence Report',
                    desc: 'Comprehensive BhuSatya audit docket with 5 pillars',
                    icon: 'assignment',
                  },
                  {
                    id: 'ror-712',
                    title: '7/12 RoR Extract',
                    desc: 'State land records ledger and crop tenancy entry',
                    icon: 'receipt_long',
                  },
                  {
                    id: 'heir-noc',
                    title: 'Coparcenary Heir Consent',
                    desc: 'Digital eSign NOC under Hindu Succession Act',
                    icon: 'how_to_reg',
                  },
                  {
                    id: 'cadastral-mojani',
                    title: 'Cadastral Mojani Map',
                    desc: 'DGPS calibrated field boundary survey sketch',
                    icon: 'map',
                  },
                  {
                    id: 'mutation-ferfar',
                    title: 'Mutation (Ferfar) Deed',
                    desc: '30-year unbroken mutation transaction certificate',
                    icon: 'history_edu',
                  },
                ].map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setDocType(doc.id as DocumentType)}
                    className={`p-3 rounded-lg border text-left transition-colors flex items-start gap-2.5 ${
                      docType === doc.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg mt-0.5 shrink-0">
                      {doc.icon}
                    </span>
                    <div>
                      <div className="font-semibold text-xs">{doc.title}</div>
                      <div className={`text-[11px] mt-0.5 ${docType === doc.id ? 'text-slate-300' : 'text-slate-500'}`}>
                        {doc.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Land Details Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Unique Land Parcel Identifier (ULPIN)
                </label>
                <input
                  type="text"
                  value={ulpin}
                  onChange={(e) => setUlpin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Cadastral Survey / Gat No.
                </label>
                <input
                  type="text"
                  value={surveyNo}
                  onChange={(e) => setSurveyNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Village & Taluka
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Registered Titleholder Name
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Styling & Payload Options */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Theme Selector */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-700 block">Professional Ink</span>
                  <div className="flex items-center gap-2">
                    {[
                      { hex: '#0f172a', name: 'National Slate' },
                      { hex: '#065f46', name: 'GovTech Emerald' },
                      { hex: '#111827', name: 'Classic Black' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setQrColor(c.hex as any)}
                        title={c.name}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          qrColor === c.hex ? 'scale-110 ring-2 ring-slate-900' : 'opacity-70'
                        }`}
                        style={{ backgroundColor: c.hex, borderColor: '#ffffff' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Center Emblem Toggle */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-700 block">Security Emblem</span>
                  <button
                    type="button"
                    onClick={() => setEmbedEmblem(!embedEmblem)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      embedEmblem
                        ? 'bg-slate-100 text-slate-900 border-slate-300'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {embedEmblem ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>{embedEmblem ? 'Emblem Overlay' : 'Plain QR'}</span>
                  </button>
                </div>

                {/* Resolution */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-700 block">Resolution</span>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    {[200, 240, 300].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setQrSize(size)}
                        className={`px-2.5 py-0.5 rounded-md font-semibold transition-colors ${
                          qrSize === size ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        {size}px
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payload Mode Switcher */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-semibold text-slate-700 block">Payload Type</span>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="payloadType"
                      checked={payloadType === 'url'}
                      onChange={() => setPayloadType('url')}
                      className="accent-slate-900"
                    />
                    <span className="font-medium text-slate-800">Verification URL (Mobile & Camera)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="payloadType"
                      checked={payloadType === 'compact-token'}
                      onChange={() => setPayloadType('compact-token')}
                      className="accent-slate-900"
                    />
                    <span className="font-medium text-slate-800">Signed Token (Offline Field Scanner)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Live QR Card & Actions */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-2xs flex flex-col items-center text-center space-y-4">
            <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                DILRMP Authenticity Stamp
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                Level-H 30% ECC
              </span>
            </div>

            {/* Live QR Matrix Display Container */}
            <div className="relative p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center">
              {qrDataUrl ? (
                <div className="relative inline-block">
                  <img
                    src={qrDataUrl}
                    alt="Official BhuSatya Land Document QR Code"
                    style={{ width: `${qrSize}px`, height: `${qrSize}px` }}
                    className="rounded-lg object-contain"
                  />
                  {/* Central GovTech Emblem Overlay */}
                  {embedEmblem && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-11 h-11 rounded-lg bg-white p-1 shadow-sm border border-slate-300 flex items-center justify-center">
                        <img
                          src="https://lh3.googleusercontent.com/aida/AEtjO1VC6Lvfw1ZNmLyeETiRRdEE4O0xO9UF59J5XKvkHwaqsRxjXIOFL3iv08WuHUnzY2OvEmJJ-MZ0hsLM9tIyIfOPU0EZF4XuxV3ILITcBimVUhtZ18LTc8a9IpLTZGa8bI6iapPl1IbcAbIAQ_r5uJHBjUva_IMqxsbJ9EU3yVoUPBnA7GmpdP05_VkzEq0iqwhiLwuCIJ38ubi1gx24rEpzWEEE17mMQrfMmZXwJvlx6RKuwkOsXQ7IA86w"
                          alt="National Emblem"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-500">
                  Rendering QR Matrix...
                </div>
              )}
            </div>

            {/* Document Context Ribbon */}
            <div className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 text-left space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Survey {surveyNo}</span>
                <span className="font-mono text-slate-600 font-bold">{ulpin}</span>
              </div>
              <div className="text-[11px] text-slate-600 truncate">
                Titleholder: <strong className="text-slate-800">{ownerName}</strong> · {village}
              </div>
              <div className="text-[10px] font-mono text-slate-500 truncate pt-0.5">
                SHA-256: e87c32a819b9104fa2899bc0192837f4...
              </div>
            </div>

            {/* Toast Feedback */}
            {copyFeedback && (
              <div className="w-full bg-slate-900 text-white py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-400">check</span>
                <span>{copyFeedback}</span>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="w-full space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSimulateScan}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                <span>Verify in Field Officer Scanner</span>
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadQR('png')}
                  className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">image</span>
                  <span>PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadQR('svg')}
                  className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">vector_polygon</span>
                  <span>SVG</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">content_copy</span>
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIELD OFFICER SCANNER & VERIFICATION DOSSIER */}
      {activeTab === 'field-scanner' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-700 text-xl">camera</span>
                  Field Inspection Scanner
                </h2>
                <p className="text-xs text-slate-500">
                  Simulates handheld camera barcode reading of physical deeds presented during on-ground land audits.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSimulateScan}
                disabled={isScanning}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shrink-0 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">
                  {isScanning ? 'sync' : 'restart_alt'}
                </span>
                <span>{isScanning ? 'Scanning...' : 'Rescan Document'}</span>
              </button>
            </div>

            {isScanning ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-slate-700">
                  Querying NIC Central Cadastral Server cluster & verifying SHA-256 seal...
                </p>
              </div>
            ) : scanResult ? (
              <div className="space-y-4 pt-1">
                {/* Result Status Banner */}
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    scanResult.status === 'PASS'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : scanResult.status === 'WARN'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl shrink-0">
                      {scanResult.status === 'PASS'
                        ? 'verified'
                        : scanResult.status === 'WARN'
                        ? 'warning'
                        : 'cancel'}
                    </span>
                    <div>
                      <div className="font-bold text-sm">
                        {scanResult.status === 'PASS'
                          ? 'AUTHENTIC CERTIFIED DOCUMENT'
                          : scanResult.status === 'WARN'
                          ? 'CAUTION: CONDITIONAL RECORD'
                          : 'REJECTED: ADVERSE LEGAL NOTICE'}
                      </div>
                      <div className="text-xs opacity-90">{scanResult.statusNotes}</div>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-semibold shrink-0">
                    {scanResult.certSerial}
                  </span>
                </div>

                {/* Scanned Certificate Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block text-xs border-b border-slate-200 pb-1">
                      Document Identification
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Document Name:</span>
                      <span className="font-semibold text-slate-800">{scanResult.docTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ULPIN:</span>
                      <span className="font-mono font-bold text-slate-900">{scanResult.ulpin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Survey / Gat No:</span>
                      <span className="font-mono font-bold text-slate-900">{scanResult.surveyNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jurisdiction:</span>
                      <span className="font-semibold text-slate-800">{scanResult.location}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block text-xs border-b border-slate-200 pb-1">
                      Audit Trail & Digital Seal
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Verified Titleholder:</span>
                      <span className="font-bold text-slate-900">{scanResult.owner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Authority:</span>
                      <span className="font-semibold text-slate-800">{scanResult.issuedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Scan Timestamp:</span>
                      <span className="font-mono text-slate-700">{scanResult.timestamp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SHA-256 Hash:</span>
                      <span className="font-mono text-[10px] text-slate-600 truncate max-w-[200px]">
                        {scanResult.hash}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Field Officer Seal Action */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-700 text-lg">badge</span>
                    <span className="text-xs text-slate-700 font-medium">
                      {officerStampAdded
                        ? 'Field Inspection Seal Affixed by Revenue Officer (Class-3 DSC UIDAI).'
                        : 'Affix field inspection seal to record on-ground physical boundary verification.'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOfficerStampAdded(true)}
                    disabled={officerStampAdded}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                      officerStampAdded
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {officerStampAdded ? 'verified' : 'approval'}
                    </span>
                    <span>{officerStampAdded ? 'Seal Recorded' : 'Affix Officer Seal'}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
