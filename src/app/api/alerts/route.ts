import { NextRequest, NextResponse } from 'next/server';
import { getSingaporeData, getActiveAlerts } from '../../../services/mockData';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get('regionId');

    const regions = getSingaporeData();
    let alerts = getActiveAlerts(regions);

    if (regionId) {
      alerts = alerts.filter(a => a.regionId === regionId);
    }

    return NextResponse.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error: any) {
    console.error('Alerts API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
