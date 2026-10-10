import React, { useState } from 'react';
import { Parcel } from '../../types';
import { mockParcels } from '../../data/mockData';

interface CheckParcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectParcel: (parcel: Parcel) => void;
}

export const CheckParcelModal: React.FC<CheckParcelModalProps> = ({
  isOpen,
  onClose,
  onSelectParcel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateCode, setStateCode] = useState('MH');

  if (!isOpen) return null;

  const filtered = mockParcels.filter(
    (p) =>
      p.surveyNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ulpin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#131b2e]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-xl max-w-lg w-full p-6 shadow-2xl border border-[#c0c9be]/50 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#c0c9be]/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#003b1b] text-xl">travel_explore</span>
            <h3 className="text-base font-bold text-[#131b2e]">
              Search Land Records (भूखंड शोध)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#717970] hover:text-[#131b2e] p-1 rounded"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* State select */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#404941] uppercase tracking-wider block">
            Select State Registry
          </label>
          <select
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className="w-full bg-[#f2f3ff] text-[#131b2e] border border-[#c0c9be] rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#003b1b]"
          >
            <option value="MH">Maharashtra (MahaBhulekh / 7/12 & Ferfar)</option>
            <option value="KA">Karnataka (Bhoomi RTC / Pahani)</option>
            <option value="UP">Uttar Pradesh (Bhulekh Khatauni)</option>
            <option value="TS">Telangana (Dharani Portal)</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#717970]">
            <span className="material-symbols-outlined text-base">search</span>
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type Survey No (e.g., 142/3A), Gat No, Village or ULPIN..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#c0c9be] rounded-lg text-xs text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#003b1b]"
            autoFocus
          />
        </div>

        {/* Quick Suggestions list */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <span className="text-[11px] font-semibold text-[#717970] uppercase tracking-wider block">
            Synchronized Parcels
          </span>
          {filtered.map((parcel) => (
            <div
              key={parcel.id}
              onClick={() => {
                onSelectParcel(parcel);
                onClose();
              }}
              className="p-3 rounded-lg bg-[#f2f3ff] hover:bg-[#eaedff] border border-[#c0c9be]/40 cursor-pointer transition-colors flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#131b2e]">
                    Survey {parcel.surveyNo} / Gat {parcel.gatNo}
                  </span>
                  <span className="text-[10px] text-[#717970]">({parcel.village})</span>
                </div>
                <p className="text-[11px] text-[#404941]">
                  {parcel.ownerName} • {parcel.areaHa} Ha
                </p>
                <span className="font-mono text-[10px] text-[#003b1b]">{parcel.ulpin}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  parcel.status === 'PASS'
                    ? 'bg-[#92f5a4] text-[#007233]'
                    : parcel.status === 'WARN'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-[#ffdad6] text-[#93000a]'
                }`}
              >
                {parcel.trustScore} / 100
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-[#c0c9be]/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#eaedff] text-[#131b2e] text-xs font-bold hover:bg-[#dae2fd]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
