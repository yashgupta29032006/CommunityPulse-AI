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
}

export default function InteractiveMap({
  regions,
  selectedRegionId,
  onSelectRegion
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

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-5 flex flex-col h-full min-h-[420px] transition-colors">
      {/* Map Control Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-4 mb-4">
        <div>
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Map className="h-4.5 w-4.5 text-blue-500" />
            Live Geographic Operations
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Monitor regional hot spots and deploy emergency resources.</p>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Layer Selector */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {(['risk', 'aqi', 'traffic', 'health'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setActiveLayer(l)}
                className={`px-2 py-1 text-[10px] font-bold rounded-md capitalize transition-all ${
                  activeLayer === l
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Mode Selector */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setMapMode('schematic')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
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
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
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
          />
        ) : (
          /* Custom Schematic Singapore Vector Map */
          <div className="relative w-full h-full bg-zinc-50 dark:bg-[#08080a] flex items-center justify-center p-4">
            {/* Legend Overlay */}
            <div className="absolute top-3 left-3 bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-850 rounded-lg p-2 shadow-sm text-[10px] font-mono flex flex-col gap-1">
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
                      {r.name.split(' ')[0]}: {scoreText}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Singapore Schematic SVG Grid */}
            <svg 
              viewBox="0 0 500 280" 
              className="w-full max-w-[460px] h-auto drop-shadow-lg"
              strokeLinejoin="round" 
              strokeLinecap="round"
            >
              {/* WOODLANDS (NORTH) */}
              <path
                d="M 170 50 L 320 50 L 300 110 L 220 110 L 170 80 Z"
                className={`transition-all duration-300 cursor-pointer stroke-2 ${
                  selectedRegionId === 'woodlands' ? 'stroke-blue-500 fill-blue-500/10 stroke-3 scale-[1.01]' : 'stroke-zinc-400 dark:stroke-zinc-800'
                } ${getRiskColor(regions.find(r => r.id === 'woodlands')!, activeLayer)}`}
                onClick={() => onSelectRegion('woodlands')}
              />
              <text x="245" y="80" className="fill-zinc-800 dark:fill-zinc-400 font-mono text-[9px] font-bold text-center pointer-events-none" textAnchor="middle">
                WOODLANDS
              </text>

              {/* JURONG (WEST) */}
              <path
                d="M 40 100 L 170 80 L 220 110 L 190 190 L 110 190 L 40 160 Z"
                className={`transition-all duration-300 cursor-pointer stroke-2 ${
                  selectedRegionId === 'jurong' ? 'stroke-blue-500 fill-blue-500/10 stroke-3 scale-[1.01]' : 'stroke-zinc-400 dark:stroke-zinc-800'
                } ${getRiskColor(regions.find(r => r.id === 'jurong')!, activeLayer)}`}
                onClick={() => onSelectRegion('jurong')}
              />
              <text x="120" y="140" className="fill-zinc-800 dark:fill-zinc-400 font-mono text-[9px] font-bold pointer-events-none" textAnchor="middle">
                JURONG INDUSTRIAL
              </text>

              {/* CENTRAL (SOUTH) */}
              <path
                d="M 190 190 L 220 110 L 300 110 L 340 160 L 310 220 L 220 220 Z"
                className={`transition-all duration-300 cursor-pointer stroke-2 ${
                  selectedRegionId === 'central' ? 'stroke-blue-500 fill-blue-500/10 stroke-3 scale-[1.01]' : 'stroke-zinc-400 dark:stroke-zinc-800'
                } ${getRiskColor(regions.find(r => r.id === 'central')!, activeLayer)}`}
                onClick={() => onSelectRegion('central')}
              />
              <text x="260" y="170" className="fill-zinc-800 dark:fill-zinc-400 font-mono text-[9px] font-bold pointer-events-none" textAnchor="middle">
                CENTRAL AREA
              </text>

              {/* CHANGI (EAST) */}
              <path
                d="M 320 50 L 440 90 L 460 140 L 380 180 L 340 160 L 300 110 Z"
                className={`transition-all duration-300 cursor-pointer stroke-2 ${
                  selectedRegionId === 'changi' ? 'stroke-blue-500 fill-blue-500/10 stroke-3 scale-[1.01]' : 'stroke-zinc-400 dark:stroke-zinc-800'
                } ${getRiskColor(regions.find(r => r.id === 'changi')!, activeLayer)}`}
                onClick={() => onSelectRegion('changi')}
              />
              <text x="375" y="125" className="fill-zinc-800 dark:fill-zinc-400 font-mono text-[9px] font-bold pointer-events-none" textAnchor="middle">
                CHANGI
              </text>

              {/* Dynamic status indicators */}
              {regions.map((region) => {
                let x = 0, y = 0;
                if (region.id === 'woodlands') { x = 245; y = 92; }
                else if (region.id === 'jurong') { x = 120; y = 152; }
                else if (region.id === 'central') { x = 260; y = 182; }
                else if (region.id === 'changi') { x = 375; y = 137; }

                const isCrit = region.aqi > 130 || region.temperature > 34.5 || region.trafficCongestion > 80;
                
                return (
                  <g key={region.id} className="pointer-events-none">
                    {/* Ring for alerts */}
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
                      className={`${isCrit ? 'fill-rose-500' : 'fill-zinc-400 dark:fill-zinc-600'}`} 
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
