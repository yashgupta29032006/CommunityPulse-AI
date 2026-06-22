'use client';

import React, { useState, useEffect } from 'react';
import LandingPage from '../components/LandingPage';
import DashboardHeader from '../components/DashboardHeader';
import KpiGrid from '../components/KpiGrid';
import InteractiveMap from '../components/InteractiveMap';
import AnalyticsCharts from '../components/AnalyticsCharts';
import CopilotPanel from '../components/CopilotPanel';
import AlertsPanel from '../components/AlertsPanel';
import ReportGenerator from '../components/ReportGenerator';

import { getSingaporeData, getActiveAlerts, getStaticRecommendations } from '../services/mockData';
import { RegionData, Alert, Recommendation, UserPersona, Resource } from '../types';
import { Check, ClipboardList, ShieldAlert, Heart, Building, Info } from 'lucide-react';

export default function Home() {
  const [activeView, setActiveView] = useState<'landing' | 'dashboard'>('landing');
  const [persona, setPersona] = useState<UserPersona>('citizen');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('central');
  const [regionsData, setRegionsData] = useState<RegionData[]>([]);

  // Initialize data on mount
  useEffect(() => {
    setRegionsData(getSingaporeData());
  }, []);

  if (regionsData.length === 0) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center font-mono text-xs text-zinc-500">
        Loading System Telemetry...
      </div>
    );
  }

  // Active region data
  const activeRegion = regionsData.find((r) => r.id === selectedRegionId) || regionsData[0];

  // Dynamic alerts list
  const activeAlerts = getActiveAlerts(regionsData);

  // Recommendations for the selected region
  const recommendations = getStaticRecommendations(selectedRegionId, regionsData);

  const handleEnterDashboard = (selectedPersona: UserPersona) => {
    setPersona(selectedPersona);
    setActiveView('dashboard');
  };

  const handleExitDashboard = () => {
    // Reset data
    setRegionsData(getSingaporeData());
    setActiveView('landing');
  };

  // Closed-loop simulation: executing an action affects the data and updates the dashboard
  const handleExecuteAction = (regionId: string, actionTitle: string) => {
    setRegionsData((prevData) =>
      prevData.map((region) => {
        if (region.id !== regionId) return region;

        // Clone current resources
        const updatedResources = [...region.resourcesDeployed];
        let newAqi = region.aqi;
        let newTemp = region.temperature;
        let newTraffic = region.trafficCongestion;
        let newHealth = region.healthcareDemand;

        const actionLower = actionTitle.toLowerCase();
        
        if (actionLower.includes('air purification')) {
          // Add Air purification asset
          updatedResources.push({
            id: `deployed-aqi-${Date.now()}`,
            name: 'EcoSensing Air Scrubber Grid X3',
            type: 'air-purifier',
            status: 'active',
            location: 'Boon Lay HDB Clusters',
            quantity: 3
          });
          // Drop AQI significantly
          newAqi = Math.round(newAqi * 0.55); // 45% reduction
          newHealth = Math.round(newHealth * 0.75); // 25% drop in clinic pressure
        } else if (actionLower.includes('heat shelter') || actionLower.includes('cooling')) {
          // Add Cooling shelter asset
          updatedResources.push({
            id: `deployed-heat-${Date.now()}`,
            name: 'Woodlands Community CC Cooling Oasis',
            type: 'cooling-center',
            status: 'active',
            location: 'Woodlands Civic Plaza',
            quantity: 2
          });
          // Drop temperature/comfort risk
          newTemp = Number((newTemp - 1.8).toFixed(1));
          newHealth = Math.round(newHealth * 0.70); // 30% drop in heat exhaustion cases
        } else if (actionLower.includes('traffic') || actionLower.includes('rerouting')) {
          // Add Traffic Patrol units
          updatedResources.push({
            id: `deployed-traffic-${Date.now()}`,
            name: 'Auxiliary Patrol Team Delta',
            type: 'traffic-patrol',
            status: 'active',
            location: 'Shenton Way Intersections',
            quantity: 3
          });
          // Drop traffic congestion
          newTraffic = Math.round(newTraffic * 0.50); // 50% drop
        } else {
          // General deployment
          updatedResources.push({
            id: `deployed-gen-${Date.now()}`,
            name: 'Emergency Support Unit',
            type: 'public-transit',
            status: 'active',
            location: 'Regional Hub',
            quantity: 1
          });
        }

        // Recalculate Risk Score
        const aqiWeight = Math.min(100, (newAqi / 150) * 100) * 0.35;
        const tempWeight = Math.min(100, (Math.max(0, newTemp - 26) / 10) * 100) * 0.25;
        const healthWeight = newHealth * 0.25;
        const trafficWeight = newTraffic * 0.15;
        const riskScore = Math.round(aqiWeight + tempWeight + healthWeight + trafficWeight);

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (riskScore > 70) riskLevel = 'high';
        else if (riskScore > 40) riskLevel = 'medium';

        return {
          ...region,
          aqi: newAqi,
          temperature: newTemp,
          trafficCongestion: newTraffic,
          healthcareDemand: newHealth,
          riskScore,
          riskLevel,
          resourcesDeployed: updatedResources
        };
      })
    );
  };

  if (activeView === 'landing') {
    return <LandingPage onEnter={handleEnterDashboard} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] transition-colors flex flex-col justify-between">
      <div>
        <DashboardHeader
          currentPersona={persona}
          onChangePersona={setPersona}
          activeAlertsCount={activeAlerts.length}
          onExit={handleExitDashboard}
        />

        <main className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col gap-6">
          {/* Persona Header Info Banner */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition-colors">
            <div className="flex items-center gap-3">
              {persona === 'admin' && (
                <div className="p-2 bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5" />
                </div>
              )}
              {persona === 'ngo' && (
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5" />
                </div>
              )}
              {persona === 'citizen' && (
                <div className="p-2 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                  <Info className="h-5 w-5" />
                </div>
              )}
              <div>
                <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 capitalize">
                  Singapore Operations Panel: {activeRegion.name}
                </h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {persona === 'admin' 
                    ? 'Command operations: adjust signal timing, activate cooling centers, and dispatch air scrubbing fleets.'
                    : persona === 'ngo'
                    ? 'Resource auditing: view local vulnerability indexes, download situation briefs, and trace heat-risk indices.'
                    : 'Community portal: explore local AQI indexes, weather forecasts, and chat with PulseCopilot.'
                  }
                </p>
              </div>
            </div>

            {/* Quick region selection pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {regionsData.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setSelectedRegionId(reg.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedRegionId === reg.id
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {reg.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Statistics Row */}
          <KpiGrid
            region={activeRegion}
            persona={persona}
            activeAlertsCount={activeAlerts.length}
          />

          {/* Primary Layout Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Column 1 & 2: Map and Analytics */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              
              {/* Interactive map */}
              <InteractiveMap
                regions={regionsData}
                selectedRegionId={selectedRegionId}
                onSelectRegion={setSelectedRegionId}
              />

              {/* Historical Trend Charts */}
              <AnalyticsCharts region={activeRegion} />
              
            </div>

            {/* Column 3: AI Assistant (PulseCopilot) */}
            <div className="xl:col-span-1">
              <CopilotPanel
                activeRegion={activeRegion}
                persona={persona}
              />
            </div>

          </div>

          {/* Bottom Row: Active Alerts and Recommendations */}
          <AlertsPanel
            alerts={activeAlerts}
            recommendations={recommendations}
            persona={persona}
            onExecuteAction={handleExecuteAction}
          />

          {/* Situation Report Generator */}
          <ReportGenerator
            regions={regionsData}
            alerts={activeAlerts}
            recommendations={recommendations}
          />

          {/* Deployed Active Resources Inventory (Admin/NGO only) */}
          {(persona === 'admin' || persona === 'ngo') && (
            <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm transition-colors">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-4">
                <ClipboardList className="h-4.5 w-4.5 text-blue-500" />
                Active Deployed Assets &amp; Resources
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeRegion.resourcesDeployed.map((res) => (
                  <div key={res.id} className="border border-zinc-200 dark:border-zinc-850 p-3 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-zinc-950 dark:text-zinc-150">{res.name}</h4>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 capitalize">Type: {res.type.replace('-', ' ')}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">Location: {res.location}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-blue-950/40 text-blue-400 px-1.5 py-0.5 rounded text-[9px] border border-blue-900/30 font-bold font-mono">
                        QTY: {res.quantity}
                      </span>
                      <span className="block text-[8px] text-emerald-400 font-bold uppercase mt-1 font-mono">
                        {res.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 py-5 text-center text-xs text-zinc-500 font-mono flex flex-col sm:flex-row justify-between items-center px-6 gap-3">
        <span>© 2026 CommunityPulse AI. APAC Gen AI Challenge.</span>
        <span>Secure Sandboxed Environment // Grounding Mode Enabled</span>
      </footer>
    </div>
  );
}
