import React, { useState } from 'react';
import { NavScreen, Parcel, Language } from '../../types';
import { mockPillars } from '../../data/mockData';
import { getT } from '../../data/translations';

interface ShouldIBuyThisReportProps {
  currentParcel: Parcel;
  onNavigate: (screen: NavScreen) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenShareModal: () => void;
  onOpenPdfModal: () => void;
}

export const ShouldIBuyThisReport: React.FC<ShouldIBuyThisReportProps> = ({
  currentParcel,
  onNavigate,
  language,
  onLanguageChange,
  onOpenShareModal,
  onOpenPdfModal,
}) => {
  const [reportLang, setReportLang] = useState<Language>(language);
  const [courtNotice, setCourtNotice] = useState<string | null>(null);
  const t = getT(reportLang);

  const handleLangToggle = (lang: Language) => {
    setReportLang(lang);
    onLanguageChange(lang);
  };

  const score = currentParcel.trustScore;
  const isHighTrust = score >= 80;
  const isModerate = score >= 50 && score < 80;

  // Circumference calculation for 120x120 viewBox (r=50 -> 314.15)
  const circumference = 314.15;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Dynamic pillars based on currentParcel
  const dynamicPillars = mockPillars.map((p) => {
    if (p.id === 2 && currentParcel.unreleasedMortgageAmount === 0) {
      return {
        ...p,
        status: 'CLEAR' as const,
        scoreBadge: 'Clear (100/100)',
        badgeType: 'secondary' as const,
        description: 'No unreleased mortgage dues or bank encumbrance on CERSAI records.',
        metadataText: 'CERSAI ID: CLEAR-2024 | Zero Hypothecation',
        nextActionText: 'Title is free from financial encumbrance. Proceed with payment milestones.',
      };
    }
    if (p.id === 5 && !currentParcel.hasLitigation) {
      return {
        ...p,
        status: 'CLEAR' as const,
        scoreBadge: 'No Court Stays',
        badgeType: 'secondary' as const,
        description: 'Zero civil suits or partition objections active in District or High Court records.',
        metadataText: 'NJDG Sync: Clean Title Record | No Lis Pendens',
        nextActionTitle: 'Statutory Clearance',
        nextActionText: 'Ancestral succession is undisputed. Standard sale deed can be registered.',
        courtDetails: undefined,
      };
    }
    return p;
  });

  return (
    <div className="w-full flex flex-col bg-slate-50 min-h-screen">
      {/* Institutional Breadcrumb & Context Bar */}
      <section className="w-full max-w-[1360px] mx-auto px-4 md:px-6 pt-4 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white">
              <span className="material-symbols-outlined text-[13px]">verified</span>
            </span>
            <span className="font-semibold text-slate-800">
              National Land Records Modernization Program (DILRMP)
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">CERSAI & State Revenue Registry Synced</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-slate-500 text-[11px]">
              SHA-256: e87c32a819b9104fa28...
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
              {currentParcel.classification}
            </span>
          </div>
        </div>
      </section>

      {/* Report Header Banner */}
      <section className="w-full max-w-[1360px] mx-auto px-4 md:px-6 pb-6">
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200 p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Header Details */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold tracking-wide">
                  Title Due Diligence Docket
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-xs text-slate-500">ULPIN {currentParcel.ulpin}</span>
              </div>

              <h1 className="text-2xl md:text-3xl text-slate-900 font-bold tracking-tight">
                {reportLang === 'MR'
                  ? 'भू-सत्य भूखंड खरेदी सल्ला अहवाल'
                  : reportLang === 'HI'
                  ? 'भू-सत्य भूखंड खरीद परामर्श रिपोर्ट'
                  : 'Land Purchase Diligence Report'}
              </h1>
              <p className="text-sm text-slate-600">
                Survey No. {currentParcel.surveyNo} (Gat {currentParcel.gatNo}) · {currentParcel.village}, Taluka {currentParcel.taluka}, {currentParcel.district}, {currentParcel.state}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                <span>Owner of Record: <strong className="text-slate-800">{currentParcel.ownerName}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Area: <strong className="text-slate-800">{currentParcel.areaHa} Ha ({currentParcel.areaAcres} Acres)</strong></span>
                <span className="text-slate-300">•</span>
                <span>Audit Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Verdict Card with Radial Trust Meter */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 p-5 rounded-xl border border-slate-200 shrink-0">
              {/* Radial Meter */}
              <div className="relative flex items-center justify-center w-28 h-28 shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    className="text-slate-200 stroke-current"
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    strokeWidth="10"
                  />
                  <circle
                    stroke={isHighTrust ? '#059669' : isModerate ? '#d97706' : '#dc2626'}
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    strokeWidth="10"
                    style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-slate-900 leading-none">
                    {score}
                  </span>
                  <span className="text-[10px] uppercase text-slate-500 font-semibold mt-0.5">
                    Trust Index
                  </span>
                </div>
              </div>

              {/* Verdict Text */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left max-w-xs space-y-1">
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                    isHighTrust
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : isModerate
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isHighTrust ? 'check_circle' : 'warning'}
                  </span>
                  <span>
                    {isHighTrust
                      ? 'Clear For Acquisition'
                      : isModerate
                      ? 'Proceed With Caution'
                      : 'High Risk: Action Required'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {isHighTrust
                    ? 'Succession records verified. Coparcener consents executed and CERSAI zero-encumbrance confirmed.'
                    : 'Authentic records identified, but bank hypothecation and litigation requires resolution before deed registration.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Executive Summary Callout */}
          <div className="mt-5 bg-slate-50 px-4 py-3 rounded-lg flex items-start gap-3 border border-slate-200">
            <span className="material-symbols-outlined text-slate-700 text-lg mt-0.5 shrink-0">
              info
            </span>
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong>{t.summaryVerdict}:</strong> Primary ownership chain (RoR 7/12 & Ferfar mutation) is
              legally sound with established lineage. {currentParcel.unreleasedMortgageAmount > 0 && (
                <>
                  However, <strong>₹{(currentParcel.unreleasedMortgageAmount / 100000).toFixed(2)} Lakh unreleased mortgage</strong> and{' '}
                </>
              )}
              {currentParcel.hasLitigation ? (
                <>
                  active <strong>Civil Suit objection ({currentParcel.courtCaseNo})</strong> represent liabilities that must be cured before advance payment.
                </>
              ) : (
                <>no litigation stays are pending in local or appellate court records.</>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Section 1: The 5 Core Buyer Diligence Pillars */}
      <section className="w-full max-w-[1360px] mx-auto px-4 md:px-6 pb-6">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {t.diligencePillars}
            </h2>
            <p className="text-xs text-slate-500">
              Multi-tier verification across revenue, judicial, and financial registries
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-600 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 5 of 5 Registries Cross-Referenced
          </span>
        </div>

        {/* 5 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dynamicPillars.map((pillar) => {
            const isWide = pillar.isWide;
            const isError = pillar.badgeType === 'error';
            const isTertiary = pillar.badgeType === 'tertiary';

            return (
              <div
                key={pillar.id}
                className={`bg-white rounded-xl shadow-2xs p-4 flex flex-col justify-between border border-slate-200 ${
                  isWide ? 'lg:col-span-2 md:col-span-1' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isError
                            ? 'bg-rose-50 text-rose-700'
                            : isTertiary
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {pillar.icon}
                        </span>
                      </span>
                      <span className="text-xs font-bold text-slate-900">{pillar.title}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 border ${
                        isError
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isTertiary
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isError ? 'block' : isTertiary ? 'priority_high' : 'check_circle'}
                      </span>
                      <span>{pillar.scoreBadge}</span>
                    </span>
                  </div>

                  {/* Body Content */}
                  {pillar.courtDetails ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-3">
                      <div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {pillar.description}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg text-xs font-mono text-slate-600 space-y-1 border border-slate-200">
                        <div>Case: <span className="font-semibold text-slate-900">{pillar.courtDetails.case}</span></div>
                        <div>Status: <span className="text-rose-700 font-semibold">{pillar.courtDetails.status}</span></div>
                        <div>Coram: {pillar.courtDetails.coram}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 space-y-2">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {pillar.description}
                      </p>
                      <div className="bg-slate-50 p-2 rounded-lg text-xs font-mono text-slate-600 border border-slate-200">
                        {pillar.metadataText}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div
                  className={`pt-2.5 mt-2 bg-slate-50/70 -mx-4 -mb-4 p-3.5 rounded-b-xl border-t border-slate-100 ${
                    pillar.courtDetails ? 'flex flex-col sm:flex-row sm:items-center justify-between gap-3' : ''
                  }`}
                >
                  <div>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider block ${
                        isError ? 'text-rose-700' : isTertiary ? 'text-amber-800' : 'text-emerald-700'
                      }`}
                    >
                      {pillar.nextActionTitle}
                    </span>
                    <p className="text-xs text-slate-600">{pillar.nextActionText}</p>
                  </div>

                  {pillar.courtDetails && (
                    <button
                      type="button"
                      onClick={() => onNavigate('heir-consent-tracker')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold whitespace-nowrap transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-[15px]">how_to_reg</span>
                      <span>Open Heir Portal</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Score Deductions Visual Breakdown */}
      <section className="w-full max-w-[1360px] mx-auto px-4 md:px-6 pb-6">
        <div className="bg-white rounded-xl shadow-2xs p-5 md:p-6 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t.riskWeighting}
              </h2>
              <p className="text-xs text-slate-500">
                Deterministic calculation based on National Land Records Risk Framework
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-600">Composite Score:</span>
              <span className="font-mono font-bold text-sm text-slate-900">{score} / 100</span>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4">
            {/* Pillar 1 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified</span>
                  Title Lineage & 30-Year Succession Chain
                </span>
                <span className="font-mono text-emerald-700 font-semibold">+40 Pts (Max 40)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-600 text-[16px]">account_balance</span>
                  Encumbrance & Financial Lien (CERSAI)
                </span>
                <span className="font-mono text-amber-700 font-semibold">
                  {currentParcel.unreleasedMortgageAmount > 0 ? '-12 Pts Penalty' : '0 Pts (Cleared)'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: currentParcel.unreleasedMortgageAmount > 0 ? '30%' : '0%' }}
                ></div>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-rose-600 text-[16px]">gavel</span>
                  Civil Court Litigation Risk ({currentParcel.courtCaseNo || 'None'})
                </span>
                <span className="font-mono text-rose-700 font-semibold">
                  {currentParcel.hasLitigation ? '-15 Pts Penalty' : '0 Pts (Clear)'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full"
                  style={{ width: currentParcel.hasLitigation ? '37.5%' : '0%' }}
                ></div>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-600 text-[16px]">layers</span>
                  Cadastral Boundary Overlap & Statutory Canal Buffer
                </span>
                <span className="font-mono text-slate-700 font-semibold">
                  {currentParcel.canalBufferOverlapHa > 0 ? '-5 Pts Penalty' : '0 Pts (Zero Overlap)'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-slate-500 rounded-full"
                  style={{ width: currentParcel.canalBufferOverlapHa > 0 ? '12.5%' : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Cadastral Boundary, Valuation, and Court Evidence */}
      <section className="w-full max-w-[1360px] mx-auto px-4 md:px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: Cadastral Boundary */}
          <div className="bg-white rounded-xl shadow-2xs p-4 flex flex-col justify-between border border-slate-200">
            <div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-700 text-base">map</span>
                  Cadastral Boundary Map
                </span>
                <span className="text-[10px] text-emerald-700 font-bold uppercase">
                  GIS Calibrated
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Survey boundary matching Gat {currentParcel.gatNo} against village cadastral sheets.
              </p>

              <div
                className="w-full h-40 bg-cover bg-center rounded-lg relative overflow-hidden border border-slate-200"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCJRtWNQhjHmRiAd-FWQ9zF8jB6SJmpSJ4W7JeJEbE_RLt4ZFthaSvmmhAzkIb9kNgqMqXqv2rCvxGJuxYyMfTbK54PTE8UDI7FMs6hpUfJZU6C11oF1DfDyNBs2sbKUwwOpa3GPKdPRPVI0SKX67gFYHMZDkBCangky8fnJXYmrjvmgMjip3wNx-QFS5JgCH-aS3akRKe5mLr4PWaVnVdZrlWsyc_KILSVUlj0dby4VqMopjGAP9ZeLA')`,
                }}
              >
                <div className="absolute inset-0 bg-slate-900/10"></div>
                <div className="absolute bottom-2 left-2 bg-white/95 px-2 py-0.5 rounded text-slate-900 font-mono text-[10px] font-semibold border border-slate-200">
                  Gat {currentParcel.gatNo} • {currentParcel.areaHa} Ha
                </div>
                {currentParcel.boundaryOverlapHa > 0 && (
                  <div className="absolute top-2 right-2 bg-rose-600 px-2 py-0.5 rounded text-white font-mono text-[10px] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">warning</span>
                    {currentParcel.boundaryOverlapHa} Ha Overlap
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 mt-3 flex justify-between items-center text-xs text-slate-600 border-t border-slate-100">
              <span>Taluka: {currentParcel.taluka}</span>
              <button
                type="button"
                onClick={() => onNavigate('cadastral-map')}
                className="text-slate-900 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Interactive GIS Map</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Card 2: Valuation Matrix */}
          <div className="bg-white rounded-xl shadow-2xs p-4 flex flex-col justify-between border border-slate-200">
            <div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-700 text-base">calculate</span>
                  Valuation Matrix
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">
                  Annual Statement of Rates
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Comparison of seller consideration with official circle rate benchmark.
              </p>

              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-xs border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Circle Rate / Ready Reckoner</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(currentParcel.govtReadyReckonerCr * 10000000).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Seller Consideration</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(currentParcel.askingPriceCr * 10000000).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Rate Variance</span>
                  <span className="font-mono font-bold text-emerald-700">
                    +{(((currentParcel.askingPriceCr - currentParcel.govtReadyReckonerCr) / currentParcel.govtReadyReckonerCr) * 100).toFixed(1)}% (Within Safe Range)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Estimated Stamp Duty (7%)</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(currentParcel.askingPriceCr * 10000000 * 0.07).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 flex justify-between items-center text-xs text-slate-600 border-t border-slate-100">
              <span>Jurisdiction: Sub-Registrar Office</span>
              <span className="text-emerald-700 font-semibold">Compliant</span>
            </div>
          </div>

          {/* Card 3: e-Courts Case Live Status */}
          <div className="bg-white rounded-xl shadow-2xs p-4 flex flex-col justify-between border border-slate-200">
            <div>
              <div className="flex items-center justify-between pb-1">
                <span
                  className={`text-xs font-bold flex items-center gap-1.5 ${
                    currentParcel.hasLitigation ? 'text-rose-700' : 'text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {currentParcel.hasLitigation ? 'balance' : 'verified'}
                  </span>
                  e-Courts Case Roster
                </span>
                <span
                  className={`text-[10px] font-bold uppercase ${
                    currentParcel.hasLitigation ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {currentParcel.hasLitigation ? 'Pending Sub Judice' : 'Clear / Zero Litigation'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Automated synchronization with National Judicial Data Grid (NJDG).
              </p>

              {currentParcel.hasLitigation ? (
                <div className="bg-rose-50 rounded-lg p-3 space-y-1.5 text-xs border border-rose-200">
                  <div className="flex justify-between">
                    <span className="font-semibold text-rose-800">CNR Number:</span>
                    <span className="font-mono font-bold text-slate-900">MHPUN00142982021</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Plaintiff:</span>
                    <span className="font-medium text-slate-900">Smt. Sunita Anant Kadam</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Defendant:</span>
                    <span className="font-medium text-slate-900">Shri Ramesh Mahadev Kadam</span>
                  </div>
                  <div className="flex justify-between text-rose-800">
                    <span className="font-semibold">Current Stage:</span>
                    <span className="font-bold">Interim Injunction Say</span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 rounded-lg p-3 space-y-1.5 text-xs border border-emerald-200">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>No litigation registered in court records</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    NJDG query returned 0 active stays or caveat petitions for this survey.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 mt-3 flex justify-between items-center text-xs text-slate-600 border-t border-slate-100">
              <span>District Court {currentParcel.district}</span>
              <button
                type="button"
                onClick={() => {
                  setCourtNotice(`NJDG Case Roster: Survey ${currentParcel.surveyNo} verified against court records.`);
                  setTimeout(() => setCourtNotice(null), 3500);
                }}
                className={`font-semibold hover:underline flex items-center gap-0.5 ${
                  currentParcel.hasLitigation ? 'text-rose-700' : 'text-slate-900'
                }`}
              >
                <span>View Court Index</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </button>
            </div>
          </div>
        </div>

        {courtNotice && (
          <div className="mt-3 p-3 bg-slate-900 text-white rounded-lg text-xs flex items-center justify-between">
            <span>{courtNotice}</span>
            <button type="button" onClick={() => setCourtNotice(null)} className="text-slate-400 hover:text-white">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}
      </section>

      {/* Action Bar & Multilingual Controls */}
      <section className="w-full max-w-[1360px] mx-auto px-4 md:px-6 pb-6">
        <div className="bg-white rounded-xl p-4 md:p-5 shadow-2xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Multilingual Selector */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-700">Language:</span>
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => handleLangToggle('EN')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  reportLang === 'EN'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLangToggle('MR')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  reportLang === 'MR'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => handleLangToggle('HI')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  reportLang === 'HI'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onOpenShareModal}
              className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              <span>{t.shareAdvocate}</span>
            </button>

            <button
              type="button"
              onClick={onOpenPdfModal}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>{t.downloadPdf}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Statutory Legal Disclaimer */}
      <section className="w-full max-w-[1360px] mx-auto px-4 md:px-6 pb-8">
        <div className="bg-slate-100 p-4 rounded-xl flex items-start gap-3 border border-slate-200 text-xs text-slate-600">
          <span className="material-symbols-outlined text-slate-500 text-lg mt-0.5 shrink-0">
            gavel
          </span>
          <p className="leading-relaxed">
            <strong>{t.statutoryDisclaimer}:</strong> This docket is an AI-assisted title diligence digest synthesizing data from state revenue portals, the Central Registry of Securitisation Asset Reconstruction and Security Interest (CERSAI), and the National Judicial Data Grid. It serves as an informative decision support resource and should be complemented by standard legal title search prior to executing registered instruments.
          </p>
        </div>
      </section>
    </div>
  );
};
