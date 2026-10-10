import React, { useState } from 'react';
import { NavScreen, Parcel } from '../../types';

interface ExtractAndReviewProps {
  currentParcel: Parcel;
  onNavigate: (screen: NavScreen) => void;
  onUpdateParcel?: (updated: Partial<Parcel>) => void;
  customDocData?: { name: string; url?: string; type: string } | null;
}

export const ExtractAndReview: React.FC<ExtractAndReviewProps> = ({
  currentParcel,
  onNavigate,
  onUpdateParcel,
  customDocData,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [showBBoxes, setShowBBoxes] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [highlightField, setHighlightField] = useState<string | null>(null);

  // Rejection modal & status notice
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Illegible Talathi Stamp & Signatures');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Editable fields
  const [ownerName, setOwnerName] = useState(currentParcel.ownerName);
  const [isMarathiView, setIsMarathiView] = useState(false);
  const [surveyNo, setSurveyNo] = useState(currentParcel.surveyNo);
  const [subDivision, setSubDivision] = useState('Sub-division 3A (Hissa No. 1)');
  const [totalArea, setTotalArea] = useState(`${currentParcel.areaHa} Ha (01H 45R Pot Kharaba: 0.05R)`);
  const [shareFraction, setShareFraction] = useState('1/2 Share (Joint Co-parcener with Ramesh V. Deshmukh)');
  const [encumbrances, setEncumbrances] = useState(
    'Bank of Maharashtra, Branch Hinjawadi - Charge Rs 15,00,000 (Agri Loan dated 12/03/2019)'
  );

  const handleZoomIn = () => {
    if (zoomLevel < 1.6) setZoomLevel((prev) => +(prev + 0.15).toFixed(2));
  };
  const handleZoomOut = () => {
    if (zoomLevel > 0.6) setZoomLevel((prev) => +(prev - 0.15).toFixed(2));
  };
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };
  const handleFit = () => {
    setZoomLevel(1.0);
    setRotation(0);
  };

  const handleRescan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setActionNotice('OCR extraction refreshed with 98.2% field alignment.');
      setTimeout(() => setActionNotice(null), 3000);
    }, 1000);
  };

  const handleConfirm = () => {
    setIsConfirming(true);
    if (onUpdateParcel) {
      onUpdateParcel({
        ownerName,
        surveyNo,
      });
    }
    setTimeout(() => {
      setIsConfirming(false);
      onNavigate('parcel-check-and-red-flag-gate');
    }, 1000);
  };

  const handleExecuteReject = () => {
    setIsRejectModalOpen(false);
    setActionNotice(`Rejection notice logged for ${currentParcel.surveyNo}: "${rejectReason}".`);
    setTimeout(() => {
      onNavigate('citizen-dashboard');
    }, 1500);
  };

  return (
    <div className="w-full flex flex-col bg-slate-50 min-h-screen">
      {/* Sub-bar */}
      <div className="w-full bg-white py-3.5 shadow-2xs border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto px-4 md:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl text-slate-900 font-bold tracking-tight">
                Document AI Extraction & Field Review
              </h1>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                OCR Pipeline Active
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
              <span className="font-mono text-slate-700 font-semibold">
                Doc Ref: {customDocData?.name ? `DOC-${customDocData.name.substring(0, 15)}` : '712-MAH-PUN-2024-99812'}
              </span>
              <span>•</span>
              <span>
                Source: {customDocData?.name ? customDocData.name : 'State Revenue 7/12 Extract'}
              </span>
              <span>•</span>
              <span className="text-slate-700 font-medium">Indic-BERT v4 OCR Engine</span>
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
              <span className="material-symbols-outlined text-emerald-700 text-lg">verified</span>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 block leading-tight">
                  Extraction Confidence
                </span>
                <span className="text-xs text-emerald-900 font-bold">96.4% High Quality</span>
              </div>
            </div>

            <button
              onClick={handleRescan}
              disabled={isScanning}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs text-xs font-semibold border border-slate-200"
            >
              <span className={`material-symbols-outlined text-base ${isScanning ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isScanning ? 'Processing...' : 'Re-scan OCR'}</span>
            </button>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="max-w-[1360px] mx-auto px-4 md:px-6 pt-3">
          <div className="p-3 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-between">
            <span>{actionNotice}</span>
            <button type="button" onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Split Screen Workspace */}
      <div className="w-full max-w-[1360px] mx-auto px-4 md:px-6 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Document Facsimile Viewer (6 cols) */}
          <section className="lg:col-span-6 flex flex-col bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
            {/* Toolbar Header */}
            <div className="bg-slate-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-slate-700 text-lg">description</span>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-xs font-bold text-slate-900 truncate">
                    Original Scanned 7/12 Extract
                  </h2>
                  <span className="text-[11px] text-slate-500 truncate">
                    गाव नमुना सात / बारा (अधिकार अभिलेख पत्रक)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200">
                  <button
                    onClick={handleZoomIn}
                    title="Zoom In"
                    type="button"
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100"
                  >
                    <span className="material-symbols-outlined text-base">zoom_in</span>
                  </button>
                  <button
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    type="button"
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100"
                  >
                    <span className="material-symbols-outlined text-base">zoom_out</span>
                  </button>
                  <button
                    onClick={handleRotate}
                    title="Rotate 90deg"
                    type="button"
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100"
                  >
                    <span className="material-symbols-outlined text-base">rotate_right</span>
                  </button>
                  <button
                    onClick={handleFit}
                    title="Fit to Width"
                    type="button"
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100"
                  >
                    <span className="material-symbols-outlined text-base">fit_screen</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowBBoxes(!showBBoxes)}
                  type="button"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                    showBBoxes
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      showBBoxes ? 'bg-emerald-600' : 'bg-slate-400'
                    }`}
                  ></span>
                  <span>{showBBoxes ? 'Bounding Boxes: ON' : 'Boxes: OFF'}</span>
                </button>
              </div>
            </div>

            {/* Document Facsimile Viewport */}
            <div className="relative w-full h-[700px] bg-slate-100 overflow-auto p-4 flex justify-center items-start select-none">
              <div
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease-out',
                }}
                className="relative w-full max-w-[540px] min-h-[780px] bg-white shadow-sm p-5 flex flex-col justify-between border border-slate-200 rounded-lg text-slate-900"
              >
                {/* Document Header */}
                <div className="relative z-10 flex flex-col items-center pb-3 text-center border-b border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <img
                      className="w-9 h-9 object-contain"
                      alt="State Emblem"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPX4tbh19N5twLk8yHK9SuIIGyg9yYDhAImBNyYOusWlwWSwOxVTgsTdkAHRdDSjfmh6HwSe1HcbUUQz90o57TOFme_wbrtsOA9-XKi1NpKcQSVidVozSENcn1-pq5Q3PL-KScqYDxCCB9b0XiYTAd43AolpEaPGgxHRzozI7pRu7ytalwVplAK7grP7C2f58T2Qn__MvK3wP1fobZJ2WYF6Qyou2onTRwY-Bm1oGFXVdteKzFMjpJ0g"
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-900 uppercase block">
                        महाराष्ट्र शासन • महसूल व वन विभाग
                      </span>
                      <span className="font-mono text-slate-500 text-[10px] block">
                        e-Mahabhulekh Land Records System • DILRMP
                      </span>
                    </div>
                  </div>

                  <div className="mt-1 px-3 py-0.5 bg-slate-100 rounded-full border border-slate-200">
                    <span className="text-xs font-bold text-slate-900">
                      गाव नमुना ७ / १२ ( अधिकार अभिलेख व पिकांची नोंदवही )
                    </span>
                  </div>

                  <div className="grid grid-cols-3 w-full mt-2 text-left text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-md border border-slate-200">
                    <div><span className="font-bold text-slate-900">गाव:</span> {currentParcel.village}</div>
                    <div><span className="font-bold text-slate-900">तालुका:</span> {currentParcel.taluka}</div>
                    <div><span className="font-bold text-slate-900">जिल्हा:</span> {currentParcel.district}</div>
                  </div>
                </div>

                {/* Content & Annotated Boxes */}
                <div className="relative z-10 flex-1 flex flex-col gap-3 py-3">
                  {/* Row 1: Survey & Area */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div
                      onClick={() => setHighlightField('survey')}
                      className={`relative p-2 rounded cursor-pointer transition-colors ${
                        highlightField === 'survey' ? 'ring-2 ring-emerald-600 bg-emerald-50/50' : ''
                      } ${
                        showBBoxes ? 'border border-emerald-500 bg-emerald-50/30' : 'border-transparent'
                      }`}
                    >
                      {showBBoxes && (
                        <div className="absolute -top-2.5 left-1 bg-emerald-700 text-white px-1.5 py-0.5 rounded text-[9px] font-mono shadow-2xs">
                          Survey No: 99%
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 font-semibold">
                        भूमापन क्रमांक / उपविभाग
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        सर्व्हे क्र. / गट क्र.: {surveyNo}
                      </div>
                      <div className="font-mono text-slate-500 text-[10px]">
                        Sub-division: 3A (Hissa 1)
                      </div>
                    </div>

                    <div
                      onClick={() => setHighlightField('area')}
                      className={`relative p-2 rounded cursor-pointer transition-colors ${
                        highlightField === 'area' ? 'ring-2 ring-emerald-600 bg-emerald-50/50' : ''
                      } ${
                        showBBoxes ? 'border border-emerald-500 bg-emerald-50/30' : 'border-transparent'
                      }`}
                    >
                      {showBBoxes && (
                        <div className="absolute -top-2.5 left-1 bg-emerald-700 text-white px-1.5 py-0.5 rounded text-[9px] font-mono shadow-2xs">
                          Area: 95%
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 font-semibold">
                        एकूण क्षेत्र (हेक्टर / आर)
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {currentParcel.areaHa} Hectare ({currentParcel.areaAcres} Acres)
                      </div>
                      <div className="font-mono text-slate-500 text-[10px]">
                        पोटखराबा आकार: ०.०५ आर
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Owner & Share */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2">
                    <div
                      onClick={() => setHighlightField('owner')}
                      className={`relative p-2 rounded cursor-pointer transition-colors ${
                        highlightField === 'owner' ? 'ring-2 ring-emerald-600 bg-emerald-50/50' : ''
                      } ${
                        showBBoxes ? 'border border-emerald-500 bg-emerald-50/30' : 'border-transparent'
                      }`}
                    >
                      {showBBoxes && (
                        <div className="absolute -top-2.5 left-1 bg-emerald-700 text-white px-1.5 py-0.5 rounded text-[9px] font-mono shadow-2xs">
                          Owner: 98%
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 font-semibold">
                        भोगवटादाराचे नाव (खातेदार)
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {currentParcel.ownerNameMarathi} ({ownerName})
                      </div>
                      <div className="font-mono text-slate-500 text-[10px]">
                        खाते क्रमांक: KH-881902 • फेरफार क्र.: 3912, 4412
                      </div>
                    </div>

                    <div
                      onClick={() => setHighlightField('share')}
                      className={`relative p-2 rounded cursor-pointer transition-colors ${
                        highlightField === 'share' ? 'ring-2 ring-amber-600 bg-amber-50/50' : ''
                      } ${
                        showBBoxes ? 'border border-amber-500 bg-amber-50/30' : 'border-transparent'
                      }`}
                    >
                      {showBBoxes && (
                        <div className="absolute -top-2.5 left-1 bg-amber-700 text-white px-1.5 py-0.5 rounded text-[9px] font-mono shadow-2xs">
                          Share: 78% (Joint)
                        </div>
                      )}
                      <div className="text-[11px] text-amber-900 font-semibold">
                        हिस्सा / अधिकार स्वरूप (Occupancy Right)
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        हिस्सा: १/२ समभाग (1/2 Joint Share)
                      </div>
                      <div className="font-mono text-amber-800 text-[10px]">
                        सह-हिस्सेदार: रमेश विठ्ठलराव देशमुख (Mutual Heir via Mutation 4412)
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Liabilities */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div
                      onClick={() => setHighlightField('encumbrance')}
                      className={`relative p-2 rounded cursor-pointer transition-colors ${
                        highlightField === 'encumbrance' ? 'ring-2 ring-amber-600 bg-amber-50/50' : ''
                      } ${
                        showBBoxes ? 'border border-amber-500 bg-amber-50/30' : 'border-transparent'
                      }`}
                    >
                      {showBBoxes && (
                        <div className="absolute -top-2.5 left-1 bg-amber-700 text-white px-1.5 py-0.5 rounded text-[9px] font-mono shadow-2xs">
                          Lien: 74% Active
                        </div>
                      )}
                      <div className="text-[11px] text-amber-900 font-semibold">
                        इतर हक्क व बोजा (Liabilities & Other Rights)
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        बोजा: बँक ऑफ महाराष्ट्र रु. १५,००,०००
                      </div>
                      <div className="font-mono text-amber-800 text-[10px] leading-relaxed">
                        नोंद क्र. ४१२०/२०१९ • शाखा हिंजवडी • पीक कर्ज • तारण चालू
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer seal */}
                <div className="relative z-10 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>MD5: e7f8b91a0c4...9921</span>
                  <span>Digitally Signed by Talathi Office</span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Structured Field Verification (6 cols) */}
          <section className="lg:col-span-6 flex flex-col bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-700 text-lg">fact_check</span>
                <div className="flex flex-col">
                  <h2 className="text-xs font-bold text-slate-900">
                    Structured Field Verification & Manual Audit
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    Review extracted fields before proceeding to statutory verification
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[11px] font-bold">
                6 Fields Extracted
              </span>
            </div>

            <div className="p-4 md:p-6 flex flex-col gap-3.5 max-h-[700px] overflow-y-auto text-xs">
              {/* Field 1: Primary Owner Name */}
              <div
                onFocus={() => setHighlightField('owner')}
                className={`flex flex-col gap-1 p-3 rounded-xl border transition-colors ${
                  highlightField === 'owner' ? 'bg-slate-50 border-slate-900' : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="font-bold text-slate-900" htmlFor="field-owner">
                    Primary Owner Name (खातेदाराचे नाव)
                  </label>
                  <span className="text-emerald-700 font-semibold text-[11px]">98% Confidence</span>
                </div>
                <div className="relative">
                  <input
                    id="field-owner"
                    type="text"
                    value={isMarathiView ? currentParcel.ownerNameMarathi : ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full h-9 px-3 pr-16 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMarathiView(!isMarathiView)}
                    className="absolute right-1.5 top-1.5 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-200"
                  >
                    {isMarathiView ? 'English' : 'मराठी'}
                  </button>
                </div>
              </div>

              {/* Field 2: Survey / Gat Number */}
              <div
                onFocus={() => setHighlightField('survey')}
                className={`flex flex-col gap-1 p-3 rounded-xl border transition-colors ${
                  highlightField === 'survey' ? 'bg-slate-50 border-slate-900' : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="font-bold text-slate-900" htmlFor="field-survey">
                    Survey / Gat Number (सर्व्हे / गट क्रमांक)
                  </label>
                  <span className="text-emerald-700 font-semibold text-[11px]">99% Exact Match</span>
                </div>
                <input
                  id="field-survey"
                  type="text"
                  value={surveyNo}
                  onChange={(e) => setSurveyNo(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Field 3: Sub-division */}
              <div
                onFocus={() => setHighlightField('subdivision')}
                className="flex flex-col gap-1 p-3 rounded-xl border bg-slate-50/50 border-slate-200"
              >
                <label className="font-bold text-slate-900" htmlFor="field-hissa">
                  Sub-division / Hissa (पोट हिस्सा)
                </label>
                <input
                  id="field-hissa"
                  type="text"
                  value={subDivision}
                  onChange={(e) => setSubDivision(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Field 4: Total Area */}
              <div
                onFocus={() => setHighlightField('area')}
                className="flex flex-col gap-1 p-3 rounded-xl border bg-slate-50/50 border-slate-200"
              >
                <label className="font-bold text-slate-900" htmlFor="field-area">
                  Total Certified Area (एकूण क्षेत्र)
                </label>
                <input
                  id="field-area"
                  type="text"
                  value={totalArea}
                  onChange={(e) => setTotalArea(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Field 5: Share Fraction */}
              <div
                onFocus={() => setHighlightField('share')}
                className="flex flex-col gap-1 p-3 rounded-xl border bg-slate-50/50 border-slate-200"
              >
                <label className="font-bold text-slate-900" htmlFor="field-share">
                  Share Fraction & Joint Khatedar (समभाग)
                </label>
                <input
                  id="field-share"
                  type="text"
                  value={shareFraction}
                  onChange={(e) => setShareFraction(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Field 6: Liabilities */}
              <div
                onFocus={() => setHighlightField('encumbrance')}
                className="flex flex-col gap-1 p-3 rounded-xl border bg-amber-50/40 border-amber-200"
              >
                <label className="font-bold text-amber-900" htmlFor="field-encumbrances">
                  Recorded Liens & Encumbrances (इतर हक्क व बोजा)
                </label>
                <input
                  id="field-encumbrances"
                  type="text"
                  value={encumbrances}
                  onChange={(e) => setEncumbrances(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-amber-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                Reject & Request Re-scan
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirming}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              >
                <span>{isConfirming ? 'Saving & Verifying...' : 'Confirm and Run Verification Checks'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Reject Document & Request Rescan
              </h3>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Discrepancy notice will be registered for mutation record re-verification.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Primary Rejection Cause</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="Illegible Talathi Stamp & Signatures">Illegible Talathi Stamp & Signatures</option>
                <option value="Watermark Discrepancy / Tampering Risk">Watermark Discrepancy / Tampering Risk</option>
                <option value="Pot Kharaba Land Extent Discrepancy">Pot Kharaba Land Extent Discrepancy</option>
                <option value="Missing Mutation Entry Ferfar Reference">Missing Mutation Entry Ferfar Reference</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReject}
                className="px-4 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-semibold hover:bg-rose-800"
              >
                Submit Rejection Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
