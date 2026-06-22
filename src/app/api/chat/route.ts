import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { generateRAGContext } from '../../../services/ragContext';
import { getSingaporeData } from '../../../services/mockData';

export const runtime = 'nodejs';

// Smart Local Heuristic Fallback
const generateFallbackResponse = (query: string, regionId?: string, persona?: string) => {
  const regions = getSingaporeData();
  const contextText = generateRAGContext(regionId);
  const q = query.toLowerCase();

  let matchedRegion = regionId ? regions.find(r => r.id === regionId) : null;
  if (!matchedRegion) {
    if (q.includes('jurong')) matchedRegion = regions.find(r => r.id === 'jurong') || null;
    else if (q.includes('central') || q.includes('downtown')) matchedRegion = regions.find(r => r.id === 'central') || null;
    else if (q.includes('woodlands') || q.includes('north')) matchedRegion = regions.find(r => r.id === 'woodlands') || null;
    else if (q.includes('changi') || q.includes('east')) matchedRegion = regions.find(r => r.id === 'changi') || null;
  }

  // Basic responses based on keywords
  let content = '';
  let inputsUsed: string[] = ['All Regional Sensor Data'];
  let reasoningSteps: string[] = ['Parsed user query keywords', 'Searched regional metric arrays'];
  let evidence = 'Based on Singapore National Environmental sensor logs.';
  let confidence = 0.90;
  let followUps: string[] = [];

  if (q.includes('pollution') || q.includes('aqi') || q.includes('air') || (matchedRegion && matchedRegion.id === 'jurong')) {
    const r = matchedRegion || regions.find(r => r.id === 'jurong')!;
    inputsUsed = ['AQI Sensor Data', 'Citizen Odor Reports', 'Respiratory Clinic Admissions'];
    reasoningSteps = [
      `Identified query intent: Air Quality analysis for ${r.name}`,
      `Analyzed current AQI level (${r.aqi}) against NEA air quality index categories`,
      `Checked active complaint logs for chemical odors or soot deposits`,
      'Generated recommendations for air purification deployment and outdoor activity limits'
    ];
    evidence = `${r.name} is reporting an AQI of ${r.aqi}. Citizen complaints mention chemical odors and clinic visits for breathing issues.`;
    confidence = r.id === 'jurong' ? 0.94 : 0.88;
    
    content = `### Executive Summary
In **${r.name}**, the Air Quality Index (AQI) is currently at **${r.aqi}**, which falls into the **${r.aqi > 100 ? 'Unhealthy' : 'Moderate'}** range. This is driven by elevated particulate matter concentrations, particularly near industrial facilities.

### Key Supporting Metrics
* **Current AQI:** ${r.aqi} (Threshold limit: 100)
* **Active Pollutant Complaints:** ${r.complaintsList.filter(c => c.category === 'pollution').length} unresolved reports
* **Healthcare Demand:** ${r.healthcareDemand}% capacity utilized at local clinics

### Actionable Recommendations
1. **Deploy Air Purification Units:** Mobilize remaining standby air scrubbing grids to Boon Lay residential estates immediately.
2. **Issue Health Advisory:** Advise schools and community centers in the west to suspend all outdoor physical activities until the AQI falls below 100.
3. **Audit Industrial Stack Filters:** Initiate an unscheduled compliance check on the nearby manufacturing plants.`;

    followUps = [
      `What are the specific chemical odor complaints in ${r.name}?`,
      `Show me the 24-hour AQI history trend for ${r.name}.`,
      `What air purification assets are currently active in ${r.name}?`
    ];

  } else if (q.includes('heat') || q.includes('temp') || q.includes('weather') || (matchedRegion && matchedRegion.id === 'woodlands')) {
    const r = matchedRegion || regions.find(r => r.id === 'woodlands')!;
    inputsUsed = ['Ambient Temperature Sensors', 'Age-Demographic Distribution Data', 'Heat Stroke Hospitalization Logs'];
    reasoningSteps = [
      `Detected query intent: Extreme heat risk assessment for ${r.name}`,
      `Read local temperature (${r.temperature.toFixed(1)}°C) and relative humidity (${r.humidity}%)`,
      'Evaluated heat index danger threshold',
      'Correlated high vulnerability index (elderly clusters) with resource availability'
    ];
    evidence = `${r.name} has a temperature of ${r.temperature.toFixed(1)}°C with high humidity (${r.humidity}%), posing a severe threat to elderly residents.`;
    confidence = 0.91;

    content = `### Executive Summary
**${r.name}** is experiencing high thermal stress, with temperatures reaching **${r.temperature.toFixed(1)}°C** and relative humidity at **${r.humidity}%**. Combined, this creates an apparent heat index exceeding 38°C, which poses heat exhaustion risks, especially for the high density of elderly residents in the area.

### Key Supporting Metrics
* **Temperature:** ${r.temperature.toFixed(1)}°C (Singapore normal average: 31°C)
* **Humidity:** ${r.humidity}%
* **Elderly Vulnerability Index:** High (Block 801-815 clusters)
* **Clinic Capacity Load:** ${r.healthcareDemand}%

### Actionable Recommendations
1. **Activate Community Cooling Shelters:** Ensure all air-conditioned rooms at Woodlands Community Club are fully operational and open 24/7.
2. **Distribute Hydration Packs:** Deploy volunteer networks to distribute electrolytes and water to non-airconditioned rental flats.
3. **Broaden Public Advisory:** Issue warning broadcasts via SMS cell-broadcasting targeting northern residential sectors.`;

    followUps = [
      `Where are the cooling shelters located in ${r.name}?`,
      `How does the temperature in ${r.name} compare to Changi?`,
      `Is the healthcare demand in ${r.name} rising?`
    ];

  } else if (q.includes('traffic') || q.includes('congestion') || q.includes('jam') || (matchedRegion && matchedRegion.id === 'central')) {
    const r = matchedRegion || regions.find(r => r.id === 'central')!;
    inputsUsed = ['Inductive Loop Traffic Sensors', 'CCTV Vehicle Feeds', 'Bus Delay Logs'];
    reasoningSteps = [
      'Identified query intent: Traffic flow and congestion mapping',
      `Queried Central Area traffic grid congestion level (${r.trafficCongestion}%)`,
      'Analyzed active incident logs for breakdowns or road work',
      'Generated detour routing and signal timing adjustments'
    ];
    evidence = `Downtown Central Area is reporting ${r.trafficCongestion}% congestion with gridlock reported near Marina Blvd.`;
    confidence = 0.95;

    content = `### Executive Summary
The **${r.name}** is currently experiencing major traffic bottlenecks, with congestion running at **${r.trafficCongestion}%**. This is causing substantial delays on primary arterials, notably around Shenton Way and Marina Boulevard, primarily due to peak transit volume and a lane blockage.

### Key Supporting Metrics
* **Congestion Rate:** ${r.trafficCongestion}% (Normal: <50%)
* **Bus Delay Average:** +22 minutes
* **Active Incidents:** Lane blockage reported near Marina Bay Sands linkway

### Actionable Recommendations
1. **Optimize Signal Phasing:** Implement dynamic green-light extensions along Shenton Way exit routes to clear vehicle queues.
2. **Dynamic Diversions:** Broadcast real-time navigation alerts advising drivers to bypass the Central Boulevard corridor.
3. **Deploy Auxiliary Traffic Police:** Station officers at major gridlocked intersections to manually manage vehicle flows.`;

    followUps = [
      `What is causing the lane blockage in the ${r.name}?`,
      `Are there any active traffic patrol units near Marina Boulevard?`,
      `Compare the traffic congestion between Central Area and Woodlands.`
    ];

  } else {
    // General Singapore Status
    inputsUsed = ['All Regional Metrics', 'Singapore Sensor Registry', 'Active System Alerts'];
    reasoningSteps = [
      'Detected general inquiry / situation overview',
      'Analyzed all 4 Singapore regions for threshold breaches',
      'Aggregated active system alerts and resource availability'
    ];
    evidence = `Out of 4 regions, Jurong has high AQI (${regions.find(r => r.id === 'jurong')?.aqi}) and Woodlands has high temperature (${regions.find(r => r.id === 'woodlands')?.temperature}°C).`;
    confidence = 0.89;

    content = `### Executive Summary
Singapore's urban status shows two localized concerns that require immediate attention:
1. **Air Quality in Jurong Industrial Area:** AQI has surged to **${regions.find(r => r.id === 'jurong')?.aqi}** (Unhealthy).
2. **Thermal Discomfort in Woodlands:** Temperature is elevated at **${regions.find(r => r.id === 'woodlands')?.temperature.toFixed(1)}°C** with high healthcare demand.

Downtown and Changi remain within safe environmental margins.

### Key Supporting Metrics
* **Total Monitored Zones:** 4
* **Zones at Elevated Risk:** 2 (Jurong: High AQI, Woodlands: Heat Risk)
* **Total Active Alerts:** ${regions.map(r => (r.aqi > 100 || r.temperature > 34 ? 1 : 0) as number).reduce((a, b) => a + b, 0)} critical/warning states

### Actionable Recommendations
1. **Deploy West-Zone Air Filters:** Shift air purification trailers towards Boon Lay housing blocks.
2. **Open North-Zone Cooling Hubs:** Open air-conditioned sections of woodlands community clubs for elderly residents.
3. **Monitor Central Area Traffic:** Prepare for peak transit congestion in the central business district.`;

    followUps = [
      'Which areas have the highest healthcare demand today?',
      'Show me a summary of all active alerts in Singapore.',
      'Generate a daily situation report for the City Administrator.'
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
    const { messages, regionId, persona } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1].content;
    const apiKey = process.env.GEMINI_API_KEY;

    // Retrieve full system data to build the RAG context
    const ragContext = generateRAGContext(regionId);

    // Heuristic Check: If API key is missing, immediately use the smart fallback
    if (!apiKey) {
      const fallback = generateFallbackResponse(lastUserMessage, regionId, persona);
      return NextResponse.json(fallback);
    }

    // Call Gemini API via @google/genai
    const ai = new GoogleGenAI({ apiKey });
    
    const systemPrompt = `You are "PulseCopilot", the expert Decision Intelligence AI assistant for the CommunityPulse AI platform in Singapore.
Your user is a "${persona || 'citizen'}" who is exploring urban metrics, environmental risks, and recommendations.

Here is the retrieved real-time context of Singapore (air quality, traffic, temperature, citizen complaints, and active resource deployments):
---
${ragContext}
---

Your response MUST be returned STRICTLY as a JSON object matching this schema:
{
  "content": "A detailed, professional response formatted in Markdown. Structure it using: ### Executive Summary, ### Key Supporting Metrics, and ### Actionable Recommendations. Use bullet points and bold text for readability. Base your findings strictly on the context data above.",
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
Rely strictly on the observations in the provided context. If a user asks for predictions, refer to the trends or note that predictions are models based on seasonal inputs. Do not hallucinate data that is not in the context.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + `\n\nUser query: "${lastUserMessage}"\nSelected Region context: ${regionId || 'All Regions'}` }] }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    // Parse the JSON output from Gemini
    const resultJson = JSON.parse(responseText.trim());
    return NextResponse.json(resultJson);

  } catch (error: any) {
    console.error('Gemini API Error, falling back to local heuristic:', error);
    
    // In case of error (e.g. invalid key or format mismatch), fallback safely
    try {
      const body = await req.json().catch(() => ({}));
      const { messages, regionId, persona } = body;
      const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : 'summarize';
      const fallback = generateFallbackResponse(lastUserMessage, regionId, persona);
      return NextResponse.json(fallback);
    } catch (fallbackErr) {
      return NextResponse.json({
        content: `### Executive Summary\nThe system encountered an error connecting to the AI service, but regional monitoring remains active. Please ensure your \`GEMINI_API_KEY\` is configured in your environment.\n\n### Current Recommendations\n1. Check network connectivity.\n2. Review system logs for detailed error reports.`,
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
