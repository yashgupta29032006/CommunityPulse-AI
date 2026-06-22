import { UserLocation, DataSourceType } from '../types';

export interface TelemetryFeed {
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  uvIndex: number | null;
  aqi: number | null;
  dataSourceType: DataSourceType;
  dataProvider: string;
  dataLastUpdated: string;
  stale?: boolean;
}

interface LocalCacheEntry {
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  uvIndex: number | null;
  aqi: number | null;
  timestamp: string;
  expiresAt: number;
  provider: string;
}

export class DataProviderService {
  private cacheDuration = 15 * 60 * 1000; // 15 minutes

  /**
   * Resolves telemetry metrics for coordinates, using Server API -> Client Cache -> Simulated Fallback
   */
  async getTelemetryForCoords(lat: number, lng: number): Promise<TelemetryFeed> {
    const cacheKey = `local_telemetry_${lat.toFixed(2)}_${lng.toFixed(2)}`;

    // 1. Check offline status immediately
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      console.warn('Network offline. Loading local cache...');
      const localCache = this.readLocalCache(cacheKey);
      if (localCache) {
        return {
          ...localCache,
          dataSourceType: 'cached',
          stale: true
        };
      }
      return this.getSimulatedFallback();
    }

    try {
      // 2. Fetch from server telemetry endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`/api/telemetry?lat=${lat}&lng=${lng}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const raw = await response.json();
      
      const feed: TelemetryFeed = {
        temperature: raw.temperature,
        humidity: raw.humidity,
        windSpeed: raw.windSpeed,
        uvIndex: raw.uvIndex,
        aqi: raw.aqi,
        dataSourceType: raw.metadata?.source === 'live' ? 'live' : 'cached',
        dataProvider: raw.metadata?.provider || 'Open-Meteo API',
        dataLastUpdated: raw.metadata?.lastUpdated || new Date().toISOString(),
        stale: raw.metadata?.stale || false
      };

      // Store in client-side localStorage cache for offline/resilience fallback
      this.writeLocalCache(cacheKey, feed);

      return feed;

    } catch (err) {
      console.warn('Failed to retrieve server telemetry, checking local cache:', err);

      // 3. Fallback to client cache
      const localCache = this.readLocalCache(cacheKey);
      if (localCache) {
        return {
          ...localCache,
          dataSourceType: 'cached',
          stale: true
        };
      }

      // 4. Final Fallback to simulated metrics
      return this.getSimulatedFallback();
    }
  }

  private readLocalCache(key: string): Omit<TelemetryFeed, 'dataSourceType'> | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsed: LocalCacheEntry = JSON.parse(stored);
      const now = Date.now();

      // Return stale cache if expired but mark it appropriately
      return {
        temperature: parsed.temperature,
        humidity: parsed.humidity,
        windSpeed: parsed.windSpeed,
        uvIndex: parsed.uvIndex,
        aqi: parsed.aqi,
        dataProvider: `${parsed.provider} (Local Cache)`,
        dataLastUpdated: parsed.timestamp,
        stale: now >= parsed.expiresAt
      };
    } catch (e) {
      return null;
    }
  }

  private writeLocalCache(key: string, feed: TelemetryFeed): void {
    if (typeof window === 'undefined') return;
    try {
      const entry: LocalCacheEntry = {
        temperature: feed.temperature,
        humidity: feed.humidity,
        windSpeed: feed.windSpeed,
        uvIndex: feed.uvIndex,
        aqi: feed.aqi,
        timestamp: feed.dataLastUpdated,
        expiresAt: Date.now() + this.cacheDuration,
        provider: feed.dataProvider
      };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      console.warn('Failed to write to localStorage cache:', e);
    }
  }

  private getSimulatedFallback(): TelemetryFeed {
    return {
      temperature: null,
      humidity: null,
      windSpeed: null,
      uvIndex: null,
      aqi: null,
      dataSourceType: 'simulated',
      dataProvider: 'Simulated Engine',
      dataLastUpdated: new Date().toISOString()
    };
  }
}

export const dataProviderService = new DataProviderService();
