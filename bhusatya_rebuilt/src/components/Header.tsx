import React from 'react';
import { NavScreen, Language } from '../types';
import { INDIAN_LANGUAGES, getLanguageTranslation, TranslationDictionary } from '../data/indianLanguages';
import { ALL_INDIAN_STATES } from '../data/indianStates';

interface HeaderProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeRole: 'citizen' | 'officer';
  onRoleToggle: () => void;
  onOpenCheckModal: () => void;
  currentStateCode: string;
  onOpenStateModal: () => void;
  onOpenLanguageModal: () => void;
  onOpenAuthModal: () => void;
  currentUser?: any;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  language,
  onLanguageChange,
  activeRole,
  onRoleToggle,
  onOpenCheckModal,
  currentStateCode,
  onOpenStateModal,
  onOpenLanguageModal,
  onOpenAuthModal,
  currentUser,
  onLogout,
}) => {
  const navItems: {
    id: NavScreen;
    translationKey: keyof TranslationDictionary | 'cadastralMap';
    defaultLabel: string;
    labelMr: string;
    labelHi: string;
  }[] = [
    { id: 'citizen-dashboard', translationKey: 'dashboard', defaultLabel: 'Dashboard', labelMr: 'डॅशबोर्ड', labelHi: 'डैशबोर्ड' },
    { id: 'cadastral-map', translationKey: 'cadastralMap', defaultLabel: 'Cadastral GIS Map', labelMr: 'भू-नकाशा', labelHi: 'भू-नक्शा' },
    { id: 'extract-and-review', translationKey: 'extractReview', defaultLabel: 'Document Extraction', labelMr: 'अभिलेख तपासणी', labelHi: 'दस्तावेज़ सत्यापन' },
    { id: 'parcel-check-and-red-flag-gate', translationKey: 'parcelCheck', defaultLabel: 'Verification Gate', labelMr: 'गट तपासणी', labelHi: 'भूखंड जांच' },
    { id: 'should-i-buy-this-report', translationKey: 'report', defaultLabel: 'Diligence Report', labelMr: 'खरेदी सल्ला अहवाल', labelHi: 'खरीद सलाह रिपोर्ट' },
    { id: 'heir-consent-tracker', translationKey: 'heirTracker', defaultLabel: 'Heir Consent Tracker', labelMr: 'वारसदार संमती', labelHi: 'वारिस सहमति' },
    { id: 'certificate-and-verifier', translationKey: 'verifier', defaultLabel: 'Certificate & QR Verifier', labelMr: 'प्रमाणपत्र व सत्यापन', labelHi: 'प्रमाणपत्र एवं सत्यापन' },
    { id: 'revenue-officer-queue', translationKey: 'officerQueue', defaultLabel: 'Officer Queue', labelMr: 'अधिकारी कक्ष', labelHi: 'अधिकारी कतार' },
  ];

  const currentLangObj = INDIAN_LANGUAGES.find((l) => l.code === language) || INDIAN_LANGUAGES[0];
  const currentStateObj = ALL_INDIAN_STATES.find((s) => s.code === currentStateCode) || ALL_INDIAN_STATES[0];
  const t = getLanguageTranslation(language);

  const getLabel = (item: (typeof navItems)[0]) => {
    if (item.id === 'cadastral-map') {
      if (language === 'MR') return item.labelMr;
      if (language === 'HI') return item.labelHi;
      return item.defaultLabel;
    }
    const key = item.translationKey as keyof TranslationDictionary;
    if (t && t[key]) return t[key];
    if (language === 'MR' && item.labelMr) return item.labelMr;
    if (language === 'HI' && item.labelHi) return item.labelHi;
    return item.defaultLabel;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Subtle National Accent Hairline */}
      <div className="w-full h-0.5 bg-gradient-to-r from-amber-500 via-slate-200 to-emerald-600"></div>

      {/* Main Top Header Strip */}
      <div className="w-full max-w-[1360px] mx-auto px-4 md:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Clean Brand Lockup */}
          <div
            className="flex items-center gap-3 cursor-pointer shrink-0"
            onClick={() => onNavigate('citizen-dashboard')}
          >
            <img
              alt="National Emblem"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1VC6Lvfw1ZNmLyeETiRRdEE4O0xO9UF59J5XKvkHwaqsRxjXIOFL3iv08WuHUnzY2OvEmJJ-MZ0hsLM9tIyIfOPU0EZF4XuxV3ILITcBimVUhtZ18LTc8a9IpLTZGa8bI6iapPl1IbcAbIAQ_r5uJHBjUva_IMqxsbJ9EU3yVoUPBnA7GmpdP05_VkzEq0iqwhiLwuCIJ38ubi1gx24rEpzWEEE17mMQrfMmZXwJvlx6RKuwkOsXQ7IA86w"
            />
            <div className="flex flex-col">
              <span className="text-slate-900 font-bold tracking-tight text-lg leading-tight">
                BhuSatya
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline leading-tight">
                National Cadastral Title & Land Registry Intelligence
              </span>
            </div>
          </div>

          {/* Zone 2: Essential Functional Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active State Selector */}
            <button
              type="button"
              onClick={onOpenStateModal}
              title="Switch State or Union Territory"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-medium transition-colors"
            >
              <span className="font-semibold text-slate-900">{currentStateObj.name}</span>
              <span className="text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-slate-200 text-slate-700">
                {currentStateObj.code}
              </span>
              <span className="material-symbols-outlined text-[16px] text-slate-400">
                arrow_drop_down
              </span>
            </button>

            {/* Quick Language Switcher */}
            <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => onLanguageChange('EN')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  language === 'EN' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('HI')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  language === 'HI' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('MR')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  language === 'MR' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={onOpenLanguageModal}
                className="px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors flex items-center gap-1"
                title="All 22 Official Indian Languages"
              >
                <span>{language !== 'EN' && language !== 'HI' && language !== 'MR' ? currentLangObj.nativeName : 'All Languages'}</span>
                <span className="material-symbols-outlined text-[14px]">translate</span>
              </button>
            </div>

            {/* Search Parcel Button */}
            <button
              type="button"
              onClick={onOpenCheckModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>Search Parcel</span>
            </button>

            {/* User Profile & Auth Modal Trigger */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={onOpenAuthModal}
                title="Switch User / Sign In"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="flex flex-col items-end text-right hidden lg:flex">
                  <span className="text-xs font-semibold text-slate-900 truncate max-w-[150px]">
                    {currentUser ? currentUser.full_name : (activeRole === 'officer' ? 'Shri R. Rao, IAS' : 'Ananya Sharma')}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {currentUser ? `${currentUser.role} · Signed In` : (activeRole === 'officer' ? 'Revenue Officer' : 'Citizen')}
                  </span>
                </div>
                <img
                  alt="User Profile"
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqns_K8awSz6EFRZ6wGByQijnAKZwacYK2Q-nQNccVY-VFEm8TZbydrqGQsswPcC3jB3OYT1gyBbofPdZPuhdYTWm2D0Gvs2-KYyeTrmYAJ-WUkBw4upqsELw2_dHYeVHl8LVMg2RyVtwHMuYtsXAAzgl5QpuWpql5-in7q-F07XTQLNneP6y_ubOPVJb3-nsiOiWE-h6gP6oGtqiBsWRUdmVmqK5h7D43eiJTBA44Nvisvdlnl8UeKQ"
                />
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Log out of session"
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Bar Row */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-100 py-1.5">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                type="button"
                className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition-colors font-medium ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {getLabel(item)}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
