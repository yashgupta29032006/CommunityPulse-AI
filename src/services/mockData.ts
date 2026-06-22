import { RegionData, Alert, Complaint, Resource, Recommendation, UserLocation } from '../types';

// Default failsafe location (Singapore) if geolocating fails
export const DEFAULT_LOCATION: UserLocation = {
  latitude: 1.3521,
  longitude: 103.8198,
  city: 'Singapore',
  state: 'Singapore',
  country: 'Singapore',
  displayName: 'Singapore'
};

const getPastHours = (hours: number): string[] => {
  const list = [];
  const now = new Date();
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    list.push(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }
  return list;
};

// Check if a location is near coast based on metadata or name
const isCoastalLocation = (location: UserLocation): boolean => {
  const name = (location.displayName || '').toLowerCase();
  const city = (location.city || '').toLowerCase();
  const country = (location.country || '').toLowerCase();
  
  const coastalKeywords = ['beach', 'coast', 'harbour', 'harbor', 'bay', 'marina', 'port', 'island', 'sea', 'ocean', 'singapore', 'sydney', 'mumbai', 'hong kong', 'changi'];
  
  return coastalKeywords.some(keyword => name.includes(keyword) || city.includes(keyword) || country.includes(keyword));
};

// Dynamic Sub-region Archetypes Generator
export const getLocalizedData = (location: UserLocation = DEFAULT_LOCATION): RegionData[] => {
  const lat = location.latitude;
  const lng = location.longitude;
  const cityName = location.city || 'Local Area';
  const isCoastal = isCoastalLocation(location);

  const hours = 24;
  const timeLabels = getPastHours(hours);

  // Define 4 dynamic region profiles based on city
  const profiles = [
    {
      id: 'downtown',
      name: `${cityName} Downtown`,
      coordinates: [lat, lng] as [number, number],
      description: `High-density commercial core of ${cityName}. Prone to rush-hour gridlocks and urban heat island effects.`,
      aqi: 58,
      temperature: 31.2,
      humidity: 75,
      trafficCongestion: 78,
      healthcareDemand: 60,
      sustainabilityIndex: 65,
      type: 'downtown'
    },
    {
      id: 'industrial',
      name: `${cityName} Industrial Zone`,
      coordinates: [lat + 0.012, lng - 0.018] as [number, number],
      description: `Manufacturing and logistics hub near ${cityName}. Characterized by higher atmospheric particulate counts.`,
      aqi: 135,
      temperature: 32.8,
      humidity: 68,
      trafficCongestion: 40,
      healthcareDemand: 75,
      sustainabilityIndex: 48,
      type: 'industrial'
    },
    {
      id: 'residential',
      name: `${cityName} Residential Suburb`,
      coordinates: [lat - 0.015, lng + 0.012] as [number, number],
      description: `Highly populated residential sector. Features critical senior citizen clusters susceptible to heat waves.`,
      aqi: 45,
      temperature: 34.6, // Elevated to trigger warnings
      humidity: 80,
      trafficCongestion: 52,
      healthcareDemand: 82, // Saturation point
      sustainabilityIndex: 75,
      type: 'residential'
    },
    {
      id: 'innovation',
      name: isCoastal ? `${cityName} Marina Waterfront` : `${cityName} Innovation Tech Park`,
      coordinates: [lat + 0.018, lng + 0.020] as [number, number],
      description: isCoastal 
        ? `Coastal transit and maritime precinct in ${cityName}. Elevated humidity and high wind dispersal.`
        : `Technology and university district in ${cityName}. Rich green landscaping and lower traffic baselines.`,
      aqi: 32,
      temperature: 29.8,
      humidity: isCoastal ? 84 : 72,
      trafficCongestion: 30,
      healthcareDemand: 38,
      sustainabilityIndex: 82,
      type: isCoastal ? 'coastal' : 'tech'
    }
  ];

  return profiles.map((p) => {
    // Generate simulated histories
    const generateTrendData = (baseVal: number, trendType: 'sin' | 'cos' | 'linear', noise: number) => {
      const list = [];
      for (let i = 0; i < hours; i++) {
        let factor = 0;
        if (trendType === 'sin') {
          factor = Math.sin((i / hours) * Math.PI * 2);
        } else if (trendType === 'cos') {
          factor = Math.cos((i / hours) * Math.PI * 2);
        } else {
          factor = (i - hours / 2) / hours;
        }
        const val = baseVal + factor * (baseVal * 0.22) + (Math.random() - 0.5) * noise;
        list.push(Math.round(Math.max(0, val)));
      }
      return list;
    };

    const aqiTrend = generateTrendData(p.aqi, p.id === 'industrial' ? 'cos' : 'sin', p.id === 'industrial' ? 12 : 4);
    const tempTrend = generateTrendData(p.temperature, 'sin', 0.6);
    const trafficTrend = generateTrendData(p.trafficCongestion, 'cos', 8);
    const healthTrend = generateTrendData(p.healthcareDemand, 'sin', 4);
    const complaintsTrend = generateTrendData(3, 'linear', 1.5);

    const history = timeLabels.map((time, idx) => ({
      timestamp: time,
      aqi: aqiTrend[idx],
      temperature: Number(tempTrend[idx].toFixed(1)),
      traffic: Math.min(100, Math.max(0, trafficTrend[idx])),
      health: Math.min(100, Math.max(0, healthTrend[idx])),
      complaints: Math.max(0, complaintsTrend[idx]),
    }));

    // Calculate dynamic risk score
    const aqiWeight = Math.min(100, (p.aqi / 150) * 100) * 0.35;
    const tempWeight = Math.min(100, (Math.max(0, p.temperature - 26) / 10) * 100) * 0.25;
    const healthWeight = p.healthcareDemand * 0.25;
    const trafficWeight = p.trafficCongestion * 0.15;
    const riskScore = Math.round(aqiWeight + tempWeight + healthWeight + trafficWeight);

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskScore > 70) riskLevel = 'high';
    else if (riskScore > 40) riskLevel = 'medium';

    // Localized dynamic complaints list
    const complaintsList: Complaint[] = [];
    if (p.id === 'downtown') {
      complaintsList.push(
        {
          id: `c-${p.id}-1`,
          category: 'traffic',
          title: `Transit gridlock in ${cityName} downtown sector`,
          description: `Severe peak traffic blockages reported near the central business district linkways.`,
          status: 'in-progress',
          sentiment: 'negative',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString()
        },
        {
          id: `c-${p.id}-2`,
          category: 'infrastructure',
          title: `Blocked pedestrian walkways`,
          description: `Construction barriers are blocking major commercial pathways.`,
          status: 'pending',
          sentiment: 'neutral',
          timestamp: new Date(Date.now() - 4 * 3600000).toISOString()
        }
      );
    } else if (p.id === 'industrial') {
      complaintsList.push(
        {
          id: `c-${p.id}-1`,
          category: 'pollution',
          title: `Chemical air emission odor in ${cityName} industrial sector`,
          description: `Strong sulfur smell reported by residents living near the heavy manufacturing border.`,
          status: 'pending',
          sentiment: 'negative',
          timestamp: new Date(Date.now() - 40 * 60000).toISOString()
        },
        {
          id: `c-${p.id}-2`,
          category: 'health',
          title: `Rise in local general health treatment load`,
          description: `Clinics report a 35% spike in asthmatic/respiratory nebulizer treatments.`,
          status: 'in-progress',
          sentiment: 'negative',
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString()
        }
      );
    } else if (p.id === 'residential') {
      complaintsList.push(
        {
          id: `c-${p.id}-1`,
          category: 'health',
          title: `Heat-related fatigue reported in residential park area`,
          description: `Elderly residents experiencing symptoms of heat stress due to high afternoon temperatures.`,
          status: 'resolved',
          sentiment: 'negative',
          timestamp: new Date(Date.now() - 1 * 3600000).toISOString()
        },
        {
          id: `c-${p.id}-2`,
          category: 'infrastructure',
          title: `AC failure at local senior recreational center`,
          description: `Air-conditioning units are down, creating stuffy conditions inside the community hall.`,
          status: 'in-progress',
          sentiment: 'negative',
          timestamp: new Date(Date.now() - 6 * 3600000).toISOString()
        }
      );
    } else {
      complaintsList.push({
        id: `c-${p.id}-1`,
        category: 'infrastructure',
        title: `Outage of path illumination lights`,
        description: `Local pathways are dark at night, raising safety complaints.`,
        status: 'pending',
        sentiment: 'neutral',
        timestamp: new Date(Date.now() - 12 * 3600000).toISOString()
      });
    }

    // Localized dynamic resources
    const resourcesDeployed: Resource[] = [];
    if (p.id === 'downtown') {
      resourcesDeployed.push({
        id: `res-${p.id}-1`,
        name: `Transit Patrol Team`,
        type: 'traffic-patrol',
        status: 'active',
        location: `${cityName} CBD`,
        quantity: 2
      });
    } else if (p.id === 'industrial') {
      resourcesDeployed.push({
        id: `res-${p.id}-1`,
        name: `Air Purification Unit`,
        type: 'air-purifier',
        status: 'active',
        location: 'Industrial Boundary',
        quantity: 3
      });
    } else if (p.id === 'residential') {
      resourcesDeployed.push({
        id: `res-${p.id}-1`,
        name: `Woodlands AC Oasis (Mock)`,
        type: 'cooling-center',
        status: 'active',
        location: `Community Hall`,
        quantity: 1
      });
    }

    return {
      id: p.id,
      name: p.name,
      coordinates: p.coordinates,
      description: p.description,
      aqi: p.aqi,
      temperature: p.temperature,
      humidity: p.humidity,
      trafficCongestion: p.trafficCongestion,
      healthcareDemand: p.healthcareDemand,
      complaintsCount: complaintsList.length,
      sustainabilityIndex: p.sustainabilityIndex,
      riskLevel,
      riskScore,
      metricsHistory: history,
      complaintsList,
      resourcesDeployed
    };
  });
};

export const getActiveAlerts = (data: RegionData[]): Alert[] => {
  const alerts: Alert[] = [];
  data.forEach((region) => {
    if (region.aqi > 100) {
      alerts.push({
        id: `alert-${region.id}-aqi`,
        regionId: region.id,
        regionName: region.name,
        type: 'aqi',
        severity: region.aqi > 130 ? 'critical' : 'warning',
        message: `High pollution levels in ${region.name}. Current AQI is ${region.aqi}.`,
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        metricValue: region.aqi,
        suggestedAction: 'Deploy active air purification grids and advise residents to limit heavy exertion.'
      });
    }

    if (region.temperature > 34.0) {
      alerts.push({
        id: `alert-${region.id}-temp`,
        regionId: region.id,
        regionName: region.name,
        type: 'heatwave',
        severity: region.temperature > 35.0 ? 'critical' : 'warning',
        message: `Severe heatwave condition in ${region.name}. Temperature has peaked at ${region.temperature.toFixed(1)}°C.`,
        timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
        metricValue: region.temperature,
        suggestedAction: 'Open community cooling shelters, deploy hydration packs, and monitor elder safety.'
      });
    }

    if (region.trafficCongestion > 70) {
      alerts.push({
        id: `alert-${region.id}-traffic`,
        regionId: region.id,
        regionName: region.name,
        type: 'traffic',
        severity: region.trafficCongestion > 85 ? 'critical' : 'warning',
        message: `Heavy vehicle gridlock reported in ${region.name}. Congestion density is ${region.trafficCongestion}%.`,
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        metricValue: region.trafficCongestion,
        suggestedAction: 'Re-route local transit loops, adjust smart highway pricing, and dispatch field control.'
      });
    }
  });
  return alerts;
};

export const getStaticRecommendations = (regionId: string, data: RegionData[]): Recommendation[] => {
  const region = data.find((r) => r.id === regionId);
  if (!region) return [];

  const recommendations: Recommendation[] = [];

  if (region.aqi > 100) {
    recommendations.push({
      id: `rec-${region.id}-aqi`,
      regionId: region.id,
      regionName: region.name,
      title: 'Deploy Air Purification Arrays',
      description: `Elevated particulate indices in ${region.name} warrant rapid deployment of mobile air purification grids.`,
      reasoning: [
        `AQI of ${region.aqi} exceeds healthy standard thresholds.`,
        'Particulate spikes correspond with recent citizen odor complaints.',
        'Prevailing winds are transporting pollutants to residential zones.'
      ],
      confidence: 0.90,
      priority: region.aqi > 130 ? 'high' : 'medium',
      actions: [
        'Deploy 3x Air Purification Arrays at key housing blocks.',
        'Issue advisory to suspend outdoor activities in local schools.'
      ],
      inputs: ['AQI Telemetry', 'Citizen Odor Reports', 'Local Wind Flow Model']
    });
  }

  if (region.temperature > 33.0) {
    recommendations.push({
      id: `rec-${region.id}-heat`,
      regionId: region.id,
      regionName: region.name,
      title: 'Mobilize Heat Shelter Protocols',
      description: `Extreme temperature indices in ${region.name} require opening regional cooling centers.`,
      reasoning: [
        `Ambient temperature is ${region.temperature}°C, exceeding standard comfort levels.`,
        'Vulnerable elderly demographics in local suburbs face heatstroke hazards.',
        'Local healthcare clinic utilities report rise in heat-stress admissions.'
      ],
      confidence: 0.88,
      priority: region.temperature > 34.5 ? 'high' : 'medium',
      actions: [
        'Open air-conditioned Cooling Shelters at local community clubs.',
        'Deploy outreach teams with hydration packs to visit isolated elderly.'
      ],
      inputs: ['Temperature Index', 'Elderly Demographic Density', 'Clinic Admissions Logs']
    });
  }

  if (region.trafficCongestion > 65) {
    recommendations.push({
      id: `rec-${region.id}-traffic`,
      regionId: region.id,
      regionName: region.name,
      title: 'Activate Intelligent Traffic Rerouting',
      description: `Congestion bottlenecks in ${region.name} demand traffic signal timing modifications and navigation diversions.`,
      reasoning: [
        `Transit congestion metric has reached ${region.trafficCongestion}%.`,
        'Active vehicle breakdowns are restricting critical road lanes.',
        'Public transit arrival delays exceed 20 minutes.'
      ],
      confidence: 0.95,
      priority: region.trafficCongestion > 80 ? 'high' : 'medium',
      actions: [
        'Push real-time navigation alerts to municipal transit apps.',
        'Modify light frequencies on major corridors to clear bottlenecks.'
      ],
      inputs: ['Congestion Coefficient', 'Municipal Transit Feeds', 'GPS Congestion Logs']
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: `rec-${region.id}-default`,
      regionId: region.id,
      regionName: region.name,
      title: 'Routine Environmental Audit',
      description: `Environmental telemetry in ${region.name} is currently optimal. Perform standard maintenance audits.`,
      reasoning: [
        `AQI (${region.aqi}), temperature (${region.temperature}°C) and congestion (${region.trafficCongestion}%) are within safety limits.`,
        `Sustainability Index is strong at ${region.sustainabilityIndex}/100.`,
        'No emergency indicators are active.'
      ],
      confidence: 0.97,
      priority: 'low',
      actions: [
        'Execute monthly sensor calibration check.',
        'Document local green practice benchmarks for inter-region study.'
      ],
      inputs: ['All Current Region Metrics', 'Sustainability Index Trends']
    });
  }

  return recommendations;
};
