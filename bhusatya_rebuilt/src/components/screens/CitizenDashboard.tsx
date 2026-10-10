import React, { useState } from 'react';
import { NavScreen, Parcel, Language } from '../../types';
import { mockParcels, mockAlerts } from '../../data/mockData';
import { ALL_INDIAN_STATES, IndianState } from '../../data/indianStates';
import { getLanguageTranslation } from '../../data/indianLanguages';
import { api } from '../../services/api';

interface CitizenDashboardProps {
  onNavigate: (screen: NavScreen) => void;
  onSelectParcel: (parcel: Parcel) => void;
  onOpenCheckModal: () => void;
  language: Language;
  onCustomDocUploaded?: (docData: { name: string; url?: string; type: string }) => void;
  currentStateCode: string;
  onStateChange: (state: IndianState) => void;
  onOpenStateModal: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  onNavigate,
  onSelectParcel,
  onOpenCheckModal,
  language,
  onCustomDocUploaded,
  currentStateCode,
  onStateChange,
  onOpenStateModal,
}) => {
  const [filter, setFilter] = useState<'All' | 'Verified' | 'Pending' | 'Attention'>('All');
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const liveAlerts = mockAlerts;

  const t = getLanguageTranslation(language);
  const activeState =
    ALL_INDIAN_STATES.find((s) => s.code === currentStateCode) || ALL_INDIAN_STATES[0];

  const [docUploadId, setDocUploadId] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFileName(file.name);
      setIsUploading(true);

      try {
        // Real Backend Upload
        const docMeta = await api.uploadDocument(file, '7/12_extract');
        setDocUploadId(docMeta.id);

        // Real Backend OCR
        const ocrData = await api.triggerOCR(docMeta.id);

        if (ocrData.khasra_number) {
          onSelectParcel({
            ...mockParcels[0],
            surveyNo: ocrData.khasra_number,
            ownerName: ocrData.owner_name || mockParcels[0].ownerName,
            village: ocrData.village || mockParcels[0].village,
            district: ocrData.district || mockParcels[0].district,
            state: ocrData.state || mockParcels[0].state,
            areaHa: ocrData.land_area ? parseFloat(ocrData.land_area) || 1.45 : 1.45,
          });
        }
      } catch (err) {
        console.warn('Backend offline or upload failed, using local browser buffer:', err);
      } finally {
        const reader = new FileReader();
        reader.onload = () => {
          setIsUploading(false);
          if (onCustomDocUploaded) {
            onCustomDocUploaded({
              name: file.name,
              url: reader.result as string,
              type: file.type || 'application/pdf',
            });
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSelectSchemaPreset = (presetName: string, parcelId: string) => {
    setUploadFileName(presetName);
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      const target = mockParcels.find((p) => p.id === parcelId) || mockParcels[0];
      onSelectParcel(target);
      if (onCustomDocUploaded) {
        onCustomDocUploaded({ name: presetName, type: 'application/pdf' });
      }
    }, 300);
  };

  const handleStateDropdownChange = (code: string) => {
    const matchedState = ALL_INDIAN_STATES.find((s) => s.code === code);
    if (matchedState) {
      onStateChange(matchedState);
      const matchedParcel = mockParcels.find((p) => p.stateCode === code);
      if (matchedParcel) {
        onSelectParcel(matchedParcel);
      }
    }
  };

  const filteredParcels = mockParcels.filter((p) => {
    if (filter === 'All') return true;
    if (filter === 'Verified') return p.status === 'PASS';
    if (filter === 'Pending') return p.status === 'WARN';
    if (filter === 'Attention') return p.status === 'BLOCK';
    return true;
  });

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Hero Welcome Banner */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl text-slate-900 font-bold tracking-tight">
                {t.welcomeBack}, Ananya Sharma
              </h1>
              <span className="text-xs text-slate-500">
                · Aadhaar Verified (•••• 8821) · {activeState.name} Registry Active
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-600">
              National land title diligence, mutation ledger tracking, and judicial registry synchronization across all 28 States & 8 Union Territories.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => onNavigate('cadastral-map')}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">map</span>
              <span>Cadastral GIS Map</span>
            </button>

            <button
              onClick={onOpenStateModal}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">public</span>
              <span>All 36 States & UTs</span>
            </button>

            <button
              onClick={onOpenCheckModal}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-2xs transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>{t.checkParcelBtn}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Two-Column Primary Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (40%): Upload & Guidance */}
        <div className="lg:col-span-5 space-y-5">
          {/* Upload 7/12 or RoR Record Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-700 text-xl">upload_file</span>
                <h2 className="text-sm font-bold text-slate-900">{t.uploadTitle}</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Step 1 of 2</span>
            </div>

            {/* State Authority Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="block text-xs font-semibold text-slate-700"
                  htmlFor="state-authority"
                >
                  State Land Authority
                </label>
                <button
                  type="button"
                  onClick={onOpenStateModal}
                  className="text-[11px] text-slate-600 hover:text-slate-900 font-medium"
                >
                  Browse List
                </button>
              </div>

              <div className="relative">
                <select
                  value={currentStateCode}
                  onChange={(e) => handleStateDropdownChange(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg py-2 px-3 pr-8 text-xs font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 cursor-pointer"
                  id="state-authority"
                >
                  <optgroup label="28 Indian States">
                    {ALL_INDIAN_STATES.filter((s) => s.type === 'state').map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name} – {st.portalName} ({st.docSchema})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="8 Union Territories">
                    {ALL_INDIAN_STATES.filter((s) => s.type === 'ut').map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name} – {st.portalName} ({st.docSchema})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <span className="material-symbols-outlined text-base">expand_more</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Portal: <strong className="text-slate-800">{activeState.portalName}</strong></span>
                <span className="font-mono">{activeState.totalParcelsDigitized} parcels</span>
              </div>
            </div>

            {/* Drag and Drop Dropzone */}
            <div
              className={`border border-dashed ${
                uploadFileName ? 'border-emerald-600 bg-emerald-50/30' : 'border-slate-300 bg-slate-50/60'
              } hover:border-slate-400 transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative`}
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.tiff"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                title="Drop document or click to upload"
              />

              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-700 mb-3">
                <span className="material-symbols-outlined text-xl">
                  {uploadFileName ? 'task_alt' : 'cloud_upload'}
                </span>
              </div>

              {uploadFileName ? (
                <div className="space-y-1 mb-3">
                  <p className="text-xs font-bold text-slate-900">
                    {isUploading ? 'Extracting with OCR...' : `Loaded: ${uploadFileName}`}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    {isUploading ? 'Processing legal fields...' : 'Document parsed · Ready for verification review'}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-900 mb-0.5">{t.dropFiles}</p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    PDF, JPG, TIFF up to 25MB · OCR and digital watermark detection enabled
                  </p>
                </>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full justify-center relative z-10">
                {uploadFileName ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('extract-and-review')}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Proceed to Extract & Review</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                ) : (
                  <>
                    <label className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                      <span className="material-symbols-outlined text-[15px]">folder_open</span>
                      <span>{t.chooseDevice}</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.tiff"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectSchemaPreset(
                          `DigiLocker_${activeState.code}_Verified_RoR.pdf`,
                          'parcel-142-3a'
                        )
                      }
                      className="w-full sm:w-auto px-3 py-1.5 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px] text-slate-600">cloud_download</span>
                      <span>{t.fetchDigilocker}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Standard Schema Quick Selector */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-medium text-slate-500 block">
                Standard state schema samples (Click to prefill):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: '7/12 Satbara (MH)', file: 'MahaBhulekh_7_12_Hinjawadi_142_3A.pdf', id: 'parcel-142-3a' },
                  { name: 'Bhoomi RTC (KA)', file: 'Karnataka_Bhoomi_RTC_88_2B.pdf', id: 'parcel-ka-88' },
                  { name: 'UP Khatauni', file: 'UP_Bhulekh_Khatauni_Gat_412.pdf', id: 'parcel-up-412' },
                  { name: 'Patta Chitta (TN)', file: 'TamilNadu_Patta_Chitta_235.pdf', id: 'parcel-tn-235' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectSchemaPreset(preset.file, preset.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (60%): Registered Parcels */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{t.registeredParcels}</h2>
              <p className="text-xs text-slate-500">
                Parcels audited under National Cadastral Risk Scoring
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs self-start sm:self-auto">
              {(['All', 'Verified', 'Pending', 'Attention'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filter === tab
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Parcel Cards Container */}
          <div className="space-y-3">
            {filteredParcels.map((parcel) => {
              const isPass = parcel.status === 'PASS';
              const isWarn = parcel.status === 'WARN';
              const isBlock = parcel.status === 'BLOCK';

              return (
                <div
                  key={parcel.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Compact Trust Score Badge */}
                    <div
                      className={`w-12 h-12 rounded-lg shrink-0 flex flex-col items-center justify-center font-mono font-bold ${
                        isPass
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isWarn
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      <span className="text-sm leading-none">{parcel.trustScore}</span>
                      <span className="text-[9px] text-slate-500 font-normal">/100</span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1 flex-1 min-w-0 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          Survey {parcel.surveyNo}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {parcel.stateCode || 'MH'}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span
                          className={`font-semibold ${
                            isPass ? 'text-emerald-700' : isWarn ? 'text-amber-700' : 'text-rose-700'
                          }`}
                        >
                          {parcel.statusLabel}
                        </span>
                      </div>

                      <p className="text-slate-600 truncate">
                        {parcel.village}, {parcel.taluka}, {parcel.district}
                      </p>

                      <div className="text-slate-600">
                        {parcel.areaHa} Ha ({parcel.areaAcres} Acres) · Titleholder: <strong className="text-slate-800">{parcel.ownerName}</strong>
                      </div>

                      {/* Unboxed Metadata Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
                        {parcel.tags.map((tag, idx) => (
                          <span key={idx}>
                            {idx > 0 && <span className="mr-1.5 text-slate-300">·</span>}
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectParcel(parcel);
                        onNavigate('should-i-buy-this-report');
                      }}
                      className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <span>View Report</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Recent Regulatory & Mutation Alerts */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Recent Title & Registry Events
            </h2>
            <p className="text-xs text-slate-500">
              Synchronized across State Land Records, High Court Roster, and CERSAI Central Registry
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Realtime Feed Active
          </span>
        </div>

        {/* Timeline List */}
        <div className="divide-y divide-slate-100">
          {liveAlerts.map((alert) => (
            <div key={alert.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
              <div className="space-y-0.5 min-w-0">
                <p className="font-semibold text-slate-900">{alert.title}</p>
                <p className="text-slate-600 text-[11px]">{alert.description}</p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono shrink-0">{alert.timestamp}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
