'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Map, Layers, RefreshCw, Eye } from 'lucide-react';
import { RegionData } from '../types';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-zinc-50 dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse flex flex-col items-center justify-center gap-3 text-zinc-500 font-mono text-xs">
      <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
      Initializing GIS Engine...
    </div>
  )
});

interface InteractiveMapProps {
  regions: RegionData[];
  selectedRegionId: string | null;
  onSelectRegion: (id: string) => void;
  userCoords: [number, number];
}

export default function InteractiveMap({
  regions,
  selectedRegionId,
  onSelectRegion,
  userCoords
}: InteractiveMapProps) {
  const [mapMode, setMapMode] = useState<'schematic' | 'geographic'>('schematic');
  const [activeLayer, setActiveLayer] = useState<'risk' | 'aqi' | 'traffic' | 'health'>('risk');

  const getRiskColor = (region: RegionData, layer: string): string => {
    let score = region.riskScore;
    if (layer === 'aqi') score = Math.min(100, (region.aqi / 150) * 100);
    else if (layer === 'traffic') score = region.trafficCongestion;
    else if (layer === 'health') score = region.healthcareDemand;

    if (score > 70) return 'fill-rose-500/20 stroke-rose-500 hover:fill-rose-500/35';
    if (score > 40) return 'fill-amber-500/20 stroke-amber-500 hover:fill-amber-500/35';
    return 'fill-emerald-500/20 stroke-emerald-500 hover:fill-emerald-500/35';
  };

  const getOverlayLabel = () => {
    switch (activeLayer) {
      case 'risk': return 'Risk Index';
      case 'aqi': return 'PM2.5 AQI';
      case 'traffic': return 'Congestion';
      case 'health': return 'Medical Load';
    }
  };

  const regResidential = regions.find(r => r.id === 'residential') || regions[0];
  const regIndustrial = regions.find(r => r.id === 'industrial') || regions[0];
  const regDowntown = regions.find(r => r.id === 'downtown') || regions[0];
  const regInnovation = regions.find(r => r.id === 'innovation') || regions[0];

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-5 flex flex-col h-full min-h-[420px] transition-colors">
      
      {/* Map Control Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-4 mb-4">
        <div>
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Map className="h-4.5 w-4.5 text-blue-500" />
            Live Operations Mapping
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Monitor regional hot spots and deploy emergency resources.</p>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
          {/* Layer Selector */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-w-[280px] xs:max-w-full scrollbar-none shrink-0">
            <div className="flex whitespace-nowrap min-w-max">
              {(['risk', 'aqi', 'traffic', 'health'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveLayer(l)}
                  className={`px-2.5 py-1.5 text-[10px] font-bold rounded-md capitalize transition-all shrink-0 min-h-[32px] ${
                    activeLayer === l
                      ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => setMapMode('schematic')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 min-h-[32px] ${
                mapMode === 'schematic'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Eye className="h-3 w-3" />
              Schematic
            </button>
            <button
              onClick={() => setMapMode('geographic')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 min-h-[32px] ${
                mapMode === 'geographic'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Layers className="h-3 w-3" />
              Geographic
            </button>
          </div>
        </div>
      </div>

      {/* Map Rendering Panel */}
      <div className="relative flex-grow rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-850 h-[320px] md:h-[350px]">
        {mapMode === 'geographic' ? (
          <LeafletMap
            regions={regions}
            selectedRegionId={selectedRegionId}
            onSelectRegion={onSelectRegion}
            activeLayer={activeLayer}
            userCoords={userCoords}
          />
        ) : (
          /* Custom Schematic Singapore Vector Map */
          <div className="relative w-full h-full bg-zinc-50 dark:bg-[#08080a] flex items-center justify-center p-4">
            {/* Legend Overlay */}
            <div className="absolute top-3 left-3 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-850 rounded-lg p-1.5 sm:p-2 shadow-sm text-[9px] sm:text-[10px] font-mono flex flex-col gap-0.5 sm:gap-1 z-10 max-w-[200px]">
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-[8px]">Overlay: {getOverlayLabel()}</span>
              {regions.map(r => {
                let scoreText = '';
                if (activeLayer === 'risk') scoreText = `Risk: ${r.riskScore}`;
                else if (activeLayer === 'aqi') scoreText = `AQI: ${r.aqi}`;
                else if (activeLayer === 'traffic') scoreText = `Congestion: ${r.trafficCongestion}%`;
                else if (activeLayer === 'health') scoreText = `Medical Load: ${r.healthcareDemand}%`;

                return (
                  <div key={r.id} className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      r.id === selectedRegionId ? 'bg-blue-500 ring-2 ring-blue-500/20' : 'bg-zinc-500'
                    }`} />
                    <span className={`${r.id === selectedRegionId ? 'text-blue-500 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {r.name.replace(/(Downtown|Industrial Zone|Residential Suburb|Marina Waterfront|Innovation Tech Park)/g, '').trim() || r.id.toUpperCase()}: {scoreText}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Schematic SVG Grid */}
            <svg 
              viewBox="0 0 500 280" 
              className="w-full max-w-[460px] h-auto drop-shadow-lg"
              strokeLinejoin="round" 
              strokeLinecap="round"
            >
              {/* RESIDENTIAL SUBURB (top/north) */}
              <path
                d="M 170 50 L 320 50 L 300 110 L 220 110 L 170 80 Z"
                className={`transition-all duration-300 cursor-pointer stroke-2 ${
                  selectedRegionId === 'residential' ? 'stroke-blue-500 fill-blue-500/10 stroke-3 scale-[1.01]' : 'stroke-zinc-400 dark:stroke-zinc-800'
                } ${getRiskColor(regResidential, activeLayer)}`}
                onClick={() => onSelectRegion('residential')}
              />
              <text x="245" y="80" className="fill-zinc-800 dark:fill-zinc-450 font-mono text-[8px] font-bold text-center pointer-events-none" textAnchor="middle">
                {regResidential.name.toUpperCase()}
              </text>

              {/* INDUSTRIAL (left/west) */}
              <path
                d="M 40 100 L 170 80 L 220 110 L 190 190 L 110 190 L 40 160 Z"
                className={`transition-all duration-300 cursor-pointer stroke-2 ${
                  selectedRegionId === 'industrial' ? 'stroke-blue-500 fill-blue-500/10 stroke-3 scale-[1.01]' : 'stroke-zinc-400 dark:stroke-zinc-800'
                } ${getRiskColor(regIndustrial, activeLayer)}`}
                onClick={() => onSelectRegion('industrial')}
              />
              <text x="120" y="140" className="fill-zinc-800 dark:fill-zinc-450 font-mono text-[8px] font-bold pointer-events-none" textAnchor="middle">
                {regIndustrial.name.toUpperCase()}
              </text>

              {/* DOWNTOWN (center/south) */}
              <path
                d="M 190 190 L 220 110 L 300 110 L 340 160 L 310 220 L 220 220 Z"
                className={`transition-all duration-300 cursor-pointer stroke-2 ${
                  selectedRegionId === 'downtown' ? 'stroke-blue-500 fill-blue-500/10 stroke-3 scale-[1.01]' : 'stroke-zinc-400 dark:stroke-zinc-800'
                } ${getRiskColor(regDowntown, activeLayer)}`}
                onClick={() => onSelectRegion('downtown')}
              />
              <text x="260" y="170" className="fill-zinc-800 dark:fill-zinc-450 font-mono text-[8px] font-bold pointer-events-none" textAnchor="middle">
                {regDowntown.name.toUpperCase()}
              </text>

              {/* TECH PARK / MARINA (right/east) */}
              <path
                d="M 320 50 L 440 90 L 460 140 L 380 180 L 340 160 L 300 110 Z"
                className={`transition-all duration-300 cursor-pointer stroke-2 ${
                  selectedRegionId === 'innovation' ? 'stroke-blue-500 fill-blue-500/10 stroke-3 scale-[1.01]' : 'stroke-zinc-400 dark:stroke-zinc-800'
                } ${getRiskColor(regInnovation, activeLayer)}`}
                onClick={() => onSelectRegion('innovation')}
              />
              <text x="375" y="125" className="fill-zinc-800 dark:fill-zinc-450 font-mono text-[8px] font-bold pointer-events-none" textAnchor="middle">
                {regInnovation.name.toUpperCase()}
              </text>

              {/* Dynamic status indicators */}
              {regions.map((region) => {
                let x = 0, y = 0;
                if (region.id === 'residential') { x = 245; y = 92; }
                else if (region.id === 'industrial') { x = 120; y = 152; }
                else if (region.id === 'downtown') { x = 260; y = 182; }
                else if (region.id === 'innovation') { x = 375; y = 137; }

                const isCrit = region.aqi > 100 || region.temperature > 34.0 || region.trafficCongestion > 70;
                
                return (
                  <g key={region.id} className="pointer-events-none">
                    {isCrit && (
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="6" 
                        className="fill-none stroke-rose-500 stroke-1 animate-ping" 
                      />
                    )}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="3.5" 
                      className={`${isCrit ? 'fill-rose-500' : 'fill-zinc-400 dark:fill-zinc-650'}`} 
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
