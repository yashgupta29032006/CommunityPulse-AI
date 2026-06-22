'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RegionData, RiskLevel } from '../types';

// Leaflet CSS imports are handled in globals.css
interface LeafletMapProps {
  regions: RegionData[];
  selectedRegionId: string | null;
  onSelectRegion: (id: string) => void;
  activeLayer: 'risk' | 'aqi' | 'traffic' | 'health';
}

// Controller to fly to selected region
function MapController({ selectedCoords }: { selectedCoords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedCoords) {
      map.setView(selectedCoords, 12, { animate: true, duration: 1.5 });
    }
  }, [selectedCoords, map]);
  return null;
}

export default function LeafletMap({
  regions,
  selectedRegionId,
  onSelectRegion,
  activeLayer
}: LeafletMapProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    setMounted(true);
    // Determine initial theme
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    // Watch for theme mutations
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const dark = document.documentElement.classList.contains('dark');
          setTheme(dark ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  if (!mounted) {
    return (
      <div className="h-full w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse flex items-center justify-center text-xs font-mono text-zinc-500">
        Loading GIS Coordinates...
      </div>
    );
  }

  // CartoDB Tile Layer matching theme
  const tileUrl = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  const selectedRegion = regions.find(r => r.id === selectedRegionId);
  const selectedCoords = selectedRegion ? selectedRegion.coordinates : null;

  // Layer coloring configuration
  const getMarkerColor = (region: RegionData, layer: string): string => {
    if (layer === 'risk') {
      if (region.riskLevel === 'high') return '#ef4444'; // red
      if (region.riskLevel === 'medium') return '#f97316'; // orange
      return '#10b981'; // emerald
    }
    if (layer === 'aqi') {
      if (region.aqi > 100) return '#ef4444';
      if (region.aqi > 50) return '#f59e0b';
      return '#10b981';
    }
    if (layer === 'traffic') {
      if (region.trafficCongestion > 70) return '#ef4444';
      if (region.trafficCongestion > 40) return '#f59e0b';
      return '#10b981';
    }
    if (layer === 'health') {
      if (region.healthcareDemand > 75) return '#ef4444';
      if (region.healthcareDemand > 50) return '#f59e0b';
      return '#10b981';
    }
    return '#3b82f6';
  };

  const getOverlayRadius = (region: RegionData, layer: string): number => {
    if (layer === 'aqi') {
      return region.aqi * 15; // in meters
    }
    if (layer === 'traffic') {
      return region.trafficCongestion * 15;
    }
    if (layer === 'health') {
      return region.healthcareDemand * 15;
    }
    return region.riskScore * 15;
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={[1.3521, 103.8198]} 
        zoom={11.5} 
        scrollWheelZoom={true} 
        className="h-full w-full rounded-xl"
        zoomControl={false}
      >
        <TileLayer
          attribution={attribution}
          url={tileUrl}
        />
        
        {regions.map((region) => {
          const color = getMarkerColor(region, activeLayer);
          const isSelected = region.id === selectedRegionId;
          const overlayRad = getOverlayRadius(region, activeLayer);

          return (
            <React.Fragment key={region.id}>
              {/* Semi-transparent Hotspot Heat Circle */}
              <Circle
                center={region.coordinates}
                radius={overlayRad}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.15,
                  color: color,
                  weight: 1,
                  dashArray: '4, 4'
                }}
              />

              {/* Central Marker */}
              <CircleMarker
                center={region.coordinates}
                radius={isSelected ? 14 : 9}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.85,
                  color: isSelected ? '#ffffff' : color,
                  weight: isSelected ? 3 : 1
                }}
                eventHandlers={{
                  click: () => onSelectRegion(region.id)
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[140px] text-zinc-900 dark:text-zinc-100 font-sans">
                    <h4 className="font-bold text-sm text-zinc-950">{region.name}</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{region.description}</p>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] border-t border-zinc-200 pt-1.5 font-mono">
                      <div>AQI: <span className="font-bold">{region.aqi}</span></div>
                      <div>Temp: <span className="font-bold">{region.temperature}°C</span></div>
                      <div>Traffic: <span className="font-bold">{region.trafficCongestion}%</span></div>
                      <div>Risk: <span className="font-bold capitalize">{region.riskLevel}</span></div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        <MapController selectedCoords={selectedCoords} />
      </MapContainer>

      {/* Layer key overlay */}
      <div className="absolute bottom-4 left-4 z-[500] bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 shadow-md text-[10px] font-mono flex flex-col gap-1.5">
        <div className="font-bold text-[9px] uppercase tracking-wider text-zinc-500">Active Overlay: {activeLayer.toUpperCase()}</div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Optimal / Low Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>Moderate / Warning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span>Elevated / Critical</span>
        </div>
      </div>
    </div>
  );
}
