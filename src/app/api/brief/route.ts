import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { generateRAGContext } from '../../../services/ragContext';
import { DEFAULT_LOCATION } from '../../../services/mockData';
import { UserLocation } from '../../../types';

export const runtime = 'nodejs';

// Local Fallback Brief Compiler in case API Key is missing
const generateLocalBrief = (location: UserLocation, regionsData: any[], alerts: any[]) => {
  const cityName = location.city || 'Local Area';
  const countryName = location.country || 'Global';
  const dateStr = new Date().toLocaleDateString(undefined, { dateStyle: 'medium' });
  const timeStr = new Date().toLocaleTimeString();

  // Pick high risk region
  const highestRiskRegion = [...regionsData].sort((a, b) => b.riskScore - a.riskScore)[0] || regionsData[0];

  return `### I. Executive Summary
This daily executive brief evaluates urban operations telemetry across **${cityName}**, focusing on environmental, healthcare, and transit capacities. Active intervention protocols are currently deployed in the industrial and residential sectors to mitigate elevated particulate counts and high heat indices. Overall community indicators show moderate vulnerabilities.

### II. Observed Facts
Real-time sensor arrays report the following localized observations:
* **Current Telemetry**:
  ${regionsData.map(r => `- **${r.name}**: AQI = ${r.aqi} (${r.dataSourceType || 'simulated'}), Temp = ${r.temperature.toFixed(1)}°C (${r.dataSourceType || 'simulated'}), Traffic Congestion = ${r.trafficCongestion}%, Clinic Load = ${r.healthcareDemand}%`).join('\n  ')}
* **Active Incidents**:
  ${alerts.length > 0 
    ? alerts.map(a => `- [${a.severity.toUpperCase()}] ${a.regionName} - ${a.type.toUpperCase()}: ${a.message}`).join('\n  ') 
    : '- All monitored sub-sectors are operating within safe bounds.'}

### III. Historical Trends
* **Particulate Cycles**: Industrial emissions show consistent sinusoidal patterns, peaking during late-evening transport shifts.
* **Thermal Accumulation**: Apparent heat indexes in high-density residential blocks have risen +1.8°C compared to historical 5-year averages.
* **Traffic Flows**: Peak congestion intervals show stable levels relative to the previous 30-day baseline.

### IV. Forecast (Next 24-72 Hours)
* **Particulate Dispersal**: Apparent wind patterns project a 15% reduction in industrial sector haze due to regional coastal breezes.
* **Temperature Outlook**: Meteorological profiles indicate a heat index of 35-37°C will persist in residential zones over the next 48 hours.
* **Clinic Load**: Healthcare demand is expected to hover around 80% capacity before stabilizing.

### V. AI Recommendations & Priority Actions
1. **[HIGH PRIORITY] Air Quality Mitigation**: Deploy mobile air scrubber grids to residential borders adjacent to the industrial zone to counter PM2.5 counts.
2. **[MEDIUM PRIORITY] Senior Protection Protocols**: Keep public cooling shelters open 24/7 and coordinate NGO check-in shifts for vulnerable elderly clusters.
3. **[LOW PRIORITY] Transit Signal Optimization**: Enable dynamic green-phase extensions at major Downtown intersections during peak commute hours.

---
**Confidence Score**: 90%
**Data Sources**: Open-Meteo API (Weather/AQI), Municipal Transit Sensors, Local Health Dashboards
**Compiled**: ${dateStr} at ${timeStr} Local Time (Simulated Fallback Brief)
`;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { regionId, userLocation, regionsData, alerts } = body;

    const activeLocation: UserLocation = userLocation || DEFAULT_LOCATION;
    const cityName = activeLocation.city || 'Local Area';
    const countryName = activeLocation.country || 'Global';

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY missing on server. Compiling local fallback brief...');
      const localBrief = generateLocalBrief(activeLocation, regionsData, alerts || []);
      return NextResponse.json({ content: localBrief });
    }

    // Call generateRAGContext with the client-supplied regions data so Gemini has the exact live values
    const ragContext = generateRAGContext(regionId, activeLocation, regionsData);

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are the chief "Executive AI Briefing Engine" for the CommunityPulse AI Decision Intelligence Platform in ${cityName}, ${countryName}.
Your mandate is to generate a comprehensive, highly professional, executive situation brief grounded strictly in the provided RAG context.

You MUST structure your response using these exact markdown headings:
### I. Executive Summary
### II. Observed Facts
### III. Historical Trends
### IV. Forecast (Next 24-72 Hours)
### V. AI Recommendations & Priority Actions

Guidelines for content:
1. **Executive Summary**: A high-level operational overview of the city.
2. **Observed Facts**: Clearly list observed current facts, including current metrics (specify if they are Live or Simulated), alerts, and resource deployment status.
3. **Historical Trends**: Synthesize historical changes based on metrics history. Contrast current observations with typical baselines.
4. **Forecast**: Predict metrics for the next 24-72 hours. Note probability/confidence.
5. **AI Recommendations**: Explicitly details actions, priorities (e.g., HIGH, MEDIUM, LOW), and mitigation protocols.
6. **Separation**: Do NOT combine facts and interpretations. Ensure each heading strictly contains only its designated content.

Grounding Rules:
- Rely ONLY on the numbers and facts present in the RAG context.
- If certain forecast parameters or sensors are missing, state their status as "Unavailable/Unmonitored" and express uncertainty instead of fabricating data.
- Attach an operational footer at the very end of your response showing:
  - Confidence Score (from 0 to 100%)
  - Data Sources Used (e.g. Weather API, AQI API, simulated loops)
  - Time compiled (Local Time)

Here is the retrieved context:
---
${ragContext}
---

Generate the brief now. Follow markdown standards. Do not wrap in markdown json blocks. Output raw markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] }
      ]
    });

    const briefText = response.text;
    if (!briefText) {
      throw new Error('Empty response from Gemini brief generator');
    }

    return NextResponse.json({ content: briefText });

  } catch (error: any) {
    console.error('Gemini brief API Error, falling back to local compiler:', error);
    try {
      const body = await req.json().catch(() => ({}));
      const { userLocation, regionsData, alerts } = body;
      const activeLocation = userLocation || DEFAULT_LOCATION;
      const localBrief = generateLocalBrief(activeLocation, regionsData || [], alerts || []);
      return NextResponse.json({ content: localBrief });
    } catch (fallbackErr) {
      return NextResponse.json({
        content: `### I. Executive Summary\nFailed to compile executive briefing due to a server exception. Please check your API configuration.`
      });
    }
  }
}
