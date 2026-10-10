import React, { useState } from 'react';
import { Parcel } from '../../types';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParcel: Parcel;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  currentParcel,
}) => {
  const [recipient, setRecipient] = useState<'advocate' | 'bank'>('advocate');
  const [copied, setCopied] = useState(false);
  const shareLink = `https://bhusatya.gov.in/docket/verify?ulpin=${currentParcel.ulpin}&token=SHA256-e87c41b9&valid=72h`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-900 text-lg">share</span>
            <h3 className="text-sm font-bold text-slate-900">
              Share Diligence Docket
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <p className="text-slate-600">
          Generate an authenticated, read-only digital docket link for Survey{' '}
          <strong>{currentParcel.surveyNo}</strong> ({currentParcel.village}).
        </p>

        <div className="space-y-2">
          <label className="font-semibold text-slate-700 block">Authorized Recipient Persona</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRecipient('advocate')}
              className={`p-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                recipient === 'advocate'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-base">gavel</span>
              Legal Counsel / Advocate
            </button>
            <button
              type="button"
              onClick={() => setRecipient('bank')}
              className={`p-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                recipient === 'bank'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-base">account_balance</span>
              Bank Loan Manager
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block">Verification Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 shrink-0 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <span className="text-[11px] text-slate-500 block">
            🔒 Expiring in 72 hours • AES-256 Link Token • Read-only access
          </span>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
