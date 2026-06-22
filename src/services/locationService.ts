import { UserLocation } from '../types';

// 1. Define the provider interface
export interface ILocationProvider {
  reverseGeocode(lat: number, lng: number): Promise<UserLocation>;
  searchLocation(query: string): Promise<UserLocation>;
  coarseLocationByIp(): Promise<UserLocation>;
}

// 2. OpenStreetMap Nominatim & ip-api.com implementation
class OpenStreetMapProvider implements ILocationProvider {
  async reverseGeocode(lat: number, lng: number): Promise<UserLocation> {
    try {
      // Nominatim requires a descriptive User-Agent
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CommunityPulse-AI-APAC-Challenge-Submission'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`OSM Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      const addr = data.address || {};
      
      const city = addr.city || addr.town || addr.municipality || addr.village || addr.suburb || '';
      const state = addr.state || addr.region || '';
      const country = addr.country || '';
      const locality = addr.suburb || addr.neighbourhood || addr.quarter || '';
      
      return {
        latitude: lat,
        longitude: lng,
        city,
        state,
        country,
        locality,
        displayName: data.display_name || `${city}, ${country}`
      };
    } catch (error) {
      console.error('OSM reverse geocoding failed, generating dynamic coordinates location:', error);
      return {
        latitude: lat,
        longitude: lng,
        city: 'Local Area',
        state: 'State/Region',
        country: 'Global Sector',
        displayName: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      };
    }
  }

  async searchLocation(query: string): Promise<UserLocation> {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`,
      {
        headers: {
          'User-Agent': 'CommunityPulse-AI-APAC-Challenge-Submission'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`OSM Search API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error(`No locations found matching "${query}"`);
    }

    const result = data[0];
    const addr = result.address || {};
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    const city = addr.city || addr.town || addr.municipality || addr.village || addr.suburb || '';
    const state = addr.state || addr.region || '';
    const country = addr.country || '';
    const locality = addr.suburb || addr.neighbourhood || '';

    return {
      latitude: lat,
      longitude: lng,
      city,
      state,
      country,
      locality,
      displayName: result.display_name || `${city}, ${country}`
    };
  }

  async coarseLocationByIp(): Promise<UserLocation> {
    try {
      // Primary: ip-api.com (free, no keys)
      const response = await fetch('http://ip-api.com/json/');
      if (!response.ok) throw new Error('ip-api.com failed');
      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          latitude: data.lat,
          longitude: data.lon,
          city: data.city || '',
          state: data.regionName || '',
          country: data.country || '',
          displayName: `${data.city || 'Local IP Area'}, ${data.country || 'Global'}`
        };
      }
      throw new Error('IP lookup returned unsuccessful status');
    } catch (e) {
      console.warn('Primary IP geolocator failed, trying secondary ipapi.co:', e);
      try {
        // Secondary: ipapi.co (fallback, free HTTPS endpoint available)
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('ipapi.co failed');
        const data = await response.json();
        
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city || '',
          state: data.region || '',
          country: data.country_name || '',
          displayName: `${data.city || 'Local IP Area'}, ${data.country_name || 'Global'}`
        };
      } catch (fallbackError) {
        console.error('All IP location lookups failed:', fallbackError);
        // Absolute fallback coordinates (New York City as a neutral central hub)
        return {
          latitude: 40.7128,
          longitude: -74.0060,
          city: 'New York City',
          state: 'New York',
          country: 'United States',
          displayName: 'New York City, United States (Failsafe Fallback)'
        };
      }
    }
  }
}

// 3. Location Manager wrapping provider with cache checks & browser geolocation
export class LocationService {
  private provider: ILocationProvider;
  private cacheKey = 'communitypulse_user_location';

  constructor(provider: ILocationProvider = new OpenStreetMapProvider()) {
    this.provider = provider;
  }

  // Retrieve cached location if valid
  getCachedLocation(): UserLocation | null {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed reading location cache:', e);
    }
    return null;
  }

  // Cache location
  setCachedLocation(location: UserLocation): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(location));
    } catch (e) {
      console.error('Failed writing location cache:', e);
    }
  }

  clearCachedLocation(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.cacheKey);
    } catch (e) {
      console.error('Failed clearing location cache:', e);
    }
  }

  // Step 1: Detect via browser GPS
  async detectBrowserLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Reverse geocode to get city name
            const location = await this.provider.reverseGeocode(lat, lng);
            this.setCachedLocation(location);
            resolve(location);
          } catch (e) {
            reject(e);
          }
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 600000 }
      );
    });
  }

  // Step 2: Fallback to IP lookup
  async detectIpLocation(): Promise<UserLocation> {
    const location = await this.provider.coarseLocationByIp();
    this.setCachedLocation(location);
    return location;
  }

  // Step 3: Manual Search
  async searchCity(query: string): Promise<UserLocation> {
    const location = await this.provider.searchLocation(query);
    this.setCachedLocation(location);
    return location;
  }

  // Orchestrator: Geolocation -> Cache -> IP -> Reject
  async resolveLocation(forceDetect: boolean = false): Promise<UserLocation> {
    if (!forceDetect) {
      const cached = this.getCachedLocation();
      if (cached) return cached;
    }

    try {
      // Try Browser GPS
      return await this.detectBrowserLocation();
    } catch (gpsError: any) {
      console.warn('Browser GPS detection failed, falling back to IP detection:', gpsError?.message || gpsError);
      try {
        // Try IP Lookup
        return await this.detectIpLocation();
      } catch (ipError: any) {
        console.error('IP geolocating fallback failed:', ipError?.message || ipError);
        throw new Error('Could not resolve location. Please select a city manually.');
      }
    }
  }
}

export const locationService = new LocationService();
