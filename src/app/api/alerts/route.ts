import { NextRequest, NextResponse } from 'next/server';
import { getLocalizedData, getActiveAlerts, DEFAULT_LOCATION } from '../../../services/mockData';
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

    const location: UserLocation = {
      latitude: lat ? parseFloat(lat) : DEFAULT_LOCATION.latitude,
      longitude: lng ? parseFloat(lng) : DEFAULT_LOCATION.longitude,
      city: city || DEFAULT_LOCATION.city,
      country: country || DEFAULT_LOCATION.country,
    };

    const regions = getLocalizedData(location);
    let alerts = getActiveAlerts(regions);

    if (regionId) {
      alerts = alerts.filter(a => a.regionId === regionId);
    }

    return NextResponse.json({
      success: true,
      count: alerts.length,
      location: { city: location.city, country: location.country },
      alerts
    });
  } catch (error: any) {
    console.error('Alerts API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
