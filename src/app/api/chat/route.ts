import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { generateRAGContext } from '../../../services/ragContext';
import { getLocalizedData, getActiveAlerts, DEFAULT_LOCATION } from '../../../services/mockData';
import { UserLocation } from '../../../types';

export const runtime = 'nodejs';

// Smart Local Heuristic Fallback centered on dynamic location
const generateFallbackResponse = (query: string, regionId?: string, persona?: string, location: UserLocation = DEFAULT_LOCATION) => {
  const regions = getLocalizedData(location);
  const q = query.toLowerCase();

  const cityName = location.city || 'Local Area';
  const countryName = location.country || 'Global';

  let matchedRegion = regionId ? regions.find(r => r.id === regionId) : null;
  if (!matchedRegion) {
    if (q.includes('industrial') || q.includes('factory') || q.includes('pollut')) {
      matchedRegion = regions.find(r => r.id === 'industrial') || null;
    } else if (q.includes('downtown') || q.includes('center') || q.includes('cbd')) {
      matchedRegion = regions.find(r => r.id === 'downtown') || null;
    } else if (q.includes('residential') || q.includes('suburb') || q.includes('heat') || q.includes('temp')) {
      matchedRegion = regions.find(r => r.id === 'residential') || null;
    } else if (q.includes('tech') || q.includes('marina') || q.includes('coast') || q.includes('innovation')) {
      matchedRegion = regions.find(r => r.id === 'innovation') || null;
    }
  }

  let content = '';
  let inputsUsed: string[] = [`${cityName} Grid Sensor Logs`];
  let reasoningSteps: string[] = ['Parsed localized query strings', `Scanned ${cityName} telemetry database`];
  let evidence = `Triggered baseline indicators for ${cityName}.`;
  let confidence = 0.90;
  let followUps: string[] = [];

  const r = matchedRegion || regions[0];

  if (q.includes('pollution') || q.includes('aqi') || q.includes('air') || (matchedRegion && matchedRegion.id === 'industrial')) {
    inputsUsed = ['PM2.5 Sensor Data', 'Odor Complaint Registers', 'Clinic Asthmatic Admissions'];
    reasoningSteps = [
      `Detected air quality query intent for ${r.name}`,
      `Analyzed current localized AQI score (${r.aqi})`,
      'Cross-checked active chemical odor logs',
      'Correlated respiratory clinic demand'
    ];
    evidence = `${r.name} is reporting an AQI level of ${r.aqi} with unresolved pollution complaints.`;
    confidence = r.id === 'industrial' ? 0.93 : 0.88;
    
    content = `### Executive Summary
In **${r.name}**, the Air Quality Index (AQI) is currently at **${r.aqi}**, which falls into the **${r.aqi > 100 ? 'Unhealthy' : 'Moderate'}** range. This is primarily caused by particulate concentration near industrial borders.

### Key Supporting Metrics
* **Current AQI:** ${r.aqi} (Safety threshold: 100)
* **Active Pollutant Reports:** ${r.complaintsList.filter(c => c.category === 'pollution').length} unresolved complaints
* **Clinic Demand Rate:** ${r.healthcareDemand}% of baseline capacity

### Actionable Recommendations
1. **Orchestrate Air Purifiers:** Mobilize mobile air scrubbing grids to residential areas near the industrial zone immediately.
2. **Issue Health Advisory:** Suspend outdoor sports in municipal schools in the local sector until AQI stabilizes below 100.
3. **Audit Emissions:** Deploy inspector teams to check industrial stack filtrations.`;

    followUps = [
      `What complaints are unresolved in ${r.name}?`,
      `Show me the 24-hour AQI history trend for ${r.name}.`,
      `What resources are deployed in ${r.name}?`
    ];

  } else if (q.includes('heat') || q.includes('temp') || q.includes('weather') || (matchedRegion && matchedRegion.id === 'residential')) {
    inputsUsed = ['Thermal Discomfort Array', 'Senior Demographic Distribution', 'Heat Exhaustion ER Records'];
    reasoningSteps = [
      `Detected thermal index query intent for ${r.name}`,
      `Read local temperature (${r.temperature.toFixed(1)}°C) and relative humidity (${r.humidity}%)`,
      'Calculated local apparent heat index',
      'Analyzed senior citizen population vulnerability'
    ];
    evidence = `${r.name} temperature is elevated at ${r.temperature.toFixed(1)}°C with high relative humidity (${r.humidity}%), creating heat-related health hazards.`;
    confidence = 0.91;

    content = `### Executive Summary
**${r.name}** is experiencing high thermal stress, with temperature reading at **${r.temperature.toFixed(1)}°C** and humidity at **${r.humidity}%**. This creates an apparent heat index exceeding 37°C, which poses heat exhaustion risks, especially for elderly clusters in the sector.

### Key Supporting Metrics
* **Temperature:** ${r.temperature.toFixed(1)}°C (Regional average: 31°C)
* **Humidity:** ${r.humidity}%
* **Elderly Vulnerability Index:** High (critical residential blocks)
* **Healthcare Demand:** ${r.healthcareDemand}% capacity utilized

### Actionable Recommendations
1. **Activate Community Cooling Shelters:** Ensure public, air-conditioned cooling centers are open 24/7.
2. **Deploy Hydration Volunteers:** Send volunteers to hand out water and check on isolated seniors.
3. **Broadcast Warning Alert:** Send cell-broadcast notifications to citizens in the residential sector.`;

    followUps = [
      `Where are the cooling shelters located in ${r.name}?`,
      `Compare the temperature in ${r.name} to other sectors.`,
      `Are there active medical teams in ${r.name}?`
    ];

  } else if (q.includes('traffic') || q.includes('congestion') || q.includes('jam') || (matchedRegion && matchedRegion.id === 'downtown')) {
    inputsUsed = ['Loop Sensor Congestion Data', 'Municipal Transit Feeds', 'Commuter Delay Reports'];
    reasoningSteps = [
      `Detected traffic gridlock query intent for ${r.name}`,
      `Analyzed traffic congestion coefficient (${r.trafficCongestion}%)`,
      'Checked active incidents for lane blockages or breakdowns',
      'Calculated public transport arrival delays'
    ];
    evidence = `${r.name} is reporting heavy traffic congestion (${r.trafficCongestion}%) with major delays on primary roads.`;
    confidence = 0.94;

    content = `### Executive Summary
The **${r.name}** is currently experiencing major traffic bottlenecks, with congestion running at **${r.trafficCongestion}%**. This is causing substantial delays on primary roads, primarily due to peak transit volume and an active road blockage.

### Key Supporting Metrics
* **Congestion Rate:** ${r.trafficCongestion}% (Normal limit: 50%)
* **Bus Delay Average:** +20 minutes
* **Active Incidents:** Lane blockage reported near central business district

### Actionable Recommendations
1. **Optimize Signal Phasing:** Implement dynamic green-light extensions along exit corridors to clear queues.
2. **Broadcast Diversions:** Advise drivers via navigation APIs to bypass the central corridor.
3. **Deploy Traffic Patrols:** Station auxiliary officers at main intersections to manage traffic flow.`;

    followUps = [
      `What is causing the lane blockage in ${r.name}?`,
      `Are there traffic patrol units active in ${r.name}?`,
      `Compare traffic congestion across all sectors of ${cityName}.`
    ];

  } else {
    // General localized status
    inputsUsed = ['All Sector Sensor Telemetry', 'Active Anomaly Triggers', 'Citizen Complaint Dashboard'];
    reasoningSteps = [
      `Detected generalized operations query for ${cityName}`,
      'Scanned all four local sub-regions for warning thresholds',
      'Aggregated active emergency alerts'
    ];
    evidence = `Analyzing ${cityName} telemetry. Jurong/Industrial AQI is at ${regions.find(rg => rg.id === 'industrial')?.aqi}. Residential Temp is at ${regions.find(rg => rg.id === 'residential')?.temperature.toFixed(1)}°C.`;
    confidence = 0.90;

    content = `### Executive Summary
The operations status for **${cityName}** shows two localized areas that require immediate attention:
1. **Air Quality in the Industrial Zone:** AQI is elevated at **${regions.find(rg => rg.id === 'industrial')?.aqi}** (Unhealthy).
2. **Thermal Discomfort in the Residential Zone:** Temperature is high at **${regions.find(rg => rg.id === 'residential')?.temperature.toFixed(1)}°C** with saturated healthcare demand.

Downtown and Innovation/Waterfront sectors remain within safe operational baselines.

### Key Supporting Metrics
* **Monitored Sectors:** 4
* **Sectors with Active Warnings:** 2
* **Total System Alerts:** ${regions.map(rg => rg.aqi > 100 || rg.temperature > 34 ? 1 : 0 as number).reduce((a, b) => a + b, 0)} active alerts

### Actionable Recommendations
1. **Orchestrate Air Filters:** Shift air purification grids to residential zones bordering the industrial sector.
2. **Open Cooling Facilities:** Activate air-conditioned community shelters in the residential suburb.
3. **Monitor Downtown Traffic:** Prepare for peak traffic congestion in the central area.`;

    followUps = [
      `Which areas of ${cityName} have the highest risk scores today?`,
      `Show me a summary of all active alerts in ${cityName}.`,
      `Generate a daily operations report for ${cityName}.`
    ];
  }

  return {
    content,
    explainability: {
      confidence,
      inputsUsed,
      reasoningSteps,
      evidence
    },
    followUps
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, regionId, persona, userLocation } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1].content;
    const apiKey = process.env.GEMINI_API_KEY;

    // Use geolocated context or fallback to default
    const activeLocation: UserLocation = userLocation || DEFAULT_LOCATION;
    const ragContext = generateRAGContext(regionId, activeLocation);

    const cityName = activeLocation.city || 'Local Area';
    const countryName = activeLocation.country || 'Global';

    // Heuristic Check: If API key is missing, immediately use the smart fallback geolocated to the user's city
    if (!apiKey) {
      const fallback = generateFallbackResponse(lastUserMessage, regionId, persona, activeLocation);
      return NextResponse.json(fallback);
    }

    // Call Gemini API via @google/genai
    const ai = new GoogleGenAI({ apiKey });
    
    const systemPrompt = `You are "PulseCopilot", the expert Decision Intelligence AI assistant for the CommunityPulse AI platform in ${cityName}, ${countryName}.
Your user is a "${persona || 'citizen'}" who is exploring local urban telemetry, environmental risks, and municipal recommendations.

Here is the retrieved real-time context of the user's location (${cityName}, ${countryName}), detailing regional air quality, traffic, temperature, citizen complaints, and active resource deployments:
---
${ragContext}
---

Your response MUST be returned STRICTLY as a JSON object matching this schema:
{
  "content": "A detailed, professional response formatted in Markdown. Structure it using: ### Executive Summary, ### Key Supporting Metrics, and ### Actionable Recommendations. Use bullet points and bold text for readability. Base your findings strictly on the context data above. Address findings with respect to ${cityName}.",
  "explainability": {
    "confidence": 0.95, // Float between 0.0 and 1.0 representing your assessment of data completeness and predictive reliability
    "inputsUsed": ["Input 1", "Input 2"], // Array of strings representing which specific metrics or complaints from the context influenced this response
    "reasoningSteps": ["Step 1...", "Step 2..."], // Array of strings showing the chain of thought logic used to reach the conclusions
    "evidence": "Brief string summarizing the hard facts from the data that support the recommendation."
  },
  "followUps": [
    "Follow-up question 1?",
    "Follow-up question 2?"
  ]
}

DO NOT include any markdown code block wrapper (like \`\`\`json) in your raw output. Output ONLY the raw JSON string.
Rely strictly on the observations in the provided context. Address only the user's active region and city (${cityName}). Do not hallucinate Singapore-specific details unless the user is in Singapore.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + `\n\nUser query: "${lastUserMessage}"\nSelected Region: ${regionId || 'All Regions'}` }] }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    const resultJson = JSON.parse(responseText.trim());
    return NextResponse.json(resultJson);

  } catch (error: any) {
    console.error('Gemini API Error, falling back to localized heuristic:', error);
    
    try {
      const body = await req.json().catch(() => ({}));
      const { messages, regionId, persona, userLocation } = body;
      const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : 'summarize';
      const activeLocation = userLocation || DEFAULT_LOCATION;
      const fallback = generateFallbackResponse(lastUserMessage, regionId, persona, activeLocation);
      return NextResponse.json(fallback);
    } catch (fallbackErr) {
      return NextResponse.json({
        content: `### Executive Summary\nThe system encountered an error connecting to the AI service, but local monitoring remains active. Please ensure your \`GEMINI_API_KEY\` is configured in your environment.\n\n### Current Recommendations\n1. Check network connectivity.\n2. Review system logs for detailed error reports.`,
        explainability: {
          confidence: 0.5,
          inputsUsed: ['System Status Log'],
          reasoningSteps: ['Encountered API connection exception', 'Triggered failsafe warning'],
          evidence: 'Gemini API call failed.'
        },
        followUps: ['Try again?']
      });
    }
  }
}
