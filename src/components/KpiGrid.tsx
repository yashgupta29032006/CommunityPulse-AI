import React from 'react';
import { Wind, Thermometer, Car, Activity, ShieldAlert, Heart, Calendar, Wrench } from 'lucide-react';
import { RegionData, UserPersona } from '../types';

interface KpiGridProps {
  region: RegionData;
  persona: UserPersona;
  activeAlertsCount: number;
}

export default function KpiGrid({ region, persona, activeAlertsCount }: KpiGridProps) {
  // Helpers to get health status colors
  const getAqiStatus = (aqi: number) => {
    if (aqi > 100) return { label: 'Unhealthy', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' };
    if (aqi > 50) return { label: 'Moderate', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    return { label: 'Optimal', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  };

  const getTempStatus = (temp: number) => {
    if (temp > 34.0) return { label: 'Extreme Heat', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' };
    if (temp > 32.0) return { label: 'Elevated', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    return { label: 'Normal', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  };

  const getTrafficStatus = (traffic: number) => {
    if (traffic > 70) return { label: 'Gridlock', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' };
    if (traffic > 40) return { label: 'Moderate', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    return { label: 'Fluid', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  };

  const getHealthStatus = (health: number) => {
    if (health > 75) return { label: 'Saturated', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' };
    if (health > 50) return { label: 'Active', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    return { label: 'Stable', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  };

  const aqiInfo = getAqiStatus(region.aqi);
  const tempInfo = getTempStatus(region.temperature);
  const trafficInfo = getTrafficStatus(region.trafficCongestion);
  const healthInfo = getHealthStatus(region.healthcareDemand);

  // Dynamic values depending on persona
  const activeResourcesCount = region.resourcesDeployed.reduce((sum, res) => sum + res.quantity, 0);

  const renderSourceIndicator = (type?: 'live' | 'cached' | 'simulated', provider?: string) => {
    let dotColor = 'bg-blue-500'; // simulated
    let tooltip = 'Simulated baseline telemetry.';
    if (type === 'live') {
      dotColor = 'bg-emerald-500';
      tooltip = `Live Feed: ${provider || 'Open-Meteo API'}`;
    } else if (type === 'cached') {
      dotColor = 'bg-amber-500';
      tooltip = `Cached Feed: ${provider || 'Local Storage'}`;
    }

    return (
      <span 
        className="flex items-center gap-1.5 cursor-help"
        title={tooltip}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        <span className="text-[8px] text-zinc-400 dark:text-zinc-550 font-mono uppercase tracking-widest">{type || 'simulated'}</span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      
      {/* CARD 1: Air Quality */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Air Quality</span>
            {renderSourceIndicator(region.dataSourceType, region.dataProvider)}
          </div>
          <Wind className="h-5 w-5 text-sky-500 flex-shrink-0" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 font-mono">{region.aqi}</span>
            <span className="text-xs text-zinc-400 font-mono">PM2.5 AQI</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${aqiInfo.color}`}>
              {aqiInfo.label}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Zone: {region.id.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* CARD 2: Temperature / Heat Index */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Temperature</span>
            {renderSourceIndicator(region.dataSourceType, region.dataProvider)}
          </div>
          <Thermometer className="h-5 w-5 text-orange-500 flex-shrink-0" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 font-mono">{region.temperature.toFixed(1)}°C</span>
            <span className="text-xs text-zinc-400 font-mono">RH {region.humidity}%</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${tempInfo.color}`}>
              {tempInfo.label}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Heat Risk</span>
          </div>
        </div>
      </div>

      {/* CARD 3: Traffic Congestion */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Traffic Congestion</span>
            {renderSourceIndicator('simulated', 'Simulated Loop Sensors')}
          </div>
          <Car className="h-5 w-5 text-indigo-500 flex-shrink-0" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 font-mono">{region.trafficCongestion}%</span>
            <span className="text-xs text-zinc-400 font-mono">utilization</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${trafficInfo.color}`}>
              {trafficInfo.label}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Transit Flow</span>
          </div>
        </div>
      </div>

      {/* CARD 4: Persona-Specific Metric Card */}
      {persona === 'citizen' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Healthcare Load</span>
              {renderSourceIndicator('simulated', 'Simulated Clinic Telemetry')}
            </div>
            <Activity className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 font-mono">{region.healthcareDemand}%</span>
              <span className="text-xs text-zinc-400 font-mono">clinic usage</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${healthInfo.color}`}>
                {healthInfo.label}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Health Demand</span>
            </div>
          </div>
        </div>
      )}

      {persona === 'ngo' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-colors border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              Community Vulnerability
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">NGO View</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 font-mono">
                {region.id === 'residential' ? 82 : region.id === 'industrial' ? 68 : region.id === 'downtown' ? 52 : 38}
              </span>
              <span className="text-xs text-zinc-400 font-mono">/ 100 max</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                region.id === 'residential' || region.id === 'industrial'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              }`}>
                {region.id === 'residential' ? 'Critical (Elderly Surge)' : region.id === 'industrial' ? 'Elevated (Pollution Risk)' : 'Stable'}
              </span>
            </div>
          </div>
        </div>
      )}

      {persona === 'admin' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-colors border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Wrench className="h-3.5 w-3.5" />
              Resources Deployed
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Admin View</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 font-mono">
                {activeResourcesCount}
              </span>
              <span className="text-xs text-zinc-400 font-mono">units active</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                Budget Allocated: 78%
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
