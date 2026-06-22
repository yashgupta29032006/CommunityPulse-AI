export type RiskLevel = 'low' | 'medium' | 'high';

export interface Complaint {
  id: string;
  category: 'pollution' | 'traffic' | 'health' | 'infrastructure' | 'other';
  title: string;
  description: string;
  status: 'resolved' | 'pending' | 'in-progress';
  sentiment: 'positive' | 'neutral' | 'negative';
  timestamp: string;
}

export interface Resource {
  id: string;
  name: string;
  type: 'medical-camp' | 'cooling-center' | 'traffic-patrol' | 'air-purifier' | 'public-transit';
  status: 'active' | 'standby' | 'deploying';
  location: string;
  quantity: number;
}

export interface MetricPoint {
  timestamp: string;
  aqi: number;
  temperature: number;
  traffic: number;
  health: number;
  complaints: number;
}

export interface RegionData {
  id: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  description: string;
  aqi: number;
  temperature: number;
  humidity: number;
  trafficCongestion: number; // 0 to 100
  healthcareDemand: number; // 0 to 100
  complaintsCount: number;
  sustainabilityIndex: number; // 0 to 100
  riskLevel: RiskLevel;
  riskScore: number; // 0 to 100
  metricsHistory: MetricPoint[];
  complaintsList: Complaint[];
  resourcesDeployed: Resource[];
}

export interface Alert {
  id: string;
  regionId: string;
  regionName: string;
  type: 'aqi' | 'heatwave' | 'traffic' | 'healthcare' | 'complaints';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  metricValue: number;
  suggestedAction: string;
}

export interface Recommendation {
  id: string;
  regionId: string;
  regionName: string;
  title: string;
  description: string;
  reasoning: string[];
  confidence: number; // 0 to 1
  priority: 'low' | 'medium' | 'high';
  actions: string[];
  inputs: string[];
}

export interface ExplainabilityData {
  confidence: number;
  inputsUsed: string[];
  reasoningSteps: string[];
  evidence: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  explainability?: ExplainabilityData;
}

export type UserPersona = 'citizen' | 'ngo' | 'admin';

export interface UserLocation {
  latitude: number;
  longitude: number;
  country: string;
  state?: string;
  city?: string;
  locality?: string;
  displayName?: string;
}
