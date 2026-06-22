import { NextRequest, NextResponse } from 'next/server';
import { getLocalizedData, getStaticRecommendations, DEFAULT_LOCATION } from '../../../services/mockData';
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
    
    if (regionId) {
      const recommendations = getStaticRecommendations(regionId, regions);
      return NextResponse.json({
        success: true,
        regionId,
        location: { city: location.city, country: location.country },
        recommendations
      });
    }

    const allRecommendations = regions.flatMap(region => getStaticRecommendations(region.id, regions));
    return NextResponse.json({
      success: true,
      count: allRecommendations.length,
      location: { city: location.city, country: location.country },
      recommendations: allRecommendations
    });

  } catch (error: any) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
