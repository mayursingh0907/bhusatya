import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 mt-16 py-12 border-t border-slate-800">
      <div className="w-full max-w-[1360px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          {/* Col 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white font-bold tracking-tight">BhuSatya (भू-सत्य)</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              National Cadastral Title Verification & Land Registry Intelligence Infrastructure. Integrated under Department of Land Resources (DoLR), Ministry of Rural Development, Government of India.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase tracking-wider block text-[11px]">
              Institutional Standards
            </span>
            <div className="flex flex-col gap-1 text-slate-400">
              <span>Digital India Land Records Modernization (DILRMP)</span>
              <span>Open Standard Interoperability Framework (MeitY)</span>
              <span>National Informatics Centre (NIC) Server Cluster</span>
            </div>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase tracking-wider block text-[11px]">
              Auditing & Compliance
            </span>
            <div className="flex flex-col gap-1 text-slate-400">
              <span>SHA-256 Cadastral Ledger Proof Seals</span>
              <span>Immutable Title Audit Trail</span>
              <span>Digital Personal Data Protection (DPDP Act 2023)</span>
            </div>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase tracking-wider block text-[11px]">
              Registry Assistance
            </span>
            <p className="text-slate-400">
              For administrative inquiries, boundary dispute queries, or official node verification:
            </p>
            <div className="font-mono text-slate-300 font-semibold">support@bhusatya.gov.in</div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} National Informatics Centre, Department of Land Resources, Government of India.
          </div>
          <div className="flex items-center gap-6">
            <a className="hover:text-slate-300 transition-colors" href="#hyperlink-policy" onClick={(e) => e.preventDefault()}>
              Hyperlink Policy
            </a>
            <a className="hover:text-slate-300 transition-colors" href="#privacy-policy" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>
            <a className="hover:text-slate-300 transition-colors" href="#terms-of-service" onClick={(e) => e.preventDefault()}>
              Terms of Service
            </a>
            <a className="hover:text-slate-300 transition-colors" href="#dispute-protocol" onClick={(e) => e.preventDefault()}>
              Dispute Protocol
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
