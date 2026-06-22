import { RegionData, Alert, Complaint, Resource, Recommendation } from '../types';

// Helper to generate coordinates and random values
const getPastHours = (hours: number): string[] => {
  const list = [];
  const now = new Date();
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    list.push(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }
  return list;
};

const getPastDays = (days: number): string[] => {
  const list = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    list.push(d.toLocaleDateString([], { month: 'short', day: 'numeric' }));
  }
  return list;
};

// Base configurations for Singapore regions
const BASE_REGIONS = {
  central: {
    id: 'central',
    name: 'Central Area (Downtown)',
    coordinates: [1.2879, 103.8519] as [number, number],
    description: 'High-density business district. Vulnerable to peak-hour traffic gridlocks and urban heat island effects.',
    aqi: 55,
    temperature: 31.5,
    humidity: 78,
    trafficCongestion: 75,
    healthcareDemand: 62,
    sustainabilityIndex: 68,
  },
  jurong: {
    id: 'jurong',
    name: 'Jurong Industrial Area',
    coordinates: [1.3404, 103.7090] as [number, number],
    description: 'Heavy industrial and manufacturing zone. Subject to elevated air pollutant levels and higher respiratory health reports.',
    aqi: 142, // Elevated by default for industrial context
    temperature: 33.0,
    humidity: 70,
    trafficCongestion: 45,
    healthcareDemand: 78,
    sustainabilityIndex: 45,
  },
  woodlands: {
    id: 'woodlands',
    name: 'Woodlands (North)',
    coordinates: [1.4382, 103.7890] as [number, number],
    description: 'Dense residential suburb with a high ratio of elderly citizens. Vulnerable to heatwave effects and local health surges.',
    aqi: 48,
    temperature: 34.8, // Approaching heatwave warning levels
    humidity: 82,
    trafficCongestion: 50,
    healthcareDemand: 82,
    sustainabilityIndex: 72,
  },
  changi: {
    id: 'changi',
    name: 'Changi (East Coast)',
    coordinates: [1.3644, 103.9915] as [number, number],
    description: 'Maritime and aviation hub. High wind circulation, excellent green infrastructure, and lower pollution levels.',
    aqi: 35,
    temperature: 29.5,
    humidity: 85,
    trafficCongestion: 30,
    healthcareDemand: 40,
    sustainabilityIndex: 85,
  }
};

// Pre-seeded complaints
const MOCK_COMPLAINTS: Record<string, Complaint[]> = {
  central: [
    {
      id: 'c-1',
      category: 'traffic',
      title: 'Severe gridlock near Marina Bay Sands linkway',
      description: 'Traffic has been at a complete standstill for the last 45 minutes due to malfunctioning traffic control lights.',
      status: 'in-progress',
      sentiment: 'negative',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
      id: 'c-2',
      category: 'infrastructure',
      title: 'Water logging in underground pedestrian passway',
      description: 'Minor flooding observed near Raffles Place MRT Exit B. Pedestrians are forced to detour.',
      status: 'pending',
      sentiment: 'negative',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
      id: 'c-3',
      category: 'other',
      title: 'Pavement obstruction on Cecil Street',
      description: 'Construction barriers left on the sidewalk are blocking wheelchair accessibility.',
      status: 'resolved',
      sentiment: 'neutral',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString()
    }
  ],
  jurong: [
    {
      id: 'j-1',
      category: 'pollution',
      title: 'Strong chemical odor detected near Jurong Island bridge',
      description: 'Highly pungent sulfur-like smell starting around 4:00 PM. Residents report throat irritation.',
      status: 'pending',
      sentiment: 'negative',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString()
    },
    {
      id: 'j-2',
      category: 'health',
      title: 'Surge in respiratory complaints at Jurong West clinic',
      description: 'Local general practitioners report a 40% increase in asthma/bronchitis treatments today alone.',
      status: 'in-progress',
      sentiment: 'negative',
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString()
    },
    {
      id: 'j-3',
      category: 'pollution',
      title: 'Dust and particulate deposit on cars',
      description: 'Fine gray soot accumulating on vehicles in Boon Lay. Suspect nearby cement plant filtration failure.',
      status: 'resolved',
      sentiment: 'negative',
      timestamp: new Date(Date.now() - 36 * 3600000).toISOString()
    }
  ],
  woodlands: [
    {
      id: 'w-1',
      category: 'health',
      title: 'Elderly resident collapsed due to high heat at void deck',
      description: 'Emergency services called to Block 812 Woodlands Street 81. Elderly citizens experiencing dizziness from the 35°C temperature.',
      status: 'resolved',
      sentiment: 'negative',
      timestamp: new Date(Date.now() - 1 * 3600000).toISOString()
    },
    {
      id: 'w-2',
      category: 'infrastructure',
      title: 'Air conditioning failure at Woodlands Community Club',
      description: 'The senior citizen corner AC unit has been broken for 3 days. It is extremely hot inside.',
      status: 'in-progress',
      sentiment: 'negative',
      timestamp: new Date(Date.now() - 6 * 3600000).toISOString()
    },
    {
      id: 'w-3',
      category: 'infrastructure',
      title: 'Request for cooling shelter spots',
      description: 'Are there public, air-conditioned places open during peak heat hours (12 PM - 4 PM)? Older blocks are very stuffy.',
      status: 'pending',
      sentiment: 'neutral',
      timestamp: new Date(Date.now() - 12 * 3600000).toISOString()
    }
  ],
  changi: [
    {
      id: 'ch-1',
      category: 'infrastructure',
      title: 'Changi Beach Park lighting out',
      description: 'Three lampposts along the beach pathway are not working, causing safety concerns for night runners.',
      status: 'in-progress',
      sentiment: 'neutral',
      timestamp: new Date(Date.now() - 8 * 3600000).toISOString()
    },
    {
      id: 'ch-2',
      category: 'traffic',
      title: 'Increased flight noise during early morning hours',
      description: 'Loud airplane noises between 2 AM and 4 AM disturb local sleep cycle in surrounding residences.',
      status: 'resolved',
      sentiment: 'negative',
      timestamp: new Date(Date.now() - 30 * 3600000).toISOString()
    }
  ]
};

// Pre-seeded resources
const MOCK_RESOURCES: Record<string, Resource[]> = {
  central: [
    { id: 'r-c1', name: 'Downtown Traffic Patrol Unit 4', type: 'traffic-patrol', status: 'active', location: 'Marina Blvd', quantity: 2 },
    { id: 'r-c2', name: 'Raffles Emergency Medical Team', type: 'medical-camp', status: 'standby', location: 'Shenton Way Clinic', quantity: 1 }
  ],
  jurong: [
    { id: 'r-j1', name: 'Mobile Air Purification Unit 12', type: 'air-purifier', status: 'active', location: 'Boon Lay Place', quantity: 5 },
    { id: 'r-j2', name: 'Jurong East Respiratory Clinic Camp', type: 'medical-camp', status: 'deploying', location: 'Jurong West St 51', quantity: 2 }
  ],
  woodlands: [
    { id: 'r-w1', name: 'Woodlands Community AC Oasis', type: 'cooling-center', status: 'active', location: 'Woodlands Civic Centre', quantity: 3 },
    { id: 'r-w2', name: 'Senior Health Outreach Team A', type: 'medical-camp', status: 'active', location: 'Block 802 Void Deck', quantity: 1 }
  ],
  changi: [
    { id: 'r-ch1', name: 'Coastal Eco-Transit Linkways', type: 'public-transit', status: 'active', location: 'Changi Village', quantity: 4 }
  ]
};

// Generate historical trend lines
const generateTrendData = (baseVal: number, trendType: 'sin' | 'cos' | 'linear', noise: number, length: number = 24) => {
  const list = [];
  const timeLabels = getPastHours(length);
  for (let i = 0; i < length; i++) {
    let factor = 0;
    if (trendType === 'sin') {
      factor = Math.sin((i / length) * Math.PI * 2);
    } else if (trendType === 'cos') {
      factor = Math.cos((i / length) * Math.PI * 2);
    } else {
      factor = (i - length / 2) / length;
    }
    const val = baseVal + factor * (baseVal * 0.25) + (Math.random() - 0.5) * noise;
    list.push(Math.round(Math.max(0, val)));
  }
  return list;
};

export const getSingaporeData = (): RegionData[] => {
  const hours = 24;
  const timeLabels = getPastHours(hours);

  return Object.values(BASE_REGIONS).map((base) => {
    // Generate custom history reflecting local traits
    const aqiTrend = generateTrendData(base.aqi, base.id === 'jurong' ? 'cos' : 'sin', base.id === 'jurong' ? 15 : 5, hours);
    const tempTrend = generateTrendData(base.temperature, 'sin', 0.8, hours);
    const trafficTrend = generateTrendData(base.trafficCongestion, 'cos', 10, hours);
    const healthTrend = generateTrendData(base.healthcareDemand, 'sin', 5, hours);
    const complaintsTrend = generateTrendData(MOCK_COMPLAINTS[base.id]?.length || 3, 'linear', 2, hours);

    const history = timeLabels.map((time, idx) => ({
      timestamp: time,
      aqi: aqiTrend[idx],
      temperature: Number(tempTrend[idx].toFixed(1)),
      traffic: Math.min(100, Math.max(0, trafficTrend[idx])),
      health: Math.min(100, Math.max(0, healthTrend[idx])),
      complaints: Math.max(0, complaintsTrend[idx]),
    }));

    // Calculate dynamic risk score based on AQI, Traffic, Heat, and Health demand
    // Formula weight: AQI (35%), Temperature (25%), Healthcare Demand (25%), Traffic Congestion (15%)
    // Normalized ranges: AQI high above 100, Temp high above 33
    const aqiWeight = Math.min(100, (base.aqi / 150) * 100) * 0.35;
    const tempWeight = Math.min(100, (Math.max(0, base.temperature - 26) / 10) * 100) * 0.25;
    const healthWeight = base.healthcareDemand * 0.25;
    const trafficWeight = base.trafficCongestion * 0.15;
    const riskScore = Math.round(aqiWeight + tempWeight + healthWeight + trafficWeight);

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskScore > 70) riskLevel = 'high';
    else if (riskScore > 40) riskLevel = 'medium';

    return {
      ...base,
      riskScore,
      riskLevel,
      metricsHistory: history,
      complaintsList: MOCK_COMPLAINTS[base.id] || [],
      complaintsCount: (MOCK_COMPLAINTS[base.id] || []).length,
      resourcesDeployed: MOCK_RESOURCES[base.id] || []
    };
  });
};

export const getActiveAlerts = (data: RegionData[]): Alert[] => {
  const alerts: Alert[] = [];
  data.forEach((region) => {
    // Check for high AQI
    if (region.aqi > 100) {
      alerts.push({
        id: `a-${region.id}-aqi`,
        regionId: region.id,
        regionName: region.name,
        type: 'aqi',
        severity: region.aqi > 130 ? 'critical' : 'warning',
        message: `Elevated PM2.5 levels detected. Current Air Quality Index (AQI) is ${region.aqi}.`,
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        metricValue: region.aqi,
        suggestedAction: 'Deploy mobile air purification arrays and issue respirators to field personnel.'
      });
    }

    // Check for Extreme Heat
    if (region.temperature > 34.0) {
      alerts.push({
        id: `a-${region.id}-heat`,
        regionId: region.id,
        regionName: region.name,
        type: 'heatwave',
        severity: region.temperature > 35.0 ? 'critical' : 'warning',
        message: `High thermal discomfort warning. Temperature reading at ${region.temperature.toFixed(1)}°C.`,
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        metricValue: region.temperature,
        suggestedAction: 'Activate public cooling centers, issue heat advisory bulletins, and check on elderly clusters.'
      });
    }

    // Check for Severe Traffic
    if (region.trafficCongestion > 70) {
      alerts.push({
        id: `a-${region.id}-traffic`,
        regionId: region.id,
        regionName: region.name,
        type: 'traffic',
        severity: region.trafficCongestion > 85 ? 'critical' : 'warning',
        message: `Severe traffic gridlock developing. Congestion coefficient at ${region.trafficCongestion}%.`,
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        metricValue: region.trafficCongestion,
        suggestedAction: 'Re-route bus links, adjust electronic road pricing, and dispatch auxiliary police for crossing control.'
      });
    }

    // Check for Healthcare surge
    if (region.healthcareDemand > 80) {
      alerts.push({
        id: `a-${region.id}-health`,
        regionId: region.id,
        regionName: region.name,
        type: 'healthcare',
        severity: 'critical',
        message: `Clinic saturation threshold breached. Healthcare utility rate at ${region.healthcareDemand}%.`,
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        metricValue: region.healthcareDemand,
        suggestedAction: 'Re-allocate nursing shifts to regional hubs and set up temporary clinic triages.'
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
      description: 'Active smoke and particulate pollution levels warrant regional deployment of industrial air cleaning grids.',
      reasoning: [
        `AQI of ${region.aqi} is in the unhealthy range.`,
        `Particulate count spikes correlate with 3 recent resident complaint reports.`,
        'Prevailing winds are carrying pollutants towards residential estates.'
      ],
      confidence: 0.92,
      priority: region.aqi > 130 ? 'high' : 'medium',
      actions: [
        'Deploy 3x Air Purification Arrays at key housing blocks.',
        'Issue advisory to suspend outdoor activities in local schools.'
      ],
      inputs: ['AQI Metric', 'Chemical Odor Complaints', 'Wind Vector Projections']
    });
  }

  if (region.temperature > 33.0) {
    recommendations.push({
      id: `rec-${region.id}-heat`,
      regionId: region.id,
      regionName: region.name,
      title: 'Mobilize Heat Shelter Protocols',
      description: 'Extreme thermal conditions require the activation of community cooling centers and vulnerable resident check-ins.',
      reasoning: [
        `Ambient temperature is ${region.temperature}°C, exceeding standard comfort levels.`,
        'Aging demographics in residential blocks are highly vulnerable to heat-induced stroke.',
        'Local healthcare facility reports rise in emergency admissions.'
      ],
      confidence: 0.88,
      priority: region.temperature > 34.5 ? 'high' : 'medium',
      actions: [
        'Open air-conditioned Cooling Shelters at local Community Clubs.',
        'Deploy volunteer teams to distribute hydration packets and check on isolated elderly.'
      ],
      inputs: ['Temperature Index', 'Demographic Heat Vulnerability Map', 'ER Admission Logs']
    });
  }

  if (region.trafficCongestion > 65) {
    recommendations.push({
      id: `rec-${region.id}-traffic`,
      regionId: region.id,
      regionName: region.name,
      title: 'Activate Intelligent Traffic Rerouting',
      description: 'Severe transit bottlenecks at primary intersections require dynamic traffic signal timing and automated diversion alerts.',
      reasoning: [
        `Traffic congestion metric reached ${region.trafficCongestion}%.`,
        'Active road work and vehicle breakdowns are blocking two critical lanes.',
        'Bus arrival delays are exceeding 25 minutes.'
      ],
      confidence: 0.95,
      priority: region.trafficCongestion > 80 ? 'high' : 'medium',
      actions: [
        'Activate real-time GPS navigation diversion warnings via transit APIs.',
        'Adjust traffic light frequency cycles on Shenton Way to prioritize gridlocked exit corridors.'
      ],
      inputs: ['Congestion Coefficient', 'CCTV Transit Feeds', 'Bus Scheduling APIs']
    });
  }

  // Default recommendation if region has low metrics
  if (recommendations.length === 0) {
    recommendations.push({
      id: `rec-${region.id}-default`,
      regionId: region.id,
      regionName: region.name,
      title: 'Routine Green Infrastructure Audit',
      description: 'The region is displaying optimal environmental metrics. Perform routine green asset auditing to maintain high sustainability.',
      reasoning: [
        `AQI (${region.aqi}), temperature (${region.temperature}°C) and traffic (${region.trafficCongestion}%) are within standard margins.`,
        `Sustainability Index is high at ${region.sustainabilityIndex}/100.`,
        'No critical incidents reported.'
      ],
      confidence: 0.98,
      priority: 'low',
      actions: [
        'Conduct monthly sensor calibration tests.',
        'Document local green practice benchmarks for inter-region study.'
      ],
      inputs: ['All Current Region Metrics', 'Sustainability Index Trends']
    });
  }

  return recommendations;
};
