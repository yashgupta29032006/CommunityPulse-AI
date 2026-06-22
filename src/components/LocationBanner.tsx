'use client';

import React, { useState } from 'react';
import { MapPin, Search, Compass, Loader, Check, AlertCircle, Edit2 } from 'lucide-react';
import { UserLocation } from '../types';

interface LocationBannerProps {
  currentLocation: UserLocation | null;
  loading: boolean;
  error: string | null;
  onSearchCity: (cityName: string) => Promise<boolean>;
  onTriggerGps: () => Promise<void>;
}

export default function LocationBanner({
  currentLocation,
  loading,
  error,
  onSearchCity,
  onTriggerGps
}: LocationBannerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    try {
      const success = await onSearchCity(searchQuery);
      if (success) {
        setIsEditing(false);
        setSearchQuery('');
      } else {
        setSearchError('City not found. Try another search (e.g., "Kanpur", "London").');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Geocoding query failed.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGpsClick = async () => {
    setSearchError(null);
    setSearchLoading(true);
    try {
      await onTriggerGps();
      setIsEditing(false);
    } catch (err: any) {
      setSearchError(err.message || 'GPS location permission denied or timed out.');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm transition-colors mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Status display */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 flex items-center justify-center">
            {loading || searchLoading ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <MapPin className="h-5 w-5 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">Operations Sector</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            {loading ? (
              <h3 className="font-bold text-sm text-zinc-500 mt-0.5">Resolving regional coordinates...</h3>
            ) : currentLocation ? (
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 mt-0.5 flex items-center gap-1.5 flex-wrap">
                {currentLocation.city || currentLocation.displayName || 'Unknown Sector'}, {currentLocation.country}
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 font-normal">
                  ({currentLocation.latitude.toFixed(4)}°N, {currentLocation.longitude.toFixed(4)}°E)
                </span>
              </h3>
            ) : (
              <h3 className="font-bold text-sm text-rose-500 mt-0.5">Operations Center Off-line</h3>
            )}
          </div>
        </div>

        {/* Search controls */}
        <div className="w-full md:w-auto flex flex-col gap-2 items-stretch md:items-end">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full md:w-auto bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Adjust Center Location
            </button>
          ) : (
            <div className="flex flex-col gap-1.5 w-full max-w-md">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter city (e.g. Delhi, New York, London)..."
                    className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-950 dark:text-zinc-100 focus:outline-none"
                    disabled={searchLoading}
                  />
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                </div>
                <button
                  type="submit"
                  disabled={searchLoading || !searchQuery.trim()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-semibold transition-colors"
                >
                  Go
                </button>
                <button
                  type="button"
                  onClick={handleGpsClick}
                  disabled={searchLoading}
                  className="p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors flex items-center justify-center"
                  title="Detect browser GPS"
                >
                  <Compass className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setSearchError(null);
                  }}
                  className="px-2.5 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-lg text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
              </form>

              {searchError && (
                <div className="text-[10px] text-rose-500 font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" />
                  {searchError}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
