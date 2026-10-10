import React, { useState } from 'react';
import { NavScreen, Parcel } from '../../types';
import { mockParcels } from '../../data/mockData';

interface RevenueOfficerQueueProps {
  onNavigate: (screen: NavScreen) => void;
  onSelectParcel: (parcel: Parcel) => void;
}

export const RevenueOfficerQueue: React.FC<RevenueOfficerQueueProps> = ({
  onNavigate,
  onSelectParcel,
}) => {
  const [filter, setFilter] = useState<'all' | 'frozen' | 'hearings'>('all');
  const [officerNotes, setOfficerNotes] = useState<{ [id: string]: string }>({});

  const handleReview = (parcel: Parcel) => {
    onSelectParcel(parcel);
    onNavigate('parcel-check-and-red-flag-gate');
  };

  const filteredParcels = mockParcels.filter((p) => {
    if (filter === 'frozen') return p.status === 'BLOCK';
    if (filter === 'hearings') return p.hasLitigation;
    return true;
  });

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Officer Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              alt="Shri Rajeshwar Rao, IAS"
              className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-200"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqns_K8awSz6EFRZ6wGByQijnAKZwacYK2Q-nQNccVY-VFEm8TZbydrqGQsswPcC3jB3OYT1gyBbofPdZPuhdYTWm2D0Gvs2-KYyeTrmYAJ-WUkBw4upqsELw2_dHYeVHl8LVMg2RyVtwHMuYtsXAAzgl5QpuWpql5-in7q-F07XTQLNneP6y_ubOPVJb3-nsiOiWE-h6gP6oGtqiBsWRUdmVmqK5h7D43eiJTBA44Nvisvdlnl8UeKQ"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-slate-900">
                  Revenue Officer Adjudication Queue
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                  IAS Class-3 DSC Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Officer: <strong className="text-slate-800">Shri Rajeshwar Rao, IAS</strong> • Divisional Commissioner / Land Revenue Division
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold border border-slate-200">
              Session: #MH-2025-0982-REG
            </span>
          </div>
        </div>
      </section>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Pending Section 22A & Registration Lock Reviews ({filteredParcels.length} Items)
            </h2>
            <p className="text-xs text-slate-500">
              Cases requiring statutory examination under Registration Act 1908
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Cases
            </button>
            <button
              type="button"
              onClick={() => setFilter('frozen')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filter === 'frozen' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Frozen (Sec 22A)
            </button>
            <button
              type="button"
              onClick={() => setFilter('hearings')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filter === 'hearings' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Litigation Active
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredParcels.map((parcel) => (
            <div
              key={parcel.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    Survey {parcel.surveyNo} (Gat {parcel.gatNo})
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-600">
                    {parcel.village}, {parcel.taluka}, {parcel.district}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-semibold uppercase border ${
                      parcel.status === 'BLOCK'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : parcel.status === 'WARN'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {parcel.statusLabel}
                  </span>
                </div>

                <span className="font-mono text-xs text-slate-500">ULPIN: {parcel.ulpin}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Titleholder:</span>
                  <span className="font-semibold text-slate-900">{parcel.ownerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Litigation / Objections:</span>
                  <span className={`font-medium ${parcel.hasLitigation ? 'text-rose-700' : 'text-slate-900'}`}>
                    {parcel.courtCaseNo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Financial Encumbrance:</span>
                  <span className="font-medium text-slate-900">
                    {parcel.unreleasedMortgageAmount > 0
                      ? `₹${(parcel.unreleasedMortgageAmount / 100000).toFixed(2)} Lakhs (${parcel.bankLienHolder})`
                      : 'Nil (Clear)'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <input
                  type="text"
                  placeholder="Add officer administrative remarks..."
                  value={officerNotes[parcel.id] || ''}
                  onChange={(e) =>
                    setOfficerNotes({ ...officerNotes, [parcel.id]: e.target.value })
                  }
                  className="w-full sm:w-80 h-8 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReview(parcel)}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                    <span>Review Red-Flag Gate</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
