import React, { useState } from 'react';
import { NavScreen, Parcel } from '../../types';
import { mockGates } from '../../data/mockData';
import { CadastralMap } from '../CadastralMap';

interface ParcelCheckGateProps {
  currentParcel: Parcel;
  onNavigate: (screen: NavScreen) => void;
  onDownloadRejectionNotice: () => void;
}

export const ParcelCheckGate: React.FC<ParcelCheckGateProps> = ({
  currentParcel,
  onNavigate,
  onDownloadRejectionNotice,
}) => {
  const [overrideText, setOverrideText] = useState('');
  const [dscTokenAttached, setDscTokenAttached] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalatedSuccess, setEscalatedSuccess] = useState(false);

  const handleEscalate = () => {
    setIsEscalating(true);
    setTimeout(() => {
      setIsEscalating(false);
      setEscalatedSuccess(true);
      setTimeout(() => setEscalatedSuccess(false), 4500);
    }, 1000);
  };

  // Dynamic gates based on currentParcel
  const activeGates = mockGates.map((g) => {
    if (g.id === 2 && currentParcel.unreleasedMortgageAmount === 0) {
      return {
        ...g,
        status: 'PASS' as const,
        description: 'No active lien found in CERSAI or Bank database. Hypothecation free.',
      };
    }
    if (g.id === 3 && !currentParcel.hasLitigation) {
      return {
        ...g,
        status: 'PASS' as const,
        description: 'Zero active court injunctions or suits found in National Judicial Data Grid (NJDG).',
      };
    }
    if (g.id === 4 && currentParcel.canalBufferOverlapHa === 0) {
      return {
        ...g,
        status: 'PASS' as const,
        description: 'Parcel is clear of Irrigation canal buffers, forest reservations, and CRZ eco-zones.',
      };
    }
    return g;
  });

  const blockCount = activeGates.filter((g) => g.status === 'BLOCK').length;
  const warnCount = activeGates.filter((g) => g.status === 'WARN').length;

  return (
    <div className="w-full flex flex-col bg-slate-50 min-h-screen">
      {/* Top Inspection Sub-bar */}
      <div className="w-full bg-white border-b border-slate-200 py-3 px-4 md:px-6 shadow-2xs">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-semibold text-slate-900">
              Statutory 8-Gate Cadastral Verification
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">
              NIC DILRMP Architecture
            </span>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Revenue Registry Synchronized</span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-slate-500">
            <span>Session:</span>
            <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              #MH-2025-0982-REG
            </span>
          </div>
        </div>
      </div>

      {/* Primary Container */}
      <div className="w-full max-w-[1360px] mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
        {/* Top Summary Bar */}
        <section className="w-full bg-white rounded-xl shadow-2xs p-5 border border-slate-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl text-slate-900 font-bold tracking-tight">
                  Survey No. {currentParcel.surveyNo}
                </h1>
                <span className="text-sm text-slate-500">
                  (Gat No. {currentParcel.gatNo})
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${
                    currentParcel.status === 'PASS'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : currentParcel.status === 'WARN'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {currentParcel.statusLabel}
                </span>
              </div>
              <div className="text-slate-600 text-xs">
                {currentParcel.village}, Taluka {currentParcel.taluka}, District {currentParcel.district}, {currentParcel.state}
              </div>
            </div>

            {/* ULPIN Badge */}
            <div className="bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 flex flex-col items-start lg:items-end">
              <span className="text-[10px] uppercase text-slate-500 font-semibold">
                Unique Land Parcel Identifier (ULPIN)
              </span>
              <span className="font-mono text-sm text-slate-900 font-bold tracking-wide">
                {currentParcel.ulpin}
              </span>
            </div>
          </div>

          {/* Metrics Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-[11px] text-slate-500 block">Certified Extent</span>
              <span className="text-sm font-bold text-slate-900">
                {currentParcel.areaHa} Ha ({currentParcel.areaAcres} Acres)
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] text-slate-500 block">Classification</span>
              <span className="text-sm font-bold text-slate-900">
                {currentParcel.classification}
              </span>
            </div>

            <div className="space-y-0.5 md:col-span-2">
              <span className="text-[11px] text-slate-500 block">Primary Titleholder</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{currentParcel.ownerName}</span>
                <span className="text-slate-500 text-[11px]">({currentParcel.jointShareText})</span>
              </div>
            </div>
          </div>
        </section>

        {/* Middle Grid: GIS Inspector & 8-Gate AI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Cadastral Map Component */}
          <section className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-2xs p-5 flex flex-col gap-3.5 border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-700 text-lg">map</span>
                  <h2 className="text-sm font-bold text-slate-900">
                    Cadastral Boundary Inspector
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-xs">
                  UTM 43N
                </span>
              </div>

              {/* Enhanced Interactive Cadastral Map Component */}
              <CadastralMap
                currentParcel={currentParcel}
                interactive={true}
                height="440px"
                showControls={true}
                showLegend={true}
              />
            </div>

            {/* DGPS Survey Drone Dataset Card */}
            <div className="bg-white rounded-xl shadow-2xs p-4 flex items-center justify-between border border-slate-200 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">verified</span>
                </span>
                <div>
                  <span className="font-bold text-slate-900 block">DGPS Survey Dataset</span>
                  <span className="text-slate-500">Inspector of Land Records (TILR)</span>
                </div>
              </div>
              <span className="font-mono text-slate-600 font-semibold">14 May 2024</span>
            </div>
          </section>

          {/* Right Column: 8-Gate AI Registry Verification */}
          <section className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-2xs p-5 flex flex-col gap-3 border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-700 text-lg">policy</span>
                  <h2 className="text-sm font-bold text-slate-900">
                    8-Gate Statutory Verification
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  {activeGates.filter((g) => g.status === 'PASS').length} of {activeGates.length} Cleared
                </span>
              </div>

              {/* Checklist Items */}
              <div className="flex flex-col gap-2">
                {activeGates.map((gate) => {
                  const isPass = gate.status === 'PASS';
                  const isWarn = gate.status === 'WARN';

                  return (
                    <div
                      key={gate.id}
                      className={`p-3 rounded-lg flex items-start justify-between gap-3 border text-xs transition-colors ${
                        isPass
                          ? 'bg-slate-50 border-slate-200'
                          : isWarn
                          ? 'bg-amber-50/60 border-amber-200'
                          : 'bg-rose-50/60 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`material-symbols-outlined text-[18px] mt-0.5 ${
                            isPass
                              ? 'text-emerald-600'
                              : isWarn
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {gate.icon}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900">{gate.title}</span>
                          <p className="text-slate-600">{gate.description}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase shrink-0 border ${
                          isPass
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isWarn
                            ? 'bg-amber-100 text-amber-900 border-amber-200'
                            : 'bg-rose-600 text-white border-rose-600'
                        }`}
                      >
                        {gate.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Section: Registration Status & Officer Override Gate */}
        <section
          className={`w-full rounded-xl p-5 border text-xs ${
            blockCount > 0
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl mt-0.5 shrink-0">
                {blockCount > 0 ? 'shield_lock' : 'verified_user'}
              </span>
              <div className="space-y-1">
                <h3 className="text-sm font-bold">
                  {blockCount > 0
                    ? 'REGISTRATION BLOCKED: Officer Override Required (Sec. 22A Registration Act)'
                    : 'REGISTRATION CLEAR: No Statutory Obstacles Detected'}
                </h3>
                <p className="opacity-90 max-w-2xl leading-relaxed">
                  {blockCount > 0
                    ? `Automated audit detected ${blockCount} BLOCK triggers and ${warnCount} WARN triggers. Automated registry lock applied under Sec. 22A Registration Act, 1908.`
                    : 'All statutory verification gates cleared without active caveats or unreleased mortgage encumbrance. Title is ready for deed conveyance.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {blockCount > 0 && (
                <button
                  type="button"
                  onClick={onDownloadRejectionNotice}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-rose-800 font-semibold border border-rose-200 hover:bg-rose-50 transition-colors"
                >
                  Download Rejection Notice
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('should-i-buy-this-report')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
              >
                View Full Diligence Report
              </button>
            </div>
          </div>

          {/* Officer Override Authorization Panel */}
          {blockCount > 0 && (
            <div className="mt-4 pt-4 border-t border-rose-200/60 bg-white rounded-lg p-4 space-y-3 text-slate-800">
              <div className="space-y-0.5">
                <label
                  className="text-xs font-bold text-slate-900 flex items-center gap-1.5"
                  htmlFor="override-justification"
                >
                  Officer Override Justification & Legal Order Reference Number
                </label>
                <p className="text-[11px] text-slate-500">
                  Requires explicit reference to court vacation order, gazette de-notification, or administrative discharge certificate.
                </p>
              </div>

              <textarea
                id="override-justification"
                value={overrideText}
                onChange={(e) => setOverrideText(e.target.value)}
                placeholder="Enter Court Order Case Number, Date of Injunction Vacation, or District Collectorate Special Sanction Reference..."
                rows={2}
                className="w-full p-2.5 rounded-lg bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
              />

              {escalatedSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Dispatched to Tehsildar & District Collectorate Node. Action Ticket #ESC-PUN-9921 generated.</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setDscTokenAttached(!dscTokenAttached)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                    dscTokenAttached
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">usb</span>
                  <span>{dscTokenAttached ? 'DSC Token Attached (Class-3)' : 'Attach USB DSC Token'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleEscalate}
                  disabled={isEscalating}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">send</span>
                  <span>{isEscalating ? 'Submitting...' : 'Escalate to District Registrar'}</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
