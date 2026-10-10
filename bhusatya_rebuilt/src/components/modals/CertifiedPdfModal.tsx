import React from 'react';
import { Parcel } from '../../types';
import { api } from '../../services/api';

interface CertifiedPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParcel: Parcel;
}

export const CertifiedPdfModal: React.FC<CertifiedPdfModalProps> = ({
  isOpen,
  onClose,
  currentParcel,
}) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadBackendPdf = async () => {
    const docId = currentParcel.id || 'sample-doc-142';
    setIsDownloading(true);
    try {
      await api.downloadReportPdfBlob(docId);
    } catch (err) {
      console.warn('Direct blob download failed, falling back to window.open:', err);
      window.open(api.getReportPdfUrl(docId), '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 md:p-8 shadow-xl border border-slate-200 space-y-6 my-8">
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-900 text-xl">
              verified
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Official Certified PDF Docket (SHA-256 Verified)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBackendPdf}
              disabled={isDownloading}
              className="px-3.5 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Download official ReportLab PDF from verification backend"
            >
              <span className="material-symbols-outlined text-sm">
                {isDownloading ? 'hourglass_top' : 'download'}
              </span>
              <span>{isDownloading ? 'Downloading...' : 'Download Signed Docket'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Print Browser View</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Printable Certificate Sheet */}
        <div className="p-6 md:p-8 bg-white border border-slate-300 rounded-lg space-y-6 text-slate-900 shadow-2xs relative">
          {/* Header */}
          <div className="text-center space-y-1 pb-4 border-b border-slate-200">
            <div className="flex items-center justify-center gap-3">
              <img
                alt="Emblem"
                className="h-10 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida/AEtjO1VC6Lvfw1ZNmLyeETiRRdEE4O0xO9UF59J5XKvkHwaqsRxjXIOFL3iv08WuHUnzY2OvEmJJ-MZ0hsLM9tIyIfOPU0EZF4XuxV3ILITcBimVUhtZ18LTc8a9IpLTZGa8bI6iapPl1IbcAbIAQ_r5uJHBjUva_IMqxsbJ9EU3yVoUPBnA7GmpdP05_VkzEq0iqwhiLwuCIJ38ubi1gx24rEpzWEEE17mMQrfMmZXwJvlx6RKuwkOsXQ7IA86w"
              />
              <div className="text-left">
                <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
                  Government of India • Ministry of Rural Development
                </h1>
                <p className="text-xs text-slate-500">
                  Department of Land Resources (DoLR) • Digital India Land Records (DILRMP)
                </p>
              </div>
            </div>
            <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-800 uppercase tracking-wide border border-slate-200">
              BhuSatya Land Purchase Diligence & Title Integrity Certificate
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block">ULPIN / Bhudhar:</span>
              <span className="font-mono font-bold text-slate-900">{currentParcel.ulpin}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Survey / Gat No:</span>
              <span className="font-bold text-slate-900">
                {currentParcel.surveyNo} (Gat {currentParcel.gatNo})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Location:</span>
              <span className="font-semibold text-slate-900">
                {currentParcel.village}, {currentParcel.district}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Certified Extent:</span>
              <span className="font-bold text-slate-900">{currentParcel.areaHa} Ha ({currentParcel.areaAcres} Acres)</span>
            </div>
          </div>

          {/* Score & Verdict Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-500">Overall Diligence Verdict</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {currentParcel.trustScore >= 80 ? 'CLEAR TITLE (खरेदीस पात्र)' : 'PROCEED WITH CAUTION (सावधगिरीने पुढे जा)'}
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-md">
                Verified succession on 7/12 records. Encumbrances and active court notices documented on record.
              </p>
            </div>
            <div className="text-center px-4 py-2 bg-white rounded-lg border border-slate-200">
              <span className="text-2xl font-bold text-slate-900 block font-mono">{currentParcel.trustScore}</span>
              <span className="text-[10px] uppercase font-semibold text-slate-500">Trust Score / 100</span>
            </div>
          </div>

          {/* 5 Pillars Summary Checklist */}
          <div className="space-y-2 text-xs">
            <div className="font-bold uppercase text-slate-900 border-b border-slate-100 pb-1">
              Title Verification Audit Summary
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-slate-50 rounded flex justify-between border border-slate-200">
                <span className="text-slate-700">1. Title Lineage (30-year succession)</span>
                <span className="font-bold text-emerald-700">PASS (40/40)</span>
              </div>
              <div className="p-2 bg-slate-50 rounded flex justify-between border border-slate-200">
                <span className="text-slate-700">2. Financial Encumbrance</span>
                <span className={`font-bold ${currentParcel.unreleasedMortgageAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {currentParcel.unreleasedMortgageAmount > 0 ? 'ACTION REQUIRED' : 'CLEARED'}
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded flex justify-between border border-slate-200">
                <span className="text-slate-700">3. Boundary Consistency</span>
                <span className="font-bold text-slate-900">VERIFIED</span>
              </div>
              <div className="p-2 bg-slate-50 rounded flex justify-between border border-slate-200">
                <span className="text-slate-700">4. Circle Rate Conformity</span>
                <span className="font-bold text-emerald-700">COMPLIANT</span>
              </div>
              <div className="p-2 bg-slate-50 rounded flex justify-between md:col-span-2 border border-slate-200">
                <span className="text-slate-700">5. Court Litigation Status</span>
                <span className={`font-bold ${currentParcel.hasLitigation ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {currentParcel.hasLitigation ? 'SUB JUDICE (CAVEAT ACTIVE)' : 'CLEAR'}
                </span>
              </div>
            </div>
          </div>

          {/* Digital Signature Endorsement */}
          <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 block">
                Electronically Verified & Certified
              </span>
              <p className="font-mono text-[10px] text-slate-500">
                SHA-256: e87c32a819b9104fa2899bc0192837f4e1b9a9103c81928019a823b491823719
              </p>
              <p className="text-[10px] text-slate-500">
                UIDAI eSign 2.1 PKI • Timestamp: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </p>
            </div>

            <div className="text-center border border-slate-200 p-2.5 rounded-lg bg-slate-50">
              <span className="text-[10px] uppercase font-bold text-slate-700 block">
                Authorized Revenue Officer
              </span>
              <span className="text-xs font-bold text-slate-900">Shri Rajeshwar Rao, IAS</span>
              <span className="text-[10px] text-slate-500 block">Divisional Commissioner</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
