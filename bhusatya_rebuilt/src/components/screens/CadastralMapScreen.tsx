import React, { useState } from 'react';
import { NavScreen, Parcel, Language } from '../../types';
import { mockParcels } from '../../data/mockData';
import { CadastralMap } from '../CadastralMap';
import { CadastralLeafletMap } from '../CadastralLeafletMap';
import { getLanguageTranslation } from '../../data/indianLanguages';

interface CadastralMapScreenProps {
  currentParcel: Parcel;
  onNavigate: (screen: NavScreen) => void;
  onSelectParcel: (parcel: Parcel) => void;
  language: Language;
}

export const CadastralMapScreen: React.FC<CadastralMapScreenProps> = ({
  currentParcel,
  onNavigate,
  onSelectParcel,
  language,
}) => {
  const [mapEngine, setMapEngine] = useState<'leaflet' | 'vector'>('leaflet');
  const [selectedUnit, setSelectedUnit] = useState<'hectares' | 'acres' | 'sqft' | 'gunthas'>('hectares');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const t = getLanguageTranslation(language);

  // Conversion calculations
  const ha = currentParcel.areaHa;
  const acres = +(ha * 2.47105).toFixed(2);
  const gunthas = +(ha * 100).toFixed(1);
  const sqft = Math.round(ha * 107639);

  // Net usable calculations
  const deductionsHa = currentParcel.canalBufferOverlapHa + currentParcel.boundaryOverlapHa;
  const netHa = +(Math.max(0, ha - deductionsHa)).toFixed(2);
  const netAcres = +(netHa * 2.47105).toFixed(2);

  const handleExportGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            surveyNo: currentParcel.surveyNo,
            gatNo: currentParcel.gatNo,
            ulpin: currentParcel.ulpin,
            village: currentParcel.village,
            taluka: currentParcel.taluka,
            district: currentParcel.district,
            state: currentParcel.state,
            ownerName: currentParcel.ownerName,
            grossAreaHa: currentParcel.areaHa,
            netAreaHa: netHa,
            classification: currentParcel.classification,
            trustScore: currentParcel.trustScore,
            status: currentParcel.status,
            epsg: 'EPSG:32643',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [73.73844, 18.59225],
                [73.74025, 18.59217],
                [73.74006, 18.59061],
                [73.73831, 18.59069],
                [73.73844, 18.59225],
              ],
            ],
          },
        },
      ],
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BhuSatya_Cadastral_Parcel_${currentParcel.surveyNo.replace('/', '_')}_${currentParcel.ulpin}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadNotice('GeoJSON spatial dataset exported successfully.');
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  const handleExportMapBlueprint = () => {
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#ffffff" />
      <text x="40" y="50" font-family="sans-serif" font-size="18" font-weight="bold" fill="#0f172a">GOVERNMENT OF INDIA · DILRMP CADASTRAL MAP EXTRACT</text>
      <text x="40" y="80" font-family="sans-serif" font-size="13" fill="#334155">Survey No: ${currentParcel.surveyNo} | ULPIN: ${currentParcel.ulpin}</text>
      <text x="40" y="105" font-family="sans-serif" font-size="12" fill="#64748b">Village: ${currentParcel.village}, Taluka: ${currentParcel.taluka}, District: ${currentParcel.district}, State: ${currentParcel.state}</text>
      <rect x="40" y="130" width="720" height="400" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
      <polygon points="180,200 600,195 580,480 140,490" fill="#0f766e" fill-opacity="0.2" stroke="#0f766e" stroke-width="3" />
      <text x="370" y="340" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a">SURVEY ${currentParcel.surveyNo}</text>
      <text x="370" y="365" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#475569">Gross: ${currentParcel.areaHa} Ha | Net: ${netHa} Ha</text>
      <text x="40" y="560" font-family="sans-serif" font-size="11" fill="#94a3b8">Generated via BhuSatya Cadastral Registry Engine</text>
    </svg>`;

    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cadastral_Mojani_Map_${currentParcel.surveyNo.replace('/', '_')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadNotice('Certified Cadastral SVG Blueprint downloaded.');
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  return (
    <div className="w-full flex flex-col bg-slate-50 pb-16">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 py-3.5 px-4 md:px-6 shadow-2xs">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">map</span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
                  Cadastral GIS Map & Parcel Boundary Inspector
                </h1>
                <span className="text-[11px] font-mono font-medium text-slate-500">
                  · DGPS Calibrated
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Survey No. {currentParcel.surveyNo} · Gat {currentParcel.gatNo} · {currentParcel.village}, {currentParcel.district} ({currentParcel.state})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              ULPIN: <strong className="text-slate-900">{currentParcel.ulpin}</strong>
            </span>
            <button
              type="button"
              onClick={handleExportGeoJSON}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>GeoJSON</span>
            </button>
            <button
              type="button"
              onClick={handleExportMapBlueprint}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">print</span>
              <span>SVG Blueprint</span>
            </button>
          </div>
        </div>
      </div>

      {downloadNotice && (
        <div className="bg-slate-900 text-white py-2 px-4 text-xs font-medium text-center flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="max-w-[1360px] w-full mx-auto px-4 md:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Map Viewport */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200 p-4 md:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-700 text-[18px]">layers</span>
                  Boundary Overlay & Cadastral Vector
                </h2>
                <p className="text-xs text-slate-500">
                  Drag to pan; wheel to zoom. Inspect boundary points, canal setback, and adjacent surveys.
                </p>
              </div>

              {/* Engine & Unit Switchers */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Engine Switcher */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setMapEngine('leaflet')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                      mapEngine === 'leaflet'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">public</span>
                    <span>Live GPS Map</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapEngine('vector')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                      mapEngine === 'vector'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">architecture</span>
                    <span>Cadastral Vector</span>
                  </button>
                </div>

                {/* Unit Switcher */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  {(['hectares', 'acres', 'gunthas', 'sqft'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setSelectedUnit(unit)}
                      className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                        selectedUnit === unit ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {unit === 'sqft' ? 'Sq. Ft' : unit}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* The Map Component */}
            {mapEngine === 'leaflet' ? (
              <CadastralLeafletMap
                currentParcel={currentParcel}
                onSelectParcel={onSelectParcel}
                height="520px"
              />
            ) : (
              <CadastralMap
                currentParcel={currentParcel}
                onSelectParcel={onSelectParcel}
                interactive={true}
                height="520px"
                showControls={true}
                showLegend={true}
              />
            )}

            {/* Area Metrics Quick Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block">Gross Survey Area</span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {selectedUnit === 'hectares' && `${ha} Ha`}
                  {selectedUnit === 'acres' && `${acres} Acres`}
                  {selectedUnit === 'gunthas' && `${gunthas} G`}
                  {selectedUnit === 'sqft' && `${sqft.toLocaleString()} sq.ft`}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">As per 7/12 record</span>
              </div>

              <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200">
                <span className="text-[11px] font-medium text-rose-800 block">Canal Buffer Deduction</span>
                <span className="text-sm font-bold font-mono text-rose-800">
                  -{currentParcel.canalBufferOverlapHa} Ha
                </span>
                <span className="text-[10px] text-rose-600 block mt-0.5">30m Irrigation Setback</span>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200">
                <span className="text-[11px] font-medium text-amber-800 block">Disputed Overlap</span>
                <span className="text-sm font-bold font-mono text-amber-800">
                  -{currentParcel.boundaryOverlapHa} Ha
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5">Adjacent Survey 142/2</span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                <span className="text-[11px] font-medium text-emerald-800 block">Net Conveyance Area</span>
                <span className="text-sm font-bold font-mono text-emerald-800">
                  {selectedUnit === 'hectares' && `${netHa} Ha`}
                  {selectedUnit === 'acres' && `${netAcres} Acres`}
                  {selectedUnit === 'gunthas' && `${+(netHa * 100).toFixed(1)} G`}
                  {selectedUnit === 'sqft' && `${Math.round(netHa * 107639).toLocaleString()} sq.ft`}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">Clear Usable Title</span>
              </div>
            </div>
          </div>

          {/* DGPS Survey Coordinates Table */}
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Boundary Corner Coordinates (DGPS Benchmarks)
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                EPSG:32643 (UTM 43N)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2 px-3">Vertex</th>
                    <th className="py-2 px-3">Corner Location</th>
                    <th className="py-2 px-3 font-mono">Latitude</th>
                    <th className="py-2 px-3 font-mono">Longitude</th>
                    <th className="py-2 px-3">Monument Type</th>
                    <th className="py-2 px-3 text-right">Ground Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-900">V1 (NW)</td>
                    <td className="py-2 px-3 font-sans">North-West Corner</td>
                    <td className="py-2 px-3">18°35'32.1"N</td>
                    <td className="py-2 px-3">73°44'18.4"E</td>
                    <td className="py-2 px-3 font-sans">Concrete Boundary Pillar</td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-sans font-medium">Verified</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-rose-700">V2 (NE)</td>
                    <td className="py-2 px-3 font-sans">North-East (Canal Border)</td>
                    <td className="py-2 px-3">18°35'31.8"N</td>
                    <td className="py-2 px-3">73°44'24.9"E</td>
                    <td className="py-2 px-3 font-sans">Irrigation Marker</td>
                    <td className="py-2 px-3 text-right text-rose-700 font-sans font-medium">30m Buffer</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-amber-700">V3 (SE)</td>
                    <td className="py-2 px-3 font-sans">South-East (Bordering 142/2)</td>
                    <td className="py-2 px-3">18°35'26.2"N</td>
                    <td className="py-2 px-3">73°44'24.2"E</td>
                    <td className="py-2 px-3 font-sans">Stone Mojani Peg</td>
                    <td className="py-2 px-3 text-right text-amber-700 font-sans font-medium">0.02 Ha Disputed</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-900">V4 (SW)</td>
                    <td className="py-2 px-3 font-sans">South-West (Village Cart Track)</td>
                    <td className="py-2 px-3">18°35'26.5"N</td>
                    <td className="py-2 px-3">73°44'17.9"E</td>
                    <td className="py-2 px-3 font-sans">Survey Stone</td>
                    <td className="py-2 px-3 text-right text-slate-700 font-sans font-medium">Right-of-Way</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Parcel List & Navigation Actions */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Parcel Switcher */}
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200 p-4 md:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Audited Cadastral Parcels
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">{mockParcels.length} Records</span>
            </div>

            <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
              {mockParcels.map((p) => {
                const isSelected = p.id === currentParcel.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectParcel(p)}
                    className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-1 text-xs ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>Survey {p.surveyNo}</span>
                        <span className={`text-[10px] px-1 py-0.5 rounded font-mono ${isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
                          {p.stateCode || 'MH'}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold ${isSelected ? 'text-slate-300' : p.status === 'PASS' ? 'text-emerald-700' : p.status === 'WARN' ? 'text-amber-700' : 'text-rose-700'}`}>
                        {p.statusLabel}
                      </span>
                    </div>

                    <div className={`text-[11px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                      {p.village}, {p.district} · {p.ownerName}
                    </div>

                    <div className={`flex items-center justify-between text-[11px] font-mono pt-1 border-t ${isSelected ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                      <span>{p.areaHa} Ha</span>
                      <span>Trust: {p.trustScore}/100</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Diligence Action Panel */}
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200 p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Verification Actions
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigate('should-i-buy-this-report')}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">assignment</span>
                <span>Open Buyer Diligence Report</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('parcel-check-and-red-flag-gate')}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">policy</span>
                <span>Inspect Verification Gate</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('certificate-and-verifier')}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
                <span>Generate Document QR Code</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
