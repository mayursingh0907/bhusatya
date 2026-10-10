import React, { useState, useRef, useEffect } from 'react';
import { Parcel } from '../types';

interface CadastralMapProps {
  currentParcel: Parcel;
  onSelectParcel?: (parcel: Parcel) => void;
  interactive?: boolean;
  className?: string;
  height?: string;
  showControls?: boolean;
  showLegend?: boolean;
}

interface BoundaryVertex {
  id: string;
  x: number;
  y: number;
  label: string;
  lat: string;
  lng: string;
}

export const CadastralMap: React.FC<CadastralMapProps> = ({
  currentParcel,
  onSelectParcel,
  interactive = true,
  className = '',
  height = '480px',
  showControls = true,
  showLegend = true,
}) => {
  const [mapMode, setMapMode] = useState<'vector' | 'satellite' | 'hybrid'>('vector');
  const [showHistoric1965, setShowHistoric1965] = useState(false);
  const [showCanalBuffer, setShowCanalBuffer] = useState(true);
  const [showOverlapWarning, setShowOverlapWarning] = useState(true);
  const [showRightOfWay, setShowRightOfWay] = useState(true);
  const [showVertices, setShowVertices] = useState(true);
  const [selectedVertex, setSelectedVertex] = useState<BoundaryVertex | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // Pan and Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number; lat: string; lng: string }>({
    x: 0,
    y: 0,
    lat: '18.5913° N',
    lng: '73.7389° E',
  });

  // Measurement tool
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset view when parcel changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedVertex(null);
    setMeasurePoints([]);
  }, [currentParcel.id]);

  // Vertices for active parcel
  const vertices: BoundaryVertex[] = [
    { id: 'V1', x: 160, y: 118, label: 'Corner NW', lat: '18°35\'32.1"N', lng: '73°44\'18.4"E' },
    { id: 'V2', x: 395, y: 115, label: 'Corner NE (Canal)', lat: '18°35\'31.8"N', lng: '73°44\'24.9"E' },
    { id: 'V3', x: 385, y: 340, label: 'Corner SE (Overlap)', lat: '18°35\'26.2"N', lng: '73°44\'24.2"E' },
    { id: 'V4', x: 135, y: 345, label: 'Corner SW (Cart Track)', lat: '18°35\'26.5"N', lng: '73°44\'17.9"E' },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    if (isMeasuring) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = (e.clientX - rect.left - pan.x) / zoom;
        const clickY = (e.clientY - rect.top - pan.y) / zoom;
        if (measurePoints.length >= 2) {
          setMeasurePoints([{ x: clickX, y: clickY }]);
        } else {
          setMeasurePoints([...measurePoints, { x: clickX, y: clickY }]);
        }
      }
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left - pan.x) / zoom;
      const relativeY = (e.clientY - rect.top - pan.y) / zoom;
      const lat = (18.5912 + (220 - relativeY) * 0.00008).toFixed(4);
      const lng = (73.7388 + (relativeX - 270) * 0.00008).toFixed(4);
      setCursorCoords({
        x: Math.round(relativeX),
        y: Math.round(relativeY),
        lat: `${lat}° N`,
        lng: `${lng}° E`,
      });
    }

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.6, +(z - 0.25).toFixed(2)));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setMeasurePoints([]);
    setIsMeasuring(false);
  };

  // Measured distance in meters
  const measuredDistance =
    measurePoints.length === 2
      ? Math.round(
          Math.hypot(measurePoints[1].x - measurePoints[0].x, measurePoints[1].y - measurePoints[0].y) * 0.72
        )
      : null;

  return (
    <div className={`relative flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-2xs select-none ${className}`}>
      {/* Top Map Action Strip */}
      {showControls && (
        <div className="relative z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setMapMode('vector')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                mapMode === 'vector' ? 'bg-slate-900 text-white shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cadastral Vector
            </button>
            <button
              type="button"
              onClick={() => setMapMode('satellite')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                mapMode === 'satellite' ? 'bg-slate-900 text-white shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite Aerial
            </button>
            <button
              type="button"
              onClick={() => setMapMode('hybrid')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                mapMode === 'hybrid' ? 'bg-slate-900 text-white shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hybrid
            </button>
          </div>

          {/* Quick Layer Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowHistoric1965(!showHistoric1965)}
              className={`px-2 py-1 rounded text-[11px] font-semibold border flex items-center gap-1 transition-colors ${
                showHistoric1965
                  ? 'bg-slate-800 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">history_edu</span>
              <span>1965 Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCanalBuffer(!showCanalBuffer)}
              className={`px-2 py-1 rounded text-[11px] font-semibold border flex items-center gap-1 transition-colors ${
                showCanalBuffer
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">wrong_location</span>
              <span>Canal Buffer</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOverlapWarning(!showOverlapWarning)}
              className={`px-2 py-1 rounded text-[11px] font-semibold border flex items-center gap-1 transition-colors ${
                showOverlapWarning
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">crisis_alert</span>
              <span>Dispute 0.02 Ha</span>
            </button>
          </div>

          {/* Zoom / Measure / Reset tool buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setIsMeasuring(!isMeasuring);
                setMeasurePoints([]);
              }}
              title="Click two points to measure distance"
              className={`w-7 h-7 flex items-center justify-center rounded border transition-colors ${
                isMeasuring
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">straighten</span>
            </button>
            <button
              type="button"
              onClick={zoomIn}
              title="Zoom In"
              className="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
            <button
              type="button"
              onClick={zoomOut}
              title="Zoom Out"
              className="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <button
              type="button"
              onClick={resetView}
              title="Reset Map View"
              className="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            </button>
          </div>
        </div>
      )}

      {/* Measurement banner */}
      {isMeasuring && (
        <div className="relative z-20 bg-slate-900 text-white px-3.5 py-1.5 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-emerald-400">straighten</span>
            <span>
              {measurePoints.length === 0
                ? 'Click starting vertex on map to begin measurement.'
                : measurePoints.length === 1
                ? 'Click second vertex on map to complete distance calculation.'
                : `Measured Boundary Distance: ${measuredDistance} meters (${(
                    (measuredDistance || 0) * 3.28084
                  ).toFixed(1)} ft)`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMeasurePoints([])}
            className="text-[11px] underline text-slate-300 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ height }}
        className={`relative w-full overflow-hidden cursor-${
          isMeasuring ? 'crosshair' : isDragging ? 'grabbing' : 'grab'
        }`}
      >
        {/* Satellite Background */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCJRtWNQhjHmRiAd-FWQ9zF8jB6SJmpSJ4W7JeJEbE_RLt4ZFthaSvmmhAzkIb9kNgqMqXqv2rCvxGJuxYyMfTbK54PTE8UDI7FMs6hpUfJZU6C11oF1DfDyNBs2sbKUwwOpa3GPKdPRPVI0SKX67gFYHMZDkBCangky8fnJXYmrjvmgMjip3wNx-QFS5JgCH-aS3akRKe5mLr4PWaVnVdZrlWsyc_KILSVUlj0dby4VqMopjGAP9ZeLA')`,
            opacity: mapMode === 'vector' ? 0.35 : mapMode === 'hybrid' ? 0.75 : 0.95,
          }}
        ></div>

        {/* Ambient Darkening */}
        <div className="absolute inset-0 bg-[#131b2e]/40 pointer-events-none"></div>

        {/* 1965 Cadastral Survey Historical Layer */}
        {showHistoric1965 && (
          <div className="absolute inset-0 bg-amber-950/30 mix-blend-color-burn pointer-events-none border-4 border-amber-600/70">
            <div className="absolute top-3 left-3 bg-amber-950/90 text-amber-200 text-[10px] font-mono px-2.5 py-1 rounded shadow-md border border-amber-700/60">
              Taluka Archive Sheet 1965 • Settlement Revision Act VII
            </div>
          </div>
        )}

        {/* Transformable Canvas Group */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="w-full h-full absolute inset-0"
        >
          <svg className="w-full h-full" viewBox="0 0 540 440" preserveAspectRatio="none">
            <defs>
              {/* Striped hazard fill for canal reservation */}
              <pattern
                id="cadastralCanalPattern"
                patternUnits="userSpaceOnUse"
                width="12"
                height="12"
                patternTransform="rotate(45 0 0)"
              >
                <line x1="0" y1="0" x2="0" y2="12" stroke="#BA1A1A" strokeWidth="4" strokeOpacity="0.85" />
                <line x1="0" y1="0" x2="0" y2="12" stroke="#FFA14E" strokeWidth="2" strokeOpacity="0.5" />
              </pattern>
              {/* DGPS overlap pattern */}
              <pattern
                id="cadastralOverlapPattern"
                patternUnits="userSpaceOnUse"
                width="8"
                height="8"
                patternTransform="rotate(135 0 0)"
              >
                <line x1="0" y1="0" x2="0" y2="8" stroke="#FFA14E" strokeWidth="3" strokeOpacity="0.9" />
              </pattern>
            </defs>

            {/* Grid Coordinates Lines */}
            <g opacity="0.15" stroke="#FFFFFF" strokeWidth="0.5">
              <line x1="0" y1="110" x2="540" y2="110" strokeDasharray="3,3" />
              <line x1="0" y1="220" x2="540" y2="220" strokeDasharray="3,3" />
              <line x1="0" y1="330" x2="540" y2="330" strokeDasharray="3,3" />
              <line x1="135" y1="0" x2="135" y2="440" strokeDasharray="3,3" />
              <line x1="270" y1="0" x2="270" y2="440" strokeDasharray="3,3" />
              <line x1="405" y1="0" x2="405" y2="440" strokeDasharray="3,3" />
            </g>

            {/* Adjacent North Parcel 142/1 */}
            <polygon
              points="40,20 280,25 250,110 50,100"
              fill="#EAEDFF"
              fillOpacity={hoveredFeature === '142/1' ? '0.35' : '0.15'}
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeDasharray="4,3"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredFeature('142/1')}
              onMouseLeave={() => setHoveredFeature(null)}
            />
            <text x="130" y="65" fill="#FFFFFF" fontSize="12" fontWeight="600" opacity="0.85">
              Survey 142/1 (0.90 Ha)
            </text>

            {/* Adjacent West Parcel 141 */}
            <polygon
              points="20,115 150,125 130,340 10,320"
              fill="#EAEDFF"
              fillOpacity={hoveredFeature === '141' ? '0.35' : '0.15'}
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeDasharray="4,3"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredFeature('141')}
              onMouseLeave={() => setHoveredFeature(null)}
            />
            <text x="50" y="225" fill="#FFFFFF" fontSize="12" fontWeight="600" opacity="0.85">
              Survey 141
            </text>

            {/* Adjacent South Parcel 143 */}
            <polygon
              points="125,355 410,345 390,425 105,420"
              fill="#EAEDFF"
              fillOpacity={hoveredFeature === '143' ? '0.35' : '0.15'}
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeDasharray="4,3"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredFeature('143')}
              onMouseLeave={() => setHoveredFeature(null)}
            />
            <text x="240" y="390" fill="#FFFFFF" fontSize="12" fontWeight="600" opacity="0.85">
              Survey 143
            </text>

            {/* Adjacent East Parcel 142/2 */}
            <polygon
              points="395,115 520,110 500,335 385,340"
              fill="#EAEDFF"
              fillOpacity={hoveredFeature === '142/2' ? '0.35' : '0.15'}
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeDasharray="4,3"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredFeature('142/2')}
              onMouseLeave={() => setHoveredFeature(null)}
            />
            <text x="430" y="220" fill="#FFFFFF" fontSize="12" fontWeight="600" opacity="0.85">
              Survey 142/2
            </text>

            {/* TARGET PARCEL (Survey 142/3A or Current Parcel Polygon) */}
            <polygon
              points="160,118 395,115 385,340 135,345"
              fill="#006D30"
              fillOpacity="0.32"
              stroke="#92F5A4"
              strokeWidth="3.5"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredFeature(`target-${currentParcel.surveyNo}`)}
              onMouseLeave={() => setHoveredFeature(null)}
            />

            {/* Canal Buffer Reservation Strip (Hazard Zone) */}
            {showCanalBuffer && currentParcel.canalBufferOverlapHa > 0 && (
              <polygon
                points="335,116 395,115 385,340 325,341"
                fill="url(#cadastralCanalPattern)"
                stroke="#BA1A1A"
                strokeWidth="2"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredFeature('canal-buffer')}
                onMouseLeave={() => setHoveredFeature(null)}
              />
            )}

            {/* 0.02 Ha Disputed Overlap Zone */}
            {showOverlapWarning && currentParcel.boundaryOverlapHa > 0 && (
              <polygon
                points="380,200 405,200 400,280 375,280"
                fill="url(#cadastralOverlapPattern)"
                stroke="#FFA14E"
                strokeWidth="2"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredFeature('overlap')}
                onMouseLeave={() => setHoveredFeature(null)}
              />
            )}

            {/* Right of Way / Cart Track */}
            {showRightOfWay && (
              <path
                d="M 110,300 C 135,320 160,335 190,360"
                fill="none"
                stroke="#60A5FA"
                strokeWidth="2.5"
                strokeDasharray="5,4"
              />
            )}

            {/* Interactive Vertices */}
            {showVertices &&
              vertices.map((v) => {
                const isSelected = selectedVertex?.id === v.id;
                return (
                  <g
                    key={v.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVertex(v);
                    }}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={v.x}
                      cy={v.y}
                      r={isSelected ? 6.5 : 4.5}
                      fill={v.id === 'V2' ? '#BA1A1A' : v.id === 'V3' ? '#FFA14E' : '#FFFFFF'}
                      stroke="#003B1B"
                      strokeWidth={isSelected ? 3 : 2}
                    />
                    <text
                      x={v.x + 8}
                      y={v.y - 6}
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {v.id}
                    </text>
                  </g>
                );
              })}

            {/* Measurement tool connecting line */}
            {measurePoints.length === 2 && (
              <g>
                <line
                  x1={measurePoints[0].x}
                  y1={measurePoints[0].y}
                  x2={measurePoints[1].x}
                  y2={measurePoints[1].y}
                  stroke="#00E676"
                  strokeWidth="2.5"
                  strokeDasharray="4,3"
                />
                <circle cx={measurePoints[0].x} cy={measurePoints[0].y} r="5" fill="#00E676" />
                <circle cx={measurePoints[1].x} cy={measurePoints[1].y} r="5" fill="#00E676" />
                <text
                  x={(measurePoints[0].x + measurePoints[1].x) / 2}
                  y={(measurePoints[0].y + measurePoints[1].y) / 2 - 8}
                  fill="#00E676"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {measuredDistance}m
                </text>
              </g>
            )}

            {/* Primary Parcel Badge Pill */}
            <rect x="180" y="195" width="135" height="42" rx="6" fill="#003B1B" fillOpacity="0.92" />
            <text x="247" y="213" textAnchor="middle" fill="#B1F2BE" fontSize="12" fontWeight="700">
              SURVEY {currentParcel.surveyNo}
            </text>
            <text x="247" y="228" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="500">
              Net: {currentParcel.areaHa} Hectares
            </text>

            {/* Canal Buffer Badge */}
            {showCanalBuffer && currentParcel.canalBufferOverlapHa > 0 && (
              <>
                <rect x="330" y="145" width="105" height="34" rx="4" fill="#BA1A1A" fillOpacity="0.95" />
                <text x="382" y="159" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="700">
                  CANAL BUFFER
                </text>
                <text x="382" y="171" textAnchor="middle" fill="#FFDAD6" fontSize="8">
                  30m Reservation
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Selected Vertex HUD card */}
        {selectedVertex && (
          <div className="absolute top-3 right-3 z-30 bg-[#ffffff]/95 backdrop-blur-md p-3 rounded-lg shadow-lg border border-[#c0c9be]/60 text-xs space-y-1 max-w-[210px]">
            <div className="flex items-center justify-between border-b border-[#c0c9be]/40 pb-1">
              <span className="font-bold text-[#003b1b]">{selectedVertex.label}</span>
              <button
                type="button"
                onClick={() => setSelectedVertex(null)}
                className="text-[#717970] hover:text-[#131b2e] font-bold"
              >
                ×
              </button>
            </div>
            <div className="font-mono text-[11px] text-[#131b2e]">
              <div>Lat: {selectedVertex.lat}</div>
              <div>Lng: {selectedVertex.lng}</div>
            </div>
            <span className="text-[10px] text-[#006d30] font-semibold block pt-0.5">
              ✓ Verified via DGPS Survey Drone
            </span>
          </div>
        )}

        {/* Hover Feature Tooltip */}
        {hoveredFeature && (
          <div className="absolute bottom-10 left-3 z-30 bg-[#131b2e]/90 text-white px-2.5 py-1.5 rounded-md text-xs font-mono shadow-md backdrop-blur-xs">
            {hoveredFeature === 'canal-buffer' && '⚠️ Khadakwasla Canal 30m Irrigation Buffer Strip'}
            {hoveredFeature === 'overlap' && '⚠️ 0.02 Ha DGPS Cadastral Boundary Overlap with 142/2'}
            {hoveredFeature.startsWith('target') && `Target: Survey ${currentParcel.surveyNo} • ${currentParcel.areaHa} Ha`}
            {hoveredFeature === '142/1' && 'Adjacent Parcel: Survey 142/1 • Agricultural Extent 0.90 Ha'}
            {hoveredFeature === '141' && 'Adjacent Parcel: Survey 141 • Privately Titled'}
            {hoveredFeature === '143' && 'Adjacent Parcel: Survey 143 • Gram Panchayat Cartway Access'}
            {hoveredFeature === '142/2' && 'Adjacent Parcel: Survey 142/2 • Bordering Mojani Stake'}
          </div>
        )}

        {/* Compass Rose (North Arrow) */}
        <div className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-[#ffffff]/90 backdrop-blur-xs shadow-xs border border-[#c0c9be]/40 flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold text-[#ba1a1a] leading-none">N</span>
          <span className="material-symbols-outlined text-[14px] text-[#003b1b] -mt-0.5">navigation</span>
        </div>

        {/* Bottom Coordinates HUD */}
        <div className="absolute bottom-2 right-2 z-20 bg-[#ffffff]/90 backdrop-blur-xs px-2.5 py-1 rounded text-[10px] font-mono text-[#404941] shadow-2xs border border-[#c0c9be]/40 flex items-center gap-2">
          <span>{cursorCoords.lat}</span>
          <span>{cursorCoords.lng}</span>
          <span className="text-[#003b1b] font-semibold">UTM 43N</span>
        </div>
      </div>

      {/* Map Legend */}
      {showLegend && (
        <div className="bg-[#ffffff] px-4 py-2.5 border-t border-[#c0c9be]/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#92f5a4] border border-[#006d30]"></span>
            <span className="text-[#131b2e] font-medium">Claimed Boundary</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#ba1a1a]"></span>
            <span className="text-[#131b2e] font-medium">Canal Buffer (30m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#ffb77d] border border-[#d97706]"></span>
            <span className="text-[#131b2e] font-medium">Overlap Warning (0.02 Ha)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-b-2 border-dashed border-sky-400 inline-block"></span>
            <span className="text-[#131b2e] font-medium">Cart Track (Right of Way)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-[#003b1b] inline-block"></span>
            <span className="text-[#131b2e] font-medium">DGPS GPS Stake</span>
          </div>
        </div>
      )}
    </div>
  );
};
