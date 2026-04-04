export type Direction = 'bullish' | 'neutral' | 'bearish';
export type TimeHorizon = 'short_term' | 'medium_term' | 'long_term';
export type Impact = 'positive' | 'negative' | 'mixed';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Sentiment = 'risk_on' | 'risk_off' | 'mixed';

export interface Opportunity {
  name: string;
  direction: Direction;
  confidence: number;
  time_horizon: TimeHorizon;
  reasons: string[];
  risks: string[];
  summary: string;
}

export interface MacroDriver {
  title: string;
  impact: Impact;
  summary: string;
}

export interface RiskItem {
  title: string;
  severity: Severity;
  category: string;
  description: string;
}

export interface MarketOverview {
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
  strongest_signal: string;
  highest_risk: string;
  market_sentiment: Sentiment;
  summary: string;
}

export interface AnalysisResponse {
  generated_at: string;
  overview: MarketOverview;
  top_opportunities: Opportunity[];
  macro_drivers: MacroDriver[];
  risks: RiskItem[];
}
