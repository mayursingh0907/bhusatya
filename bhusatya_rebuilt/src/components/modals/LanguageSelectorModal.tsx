import React, { useState } from 'react';
import { INDIAN_LANGUAGES, LanguageOption } from '../../data/indianLanguages';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelectLanguage: (langCode: string) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = INDIAN_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">translate</span>
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Select Indian State Language (भारतीय भाषा निवडा)
              </h3>
              <p className="text-[11px] text-slate-500">
                Eighth Schedule 22 Official Languages + English • Pan-India Localization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <span className="material-symbols-outlined text-base">search</span>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search language (e.g. Bengali, Tamil, मराठी, తెలుగు, Hindi)..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            autoFocus
          />
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1 py-1">
          {filtered.map((lang: LanguageOption) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onSelectLanguage(lang.code);
                  onClose();
                }}
                className={`p-3 rounded-lg border text-left transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold truncate">{lang.nativeName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {lang.code}
                    </span>
                  </div>
                  <div className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                    {lang.name} • <span className="italic">{lang.script}</span>
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isSelected ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {lang.region}
                  </div>
                </div>

                {isSelected ? (
                  <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0">
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0">
                    chevron_right
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>🇮🇳 22 Official Constitutional Languages Supported</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
