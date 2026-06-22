import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Server-side in-memory cache
interface CacheEntry {
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  uvIndex: number | null;
  aqi: number | null;
  timestamp: string;
  expiresAt: number;
  weatherSource: 'live' | 'failed';
  aqiSource: 'live' | 'failed';
}

const serverCache = new Map<string, CacheEntry>();

// Cache validity duration (15 minutes)
const CACHE_DURATION = 15 * 60 * 1000;

// Fetch with timeout helper
const fetchWithTimeout = async (url: string, timeout = 4000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    if (!latStr || !lngStr) {
      return NextResponse.json({ error: 'Missing coordinates parameters' }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Invalid coordinates format' }, { status: 400 });
    }

    // Coarse coordinates key (binning to 2 decimal places, ~1.1km grid size)
    // This allows requests within the same neighborhood to share server cache
    const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const now = Date.now();
    const cachedEntry = serverCache.get(cacheKey);

    if (cachedEntry && now < cachedEntry.expiresAt) {
      return NextResponse.json({
        ...cachedEntry,
        metadata: {
          source: 'cached',
          provider: 'Open-Meteo API (Server Cache)',
          lastUpdated: cachedEntry.timestamp,
          expiresAt: new Date(cachedEntry.expiresAt).toISOString(),
          version: '1.0.0'
        }
      });
    }

    // Prepare URLs for independent parallel fetches
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi`;

    // Execute fetches independently and in parallel
    const [weatherResult, aqiResult] = await Promise.allSettled([
      fetchWithTimeout(weatherUrl),
      fetchWithTimeout(aqiUrl)
    ]);

    let temperature: number | null = null;
    let humidity: number | null = null;
    let windSpeed: number | null = null;
    let uvIndex: number | null = null;
    let aqi: number | null = null;

    let weatherSource: 'live' | 'failed' = 'failed';
    let aqiSource: 'live' | 'failed' = 'failed';

    // Parse Weather API
    if (weatherResult.status === 'fulfilled' && weatherResult.value.ok) {
      try {
        const weatherData = await weatherResult.value.json();
        const current = weatherData.current;
        if (current) {
          temperature = current.temperature_2m;
          humidity = current.relative_humidity_2m;
          windSpeed = current.wind_speed_10m;
          uvIndex = current.uv_index;
          weatherSource = 'live';
        }
      } catch (e) {
        console.error('Failed to parse weather json:', e);
      }
    } else {
      console.warn('Weather API failed or timed out:', weatherResult);
    }

    // Parse AQI API
    if (aqiResult.status === 'fulfilled' && aqiResult.value.ok) {
      try {
        const aqiData = await aqiResult.value.json();
        const current = aqiData.current;
        if (current && typeof current.us_aqi === 'number') {
          aqi = current.us_aqi;
          aqiSource = 'live';
        }
      } catch (e) {
        console.error('Failed to parse AQI json:', e);
      }
    } else {
      console.warn('AQI API failed or timed out:', aqiResult);
    }

    // If both failed and we have an expired cache entry, serve stale cache as a fallback rather than failing
    if (weatherSource === 'failed' && aqiSource === 'failed' && cachedEntry) {
      return NextResponse.json({
        ...cachedEntry,
        metadata: {
          source: 'cached',
          provider: 'Open-Meteo API (Stale Server Cache)',
          lastUpdated: cachedEntry.timestamp,
          expiresAt: new Date(cachedEntry.expiresAt).toISOString(),
          version: '1.0.0',
          stale: true
        }
      });
    }

    // Save cache entry (even partial fetches are cached to protect Open-Meteo endpoints)
    const newEntry: CacheEntry = {
      temperature,
      humidity,
      windSpeed,
      uvIndex,
      aqi,
      timestamp: new Date().toISOString(),
      expiresAt: now + CACHE_DURATION,
      weatherSource,
      aqiSource
    };

    serverCache.set(cacheKey, newEntry);

    return NextResponse.json({
      ...newEntry,
      metadata: {
        source: 'live',
        provider: 'Open-Meteo API',
        lastUpdated: newEntry.timestamp,
        expiresAt: new Date(newEntry.expiresAt).toISOString(),
        version: '1.0.0'
      }
    });

  } catch (error: any) {
    console.error('Server Telemetry Router Error:', error);
    return NextResponse.json({ error: error.message || 'Telemetry resolution failed' }, { status: 500 });
  }
}
