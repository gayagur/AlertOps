export type EventType = 'alert' | 'launch_report' | 'impact' | 'interception' | 'official_update';
export type SourceType = 'official' | 'reported' | 'derived';
export type Confidence = 'official' | 'verified' | 'unverified';

export interface Incident {
  id: string;
  timestamp: string;
  region: string;
  city?: string;
  eventType: EventType;
  count?: number;
  sourceName: string;
  sourceType: SourceType;
  confidence: Confidence;
  title?: string;
  description?: string;
}

export interface RegionStat {
  region: string;
  alerts: number;
  impacts: number;
  interceptions: number;
  peakHour: number;
  last24hAlerts: number;
  last7dAlerts: number;
}

export interface OfficialUpdate {
  id: string;
  timestamp: string;
  title: string;
  body: string;
  sourceName: string;
  sourceType: SourceType;
  category: 'alert' | 'guidance' | 'update' | 'all_clear';
}

export interface GuidanceItem {
  id: string;
  title: string;
  body: string;
  region?: string;
  issuedAt: string;
  sourceName: string;
}

export interface TimeSeriesPoint {
  date: string;
  alerts: number;
  impacts: number;
  interceptions: number;
}

export interface HeatmapCell {
  region: string;
  hour: number;
  value: number;
}

export interface DashboardOverview {
  totalAlerts: number;
  totalImpacts: number;
  totalInterceptions: number;
  mostAffectedRegion: string;
  peakActivityHour: number;
  last24hAlerts: number;
  last7dAlerts: number;
  lastUpdated: string;
  sourceName: string;
}
