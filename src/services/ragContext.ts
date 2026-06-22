import { getLocalizedData, getActiveAlerts, getStaticRecommendations, DEFAULT_LOCATION } from './mockData';
import { UserLocation, RegionData } from '../types';

export const generateRAGContext = (
  selectedRegionId?: string, 
  location: UserLocation = DEFAULT_LOCATION,
  clientRegions?: RegionData[]
): string => {
  const regions = clientRegions || getLocalizedData(location);
  const alerts = getActiveAlerts(regions);
  
  const cityName = location.city || 'Local Area';
  const countryName = location.country || 'Global';

  let context = `## CURRENT SYSTEM STATUS (${cityName.toUpperCase()}, ${countryName.toUpperCase()})
Location Center: Lat=${location.latitude.toFixed(4)}, Lng=${location.longitude.toFixed(4)}
Generated at: ${new Date().toLocaleString()}
Total Regions Monitored: ${regions.length}
Active Critical Alerts: ${alerts.filter(a => a.severity === 'critical').length}
Active Warning Alerts: ${alerts.filter(a => a.severity === 'warning').length}

`;

  // Add overall metrics table
  context += `### REGIONAL METRICS SUMMARY (Fact Source Information Included)
| Region ID | Region Name | AQI | Temp (°C) | Traffic (%) | Healthcare Demand (%) | Data Source | Data Provider | Last Updated | Risk Level (Score) |
|---|---|---|---|---|---|---|---|---|---|
`;

  regions.forEach(r => {
    context += `| ${r.id} | ${r.name} | ${r.aqi} | ${r.temperature.toFixed(1)} | ${r.trafficCongestion}% | ${r.healthcareDemand}% | ${r.dataSourceType || 'simulated'} | ${r.dataProvider || 'Simulated Engine'} | ${r.dataLastUpdated || 'N/A'} | ${r.riskLevel.toUpperCase()} (${r.riskScore}/100) |\n`;
  });

  context += `\n`;

  // If a specific region is highlighted, add its detailed breakdown
  if (selectedRegionId) {
    const region = regions.find(r => r.id === selectedRegionId);
    if (region) {
      context += `### FOCUS REGION DETAILS: ${region.name.toUpperCase()}
Description: ${region.description}
Current Status:
- AQI: ${region.aqi} (${region.aqi > 100 ? 'UNHEALTHY' : 'MODERATE/GOOD'})
- Temperature: ${region.temperature.toFixed(1)}°C
- Humidity: ${region.humidity}%
- Traffic Congestion: ${region.trafficCongestion}%
- Healthcare Demand: ${region.healthcareDemand}%
- Sustainability Index: ${region.sustainabilityIndex}/100
- Community Risk Score: ${region.riskScore}/100 (Risk Level: ${region.riskLevel.toUpperCase()})

#### ACTIVE RESOURCES DEPLOYED:
${region.resourcesDeployed.length > 0 
  ? region.resourcesDeployed.map(res => `- ${res.name} (${res.type}): Status=${res.status.toUpperCase()}, Location="${res.location}", Qty=${res.quantity}`).join('\n')
  : 'No specialized resources currently deployed.'
}

#### CITIZEN COMPLAINTS (RECENT):
${region.complaintsList.length > 0
  ? region.complaintsList.map(comp => `- [${comp.status.toUpperCase()}][${comp.sentiment.toUpperCase()}] Category=${comp.category.toUpperCase()}: "${comp.title}" - ${comp.description} (${new Date(comp.timestamp).toLocaleTimeString()})`).join('\n')
  : 'No recent citizen complaints reported.'
}
\n`;
    }
  } else {
    // Add brief summary of all complaints and resources
    context += `### ACTIVE DEPLOYED RESOURCES SUMMARY
`;
    regions.forEach(r => {
      if (r.resourcesDeployed.length > 0) {
        context += `- **${r.name}**: ${r.resourcesDeployed.map(res => `${res.name} (${res.quantity}x ${res.type})`).join(', ')}\n`;
      }
    });
    
    context += `\n### RECENT CITIZEN COMPLAINTS (ALL REGIONS)
`;
    let complaintCount = 0;
    regions.forEach(r => {
      r.complaintsList.forEach(comp => {
        if (complaintCount < 5) {
          context += `- **${r.name}** [${comp.category.toUpperCase()}]: "${comp.title}" (${comp.status.toUpperCase()} - Sentiment: ${comp.sentiment.toUpperCase()})\n`;
          complaintCount++;
        }
      });
    });
    if (complaintCount === 0) context += 'No recent citizen complaints reported.\n';
    context += '\n';
  }

  // Add active alerts details
  context += `### ACTIVE SYSTEM ALERTS
`;
  if (alerts.length > 0) {
    alerts.forEach(alert => {
      context += `- [${alert.severity.toUpperCase()}] **${alert.regionName}** (${alert.type.toUpperCase()}): ${alert.message} *Recommended Action:* ${alert.suggestedAction}\n`;
    });
  } else {
    context += `No active critical or warning alerts detected across ${cityName}.\n`;
  }

  // Add predefined AI recommendations for grounding
  context += `\n### STANDARDIZED RECOMMENDATION BLUEPRINTS
`;
  regions.forEach(r => {
    const recs = getStaticRecommendations(r.id, regions);
    recs.forEach(rec => {
      context += `- **${r.name}** - Action: "${rec.title}" (Confidence: ${(rec.confidence * 100).toFixed(0)}%, Priority: ${rec.priority.toUpperCase()})
  Description: ${rec.description}
  Rationale: ${rec.reasoning.join(' ')}
  Inputs Used: ${rec.inputs.join(', ')}
`;
    });
  });

  return context;
};
