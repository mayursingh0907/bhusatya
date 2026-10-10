import React, { useState } from 'react';
import { ALL_INDIAN_STATES, IndianState } from '../../data/indianStates';

interface StateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStateCode: string;
  onSelectState: (state: IndianState) => void;
}

export const StateSelectorModal: React.FC<StateSelectorModalProps> = ({
  isOpen,
  onClose,
  currentStateCode,
  onSelectState,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'state' | 'ut'>('all');

  if (!isOpen) return null;

  const filtered = ALL_INDIAN_STATES.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      st.portalName.toLowerCase().includes(search.toLowerCase()) ||
      st.docSchema.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || st.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">public</span>
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Connect State Land Records Portal (28 States & 8 UTs)
              </h3>
              <p className="text-[11px] text-slate-500">
                Digital India Land Records Modernization Programme (DILRMP) Architecture
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

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <span className="material-symbols-outlined text-base">search</span>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by state name, portal (e.g. Bhoomi, Banglarbhumi, Dharani, 7/12)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              autoFocus
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              All (36)
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('state')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                typeFilter === 'state' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              28 States
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('ut')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                typeFilter === 'ut' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              8 UTs
            </button>
          </div>
        </div>

        {/* State Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 overflow-y-auto pr-1 flex-1 py-1">
          {filtered.map((st: IndianState) => {
            const isSelected = currentStateCode === st.code;
            return (
              <button
                key={st.code}
                type="button"
                onClick={() => {
                  onSelectState(st);
                  onClose();
                }}
                className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold truncate">
                      {st.name} <span className="opacity-80 font-normal">({st.nativeName})</span>
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {st.code}
                    </span>
                  </div>

                  <p
                    className={`text-[11px] font-semibold truncate ${
                      isSelected ? 'text-emerald-400' : 'text-slate-700'
                    }`}
                  >
                    {st.portalName}
                  </p>
                  <p
                    className={`text-[10px] truncate mt-0.5 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    Schema: {st.docSchema}
                  </p>
                </div>

                <div
                  className={`flex items-center justify-between pt-2 mt-2 border-t text-[10px] font-mono ${
                    isSelected ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  <span>{st.totalParcelsDigitized} Parcels</span>
                  <span className="material-symbols-outlined text-[14px]">
                    {isSelected ? 'check_circle' : 'arrow_forward'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>All 28 States & 8 Union Territories live on NIC registry stack</span>
          </div>
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
