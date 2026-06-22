'use client';

import React, { useState, useEffect } from 'react';
import LandingPage from '../components/LandingPage';
import DashboardHeader from '../components/DashboardHeader';
import LocationBanner from '../components/LocationBanner';
import KpiGrid from '../components/KpiGrid';
import InteractiveMap from '../components/InteractiveMap';
import AnalyticsCharts from '../components/AnalyticsCharts';
import CopilotPanel from '../components/CopilotPanel';
import AlertsPanel from '../components/AlertsPanel';
import ReportGenerator from '../components/ReportGenerator';

import { locationService } from '../services/locationService';
import { getLocalizedData, getActiveAlerts, getStaticRecommendations, DEFAULT_LOCATION } from '../services/mockData';
import { RegionData, UserLocation, UserPersona } from '../types';
import { ClipboardList, Building, Heart, Info } from 'lucide-react';

export default function Home() {
  const [activeView, setActiveView] = useState<'landing' | 'dashboard'>('landing');
  const [persona, setPersona] = useState<UserPersona>('citizen');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('downtown');
  
  // Location States
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [regionsData, setRegionsData] = useState<RegionData[]>([]);

  // Resolve location on component mount
  useEffect(() => {
    const initLocation = async () => {
      setLocationLoading(true);
      setLocationError(null);
      try {
        // Automatically checks Cache -> GPS -> IP -> Fallback
        const resolved = await locationService.resolveLocation();
        setCurrentLocation(resolved);
        setRegionsData(getLocalizedData(resolved));
      } catch (err: any) {
        console.error('Initial location resolution failed, loading default:', err);
        setLocationError(err.message || 'Could not detect location. Using Singapore default.');
        // Fallback to default
        setCurrentLocation(DEFAULT_LOCATION);
        setRegionsData(getLocalizedData(DEFAULT_LOCATION));
      } finally {
        setLocationLoading(false);
      }
    };
    initLocation();
  }, []);

  const handleSearchCity = async (cityName: string): Promise<boolean> => {
    try {
      const location = await locationService.searchCity(cityName);
      setCurrentLocation(location);
      setRegionsData(getLocalizedData(location));
      setSelectedRegionId('downtown'); // Reset to downtown of new city
      return true;
    } catch (e) {
      console.error('City search failed:', e);
      return false;
    }
  };

  const handleTriggerGps = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const location = await locationService.detectBrowserLocation();
      setCurrentLocation(location);
      setRegionsData(getLocalizedData(location));
      setSelectedRegionId('downtown');
    } catch (e: any) {
      console.error('GPS trigger failed:', e);
      setLocationError(e.message || 'Location access denied.');
      throw e;
    } finally {
      setLocationLoading(false);
    }
  };

  if (regionsData.length === 0) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center font-mono text-xs text-zinc-500">
        Loading Local Telemetry...
      </div>
    );
  }

  const activeRegion = regionsData.find((r) => r.id === selectedRegionId) || regionsData[0];
  const activeAlerts = getActiveAlerts(regionsData);
  const recommendations = getStaticRecommendations(selectedRegionId, regionsData);

  const handleEnterDashboard = (selectedPersona: UserPersona) => {
    setPersona(selectedPersona);
    setActiveView('dashboard');
  };

  const handleExitDashboard = () => {
    locationService.clearCachedLocation();
    // Re-resolve location
    locationService.resolveLocation(true).then((loc) => {
      setCurrentLocation(loc);
      setRegionsData(getLocalizedData(loc));
    }).catch(() => {
      setCurrentLocation(DEFAULT_LOCATION);
      setRegionsData(getLocalizedData(DEFAULT_LOCATION));
    });
    setActiveView('landing');
  };

  const handleExecuteAction = (regionId: string, actionTitle: string) => {
    const activeCity = currentLocation?.city || 'Local';
    setRegionsData((prevData) =>
      prevData.map((region) => {
        if (region.id !== regionId) return region;

        const updatedResources = [...region.resourcesDeployed];
        let newAqi = region.aqi;
        let newTemp = region.temperature;
        let newTraffic = region.trafficCongestion;
        let newHealth = region.healthcareDemand;

        const actionLower = actionTitle.toLowerCase();
        
        if (actionLower.includes('air purification')) {
          updatedResources.push({
            id: `deployed-aqi-${Date.now()}`,
            name: `${activeRegion.name.split(' ')[0]} Air Scrubber Grid`,
            type: 'air-purifier',
            status: 'active',
            location: `${activeCity} Industrial Sector`,
            quantity: 3
          });
          newAqi = Math.round(newAqi * 0.55);
          newHealth = Math.round(newHealth * 0.75);
        } else if (actionLower.includes('heat shelter') || actionLower.includes('cooling')) {
          updatedResources.push({
            id: `deployed-heat-${Date.now()}`,
            name: `${activeRegion.name.split(' ')[0]} Cooling Oasis`,
            type: 'cooling-center',
            status: 'active',
            location: `${activeCity} Residential Suburb`,
            quantity: 2
          });
          newTemp = Number((newTemp - 1.8).toFixed(1));
          newHealth = Math.round(newHealth * 0.70);
        } else if (actionLower.includes('traffic') || actionLower.includes('rerouting')) {
          updatedResources.push({
            id: `deployed-traffic-${Date.now()}`,
            name: `${activeRegion.name.split(' ')[0]} Traffic Patrol`,
            type: 'traffic-patrol',
            status: 'active',
            location: `${activeCity} Transit Corridor`,
            quantity: 3
          });
          newTraffic = Math.round(newTraffic * 0.50);
        } else {
          updatedResources.push({
            id: `deployed-gen-${Date.now()}`,
            name: `Emergency Response Squad`,
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

  const activeLocationObj = currentLocation || DEFAULT_LOCATION;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] transition-colors flex flex-col justify-between">
      <div>
        <DashboardHeader
          currentPersona={persona}
          onChangePersona={setPersona}
          activeAlertsCount={activeAlerts.length}
          onExit={handleExitDashboard}
          location={activeLocationObj}
        />

        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
          {/* Location Search / Status Banner */}
          <LocationBanner
            currentLocation={currentLocation}
            loading={locationLoading}
            error={locationError}
            onSearchCity={handleSearchCity}
            onTriggerGps={handleTriggerGps}
          />

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
                  Operations Panel: {activeRegion.name}
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
                  {reg.name.replace(currentLocation?.city || 'Local', '').trim()}
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
              
              <InteractiveMap
                regions={regionsData}
                selectedRegionId={selectedRegionId}
                onSelectRegion={setSelectedRegionId}
                userCoords={[activeLocationObj.latitude, activeLocationObj.longitude]}
              />

              <AnalyticsCharts region={activeRegion} />
              
            </div>

            {/* Column 3: AI Assistant (PulseCopilot) */}
            <div className="xl:col-span-1">
              <CopilotPanel
                activeRegion={activeRegion}
                persona={persona}
                userLocation={activeLocationObj}
              />
            </div>

          </div>

          {/* Alerts and Recommendations */}
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
            location={activeLocationObj}
          />

          {/* Deployed Active Resources Inventory */}
          {(persona === 'admin' || persona === 'ngo') && (
            <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm transition-colors">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-4">
                <ClipboardList className="h-4.5 w-4.5 text-blue-500" />
                Active Deployed Assets &amp; Resources
              </h3>
              
              {activeRegion.resourcesDeployed.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {activeRegion.resourcesDeployed.map((res) => (
                    <div key={res.id} className="border border-zinc-200 dark:border-zinc-850 p-3 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-bold text-zinc-950 dark:text-zinc-150">{res.name}</h4>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 capitalize">Type: {res.type.replace('-', ' ')}</p>
                        <p className="text-[10px] text-zinc-505 mt-0.5 font-mono">Location: {res.location}</p>
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
              ) : (
                <div className="text-center py-6 text-zinc-500 text-xs font-mono">No active assets deployed in this sector.</div>
              )}
            </div>
          )}

        </main>
      </div>

      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 py-5 text-center text-xs text-zinc-500 font-mono flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 gap-3">
        <span>© 2026 CommunityPulse AI. APAC Gen AI Challenge.</span>
        <span>Secure Geolocation API // Local RAG Active</span>
      </footer>
    </div>
  );
}
