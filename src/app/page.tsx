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
import ScenarioSimulator from '../components/ScenarioSimulator';
import IntroExperience from '../components/IntroExperience';

import { locationService } from '../services/locationService';
import { getLocalizedData, getActiveAlerts, getStaticRecommendations, DEFAULT_LOCATION } from '../services/mockData';
import { dataProviderService, TelemetryFeed } from '../services/dataProvider';
import { RegionData, UserLocation, UserPersona } from '../types';
import { ClipboardList, Building, Heart, Info } from 'lucide-react';

export default function Home() {
  const [activeView, setActiveView] = useState<'landing' | 'dashboard'>('landing');
  const [persona, setPersona] = useState<UserPersona>('citizen');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('downtown');
  const [showIntro, setShowIntro] = useState(false);

  // Check first visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const introSeen = localStorage.getItem('communitypulse_intro_seen');
      if (!introSeen) {
        setShowIntro(true);
      }
    }
  }, []);
  
  // Location & Telemetry States
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [regionsData, setRegionsData] = useState<RegionData[]>([]);

  // Telemetry Sync States
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(300); // 5 minutes by default
  const [pendingRegionsData, setPendingRegionsData] = useState<RegionData[]>([]);
  const [hasUpdates, setHasUpdates] = useState(false);

  const fetchTelemetry = async (location: UserLocation, forceApply: boolean = false) => {
    setRefreshing(true);
    try {
      const lat = location.latitude;
      const lng = location.longitude;

      const regionsToFetch = [
        { id: 'downtown', lat: lat, lng: lng },
        { id: 'industrial', lat: lat + 0.012, lng: lng - 0.018 },
        { id: 'residential', lat: lat - 0.015, lng: lng + 0.012 },
        { id: 'innovation', lat: lat + 0.018, lng: lng + 0.020 }
      ];

      // Fetch in parallel
      const results = await Promise.allSettled(
        regionsToFetch.map(r => dataProviderService.getTelemetryForCoords(r.lat, r.lng))
      );

      const feeds: Record<string, TelemetryFeed> = {};
      regionsToFetch.forEach((r, idx) => {
        const res = results[idx];
        if (res.status === 'fulfilled') {
          feeds[r.id] = res.value;
        } else {
          feeds[r.id] = {
            temperature: null,
            humidity: null,
            windSpeed: null,
            uvIndex: null,
            aqi: null,
            dataSourceType: 'simulated',
            dataProvider: 'Simulated Fallback',
            dataLastUpdated: new Date().toISOString()
          };
        }
      });

      const freshData = getLocalizedData(location, feeds);

      if (forceApply || regionsData.length === 0) {
        setRegionsData(freshData);
        setLastUpdated(new Date());
        setHasUpdates(false);
        setPendingRegionsData([]);
      } else {
        // Background refresh: Check if there's any actual difference in telemetry metrics to notify user
        let hasChanges = false;
        for (let i = 0; i < freshData.length; i++) {
          const current = regionsData.find(r => r.id === freshData[i].id);
          if (current && (current.aqi !== freshData[i].aqi || current.temperature !== freshData[i].temperature || current.dataSourceType !== freshData[i].dataSourceType)) {
            hasChanges = true;
            break;
          }
        }

        if (hasChanges) {
          setPendingRegionsData(freshData);
          setHasUpdates(true);
        } else {
          // If no significant change, we just update the last sync time to show users the system is polling
          setLastUpdated(new Date());
        }
      }
    } catch (e) {
      console.error('Failed to fetch live telemetry:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const applyPendingUpdates = () => {
    if (pendingRegionsData.length > 0) {
      setRegionsData(pendingRegionsData);
      setLastUpdated(new Date());
      setHasUpdates(false);
      setPendingRegionsData([]);
    }
  };

  // Resolve location on component mount
  useEffect(() => {
    const initLocation = async () => {
      setLocationLoading(true);
      setLocationError(null);
      try {
        // Automatically checks Cache -> GPS -> IP -> Fallback
        const resolved = await locationService.resolveLocation();
        setCurrentLocation(resolved);
        await fetchTelemetry(resolved, true); // initial load
      } catch (err: any) {
        console.error('Initial location resolution failed, loading default:', err);
        setLocationError(err.message || 'Could not detect location. Using default.');
        // Fallback to default
        setCurrentLocation(DEFAULT_LOCATION);
        await fetchTelemetry(DEFAULT_LOCATION, true);
      } finally {
        setLocationLoading(false);
      }
    };
    initLocation();
  }, []);

  // Background Auto-Refresh Timer
  useEffect(() => {
    if (refreshInterval <= 0 || !currentLocation || activeView !== 'dashboard') return;

    const intervalId = setInterval(() => {
      fetchTelemetry(currentLocation, false); // background update
    }, refreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [currentLocation, refreshInterval, activeView, regionsData]);

  const handleSearchCity = async (cityName: string): Promise<boolean> => {
    try {
      const location = await locationService.searchCity(cityName);
      setCurrentLocation(location);
      await fetchTelemetry(location, true); // Force apply on search
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
      await fetchTelemetry(location, true); // Force apply on GPS trigger
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
    locationService.resolveLocation(true).then(async (loc) => {
      setCurrentLocation(loc);
      await fetchTelemetry(loc, true);
    }).catch(async () => {
      setCurrentLocation(DEFAULT_LOCATION);
      await fetchTelemetry(DEFAULT_LOCATION, true);
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
      {showIntro && <IntroExperience onClose={() => setShowIntro(false)} />}
      <div>
        <DashboardHeader
          currentPersona={persona}
          onChangePersona={setPersona}
          activeAlertsCount={activeAlerts.length}
          onExit={handleExitDashboard}
          location={activeLocationObj}
          lastUpdated={lastUpdated}
          refreshing={refreshing}
          onRefresh={() => fetchTelemetry(activeLocationObj, true)}
          refreshInterval={refreshInterval}
          onChangeRefreshInterval={setRefreshInterval}
          systemStatus={
            regionsData.some(r => r.dataSourceType === 'live')
              ? 'live'
              : regionsData.some(r => r.dataSourceType === 'cached')
              ? 'cached'
              : 'simulated'
          }
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

          {/* Telemetry Background Updates Available Banner */}
          {hasUpdates && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 text-blue-850 dark:text-blue-400 p-3 rounded-lg flex items-center justify-between gap-4 text-xs shadow-sm transition-all animate-pulse">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping" />
                <span>New live telemetry updates are available for <strong>{activeLocationObj.city}</strong>.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={applyPendingUpdates}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors"
                >
                  Apply Updates
                </button>
                <button
                  onClick={() => setHasUpdates(false)}
                  className="px-2.5 py-1.5 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded font-semibold text-zinc-500 dark:text-zinc-400 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

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
                regionsData={regionsData}
              />
            </div>

          </div>

          {/* Scenario Simulator Card */}
          <ScenarioSimulator
            currentLocation={activeLocationObj}
            currentRegion={activeRegion}
          />

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
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button 
            onClick={() => setShowIntro(true)} 
            className="hover:text-blue-500 underline transition-colors"
          >
            Watch Intro Again
          </button>
          <span className="text-zinc-700">//</span>
          <span>Secure Geolocation API // Local RAG Active</span>
        </div>
      </footer>
    </div>
  );
}
