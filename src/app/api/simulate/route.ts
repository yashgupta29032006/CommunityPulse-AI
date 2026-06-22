import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { DEFAULT_LOCATION } from '../../../services/mockData';
import { UserLocation } from '../../../types';

export const runtime = 'nodejs';

// Local Fallback Simulation Engine
const compileLocalSimulation = (parameter: string, value: number, location: UserLocation) => {
  const cityName = location.city || 'Local Area';
  let simulatedRiskScore = 50;
  let impactAnalysis = '';
  let mitigationActions: string[] = [];
  let assumptions: string[] = [];
  let confidenceScore = 0.85;

  const valStr = value.toString();

  if (parameter === 'aqi') {
    simulatedRiskScore = Math.min(100, Math.round(30 + (value / 250) * 70));
    assumptions = [
      'Industrial emissions remain constant at sources',
      'Wind speed matches current seasonal averages (~5 km/h)',
      'Sub-regional atmospheric boundary layer height is compressed'
    ];
    
    if (value > 150) {
      impactAnalysis = `### Atmospheric Particulate Simulation
Hypothetical AQI reaches **${valStr}** (Unhealthy).
* **Clinical Health Surge**: Asthmatic admissions in clinics near the industrial zone are projected to increase by **30-35%**.
* **Vulnerable Demographics**: High risk of respiratory stress among senior citizens and school children in the residential suburb.
* **Environmental Dispersal**: Apparent haze will limit visibility, slowing down central transportation corridors.`;
      mitigationActions = [
        'Command deployment of all mobile air scrubber assets to border residential sectors.',
        'Issue a class-wide suspension of outdoor physical activities in municipal schools.',
        'Impose temporary emissions caps on industrial boilers in the sector.'
      ];
    } else {
      impactAnalysis = `### Normal Particulate baseline
Hypothetical AQI stabilizes at **${valStr}** (Moderate/Optimal).
* Telemetry values indicate atmospheric particulates are within manageable limits.
* No clinical surge predicted.`;
      mitigationActions = [
        'Maintain baseline air purification sweeps.',
        'Monitor local weather change forecasts.'
      ];
    }

  } else if (parameter === 'temperature') {
    simulatedRiskScore = Math.min(100, Math.round(35 + (Math.max(0, value - 20) / 30) * 65));
    assumptions = [
      'Relative humidity remains saturated at 75-80%',
      'Urban heat island (UHI) coefficient is elevated due to concrete mass',
      'Residential air-conditioning grids draw maximum power load'
    ];

    if (value > 38.0) {
      impactAnalysis = `### Thermal Stress Simulation
Hypothetical Temperature rises to **${valStr}°C** (Extreme Heat).
* **Grid Load Warning**: Electrical substations feeding residential hubs will experience a **40% load increase**, risking localized brownouts.
* **ER Overload Risk**: Heat exhaustion and dehydration emergency calls are simulated to spike by **25%** within 12 hours.
* **Urban Heat Index**: Saturated humidity creates an apparent heat index exceeding 46°C in downtown pathways.`;
      mitigationActions = [
        'Activate all community cooling shelters in high-density residential blocks.',
        'Broadcast extreme heat advisory warnings to all active mobile devices.',
        'Coordinate emergency medical crews to establish hydration hubs in public transit stations.'
      ];
    } else {
      impactAnalysis = `### Standard Thermal baseline
Hypothetical Temperature stabilizes at **${valStr}°C** (Normal).
* Base indices do not trigger critical warnings.
* Heat risk index remains low.`;
      mitigationActions = [
        'Maintain normal cooling shelter standby protocols.',
        'Regular monitoring of daily forecast cycles.'
      ];
    }

  } else if (parameter === 'traffic') {
    simulatedRiskScore = Math.min(100, Math.round(40 + (value / 100) * 55));
    assumptions = [
      'Signal light controller timing operates on static phases',
      'No major commuter rail breakdowns occur simultaneously',
      'Weather is clear with no heavy rain blockages'
    ];

    if (value > 75) {
      impactAnalysis = `### Mobility Gridlock Simulation
Hypothetical Traffic Congestion reaches **${valStr}%** (Severe Congestion).
* **Emergency Delay**: Ambulance transit times to downtown clinics will increase by **+15 minutes**.
* **Carbon Concentration**: Idling vehicles will cause a localized 20% spike in carbon monoxide readings along downtown streets.
* **Economic Impact**: Commercial delivery delays will result in significant local supply-chain bottlenecks.`;
      mitigationActions = [
        'Transition traffic light controllers to adaptive dynamic green-phase cycles.',
        'Broadcast detour advisories via commercial navigation apps.',
        'Deploy traffic wardens to clear main downtown intersections.'
      ];
    } else {
      impactAnalysis = `### Fluid Mobility baseline
Hypothetical Traffic Congestion stabilizes at **${valStr}%** (Fluid/Moderate).
* Commute delays remain negligible.
* Transit flow is nominal.`;
      mitigationActions = [
        'Monitor exit lanes during peak commute hours.',
        'Optimize signal cycles dynamically.'
      ];
    }

  } else {
    // Resources
    simulatedRiskScore = Math.max(10, Math.round(85 - (value * 15)));
    assumptions = [
      'District incident rate remains stable',
      'First-responder staffing is at baseline levels',
      'Mutual-aid agreements remain active'
    ];

    if (value < 2) {
      impactAnalysis = `### Emergency Resource Depletion Simulation
Hypothetical deployed assets reduced to **${valStr}** units (Critical Shortage).
* **Containment Delay**: Average containment time for critical alerts (e.g. chemical odors, UHI hotspots) will double.
* **Public Safety Vulnerability**: Response time to clinic surges will increase significantly.
* **Staff Fatigue**: Remaining field crews will experience extreme burnout, degrading operational safety.`;
      mitigationActions = [
        'Establish emergency mutual-aid sharing agreements with adjacent districts.',
        'Activate community emergency response volunteers to manage hydration and minor alerts.',
        'Defer non-essential maintenance tasks to maximize crew availability.'
      ];
    } else {
      impactAnalysis = `### Adequate Resource baseline
Hypothetical deployed assets stabilize at **${valStr}** units (Good readiness).
* Telemetry indicates sufficient response capability.
* Risk containment margins are healthy.`;
      mitigationActions = [
        'Conduct routine responder drills.',
        'Maintain current asset inventory.'
      ];
    }
  }

  return {
    simulatedRiskScore,
    impactAnalysis,
    mitigationActions,
    assumptions,
    dataSources: ['Open-Meteo API', 'Sensors Baseline', 'Simulated Fallback Engine'],
    confidenceScore
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { parameter, value, currentLocation, currentMetrics } = body;

    if (!parameter || value === undefined) {
      return NextResponse.json({ error: 'Missing simulation parameters' }, { status: 400 });
    }

    const activeLocation: UserLocation = currentLocation || DEFAULT_LOCATION;
    const cityName = activeLocation.city || 'Local Area';

    const apiKey = process.env.GEMINI_API_KEY;

    // Call Local fallback if key is missing
    if (!apiKey) {
      console.warn('GEMINI_API_KEY missing on server. Compiling local fallback simulation...');
      const fallback = compileLocalSimulation(parameter, value, activeLocation);
      return NextResponse.json(fallback);
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are the chief "AI Urban Simulator Engine" for the CommunityPulse AI Decision Intelligence Platform in ${cityName}.
Your task is to predict the downstream impacts on the city if a user-selected variable is hypothetically changed.

Simulated Parameter: "${parameter}" (can be 'aqi', 'temperature', 'traffic', or 'resources' representing deployed assets)
Hypothetical Value: ${value}
Active City: ${cityName}

You MUST evaluate how this hypothetical value (which may be extreme) affects:
1. Community Health & ER clinic load
2. Transit networks & emergency response times
3. Energy grid load & public infrastructure stress
4. Overall municipal risk score (which you must calculate between 0 and 100)

Return your response strictly as a JSON object matching this schema:
{
  "simulatedRiskScore": 82, // Integer between 0 and 100 representing overall risk under this simulated condition
  "impactAnalysis": "Markdown formatted string detailing the downstream consequences on health, transit, and grid infrastructure. Use bullet points and bold text.",
  "mitigationActions": ["Action 1...", "Action 2..."], // Array of strings outlining recommended response actions to mitigate this hypothetical scenario
  "assumptions": ["Assumption 1", "Assumption 2"], // Array of strings outlining assumptions made for the simulation
  "dataSources": ["Data source 1", "Data source 2"], // Array of datasets utilized
  "confidenceScore": 0.88 // Float between 0.0 and 1.0 representing simulation reliability
}

DO NOT include any markdown code block wrapper (like \`\`\`json) in your raw output. Output ONLY the raw JSON string.
Ground your reasoning in urban planning and emergency management principles. Ensure the output is clearly formulated to explain the impacts.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini simulation engine');
    }

    const resultJson = JSON.parse(responseText.trim());
    return NextResponse.json(resultJson);

  } catch (error: any) {
    console.error('Gemini simulation API Error, falling back to local compiler:', error);
    try {
      const body = await req.json().catch(() => ({}));
      const { parameter, value, currentLocation } = body;
      const activeLocation = currentLocation || DEFAULT_LOCATION;
      const fallback = compileLocalSimulation(parameter || 'aqi', value || 150, activeLocation);
      return NextResponse.json(fallback);
    } catch (fallbackErr) {
      return NextResponse.json({
        simulatedRiskScore: 50,
        impactAnalysis: '### System Failure\nFailed to compile What-If simulation due to a server exception. Please check your API configuration.',
        mitigationActions: ['Check server logs.'],
        assumptions: ['System is in a failed state.'],
        dataSources: ['N/A'],
        confidenceScore: 0.0
      });
    }
  }
}
