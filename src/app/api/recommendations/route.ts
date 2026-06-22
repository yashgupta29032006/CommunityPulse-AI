import { NextRequest, NextResponse } from 'next/server';
import { getSingaporeData, getStaticRecommendations } from '../../../services/mockData';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get('regionId');

    const regions = getSingaporeData();
    
    if (regionId) {
      const recommendations = getStaticRecommendations(regionId, regions);
      return NextResponse.json({
        success: true,
        regionId,
        recommendations
      });
    }

    // Return recommendations for all regions
    const allRecommendations = regions.flatMap(region => getStaticRecommendations(region.id, regions));
    return NextResponse.json({
      success: true,
      count: allRecommendations.length,
      recommendations: allRecommendations
    });

  } catch (error: any) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
