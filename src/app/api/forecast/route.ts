import { NextRequest, NextResponse } from 'next/server';
import { getLocalizedData, DEFAULT_LOCATION } from '../../../services/mockData';
import { UserLocation } from '../../../types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get('regionId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const city = searchParams.get('city');
    const country = searchParams.get('country');

    // Resolve location from query parameters or default to Singapore
    const location: UserLocation = {
      latitude: lat ? parseFloat(lat) : DEFAULT_LOCATION.latitude,
      longitude: lng ? parseFloat(lng) : DEFAULT_LOCATION.longitude,
      city: city || DEFAULT_LOCATION.city,
      country: country || DEFAULT_LOCATION.country,
    };

    const regions = getLocalizedData(location);

    const now = new Date();
    const dayLabels = Array.from({ length: 7 }).map((_, idx) => {
      if (idx === 0) return 'Today';
      if (idx === 1) return 'Tomorrow';
      const d = new Date(now.getTime() + idx * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    });

    const forecastData = regions.map(region => {
      const isTarget = !regionId || region.id === regionId;
      if (!isTarget) return null;

      // Base metrics to project from
      const baseAqi = region.aqi;
      const baseTemp = region.temperature;
      const baseTraffic = region.trafficCongestion;
      const baseHealth = region.healthcareDemand;

      const dailyForecast = dayLabels.map((day, idx) => {
        const dayOffset = idx;
        const tempCycle = Math.sin((dayOffset / 7) * Math.PI * 2) * 1.5;
        const aqiCycle = Math.cos((dayOffset / 7) * Math.PI * 2) * (baseAqi * 0.15);
        
        const isWeekend = (now.getDay() + idx) % 7 === 0 || (now.getDay() + idx) % 7 === 6;
        const trafficMod = isWeekend ? -25 : 5;

        const healthMod = Math.sin(((dayOffset - 1) / 7) * Math.PI * 2) * 8;

        const aqi = Math.round(Math.max(10, baseAqi + aqiCycle + (Math.random() - 0.5) * 5));
        const temp = Number((baseTemp + tempCycle + (Math.random() - 0.5) * 0.5).toFixed(1));
        const traffic = Math.round(Math.min(100, Math.max(10, baseTraffic + trafficMod + (Math.random() - 0.5) * 8)));
        const health = Math.round(Math.min(100, Math.max(10, baseHealth + healthMod + (Math.random() - 0.5) * 6)));

        const riskScore = Math.min(100, Math.max(0, Math.round(
          (aqi / 150) * 35 + 
          (Math.max(0, temp - 26) / 10) * 25 + 
          (health) * 0.25 + 
          (traffic) * 0.15
        )));

        return {
          day,
          aqi,
          temperature: temp,
          traffic,
          health,
          riskScore
        };
      });

      return {
        regionId: region.id,
        regionName: region.name,
        forecast: dailyForecast
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      location: { city: location.city, country: location.country },
      data: regionId ? forecastData[0] : forecastData
    });

  } catch (error: any) {
    console.error('Forecast API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
