export interface Instrument {
  symbol: string;
  name: string;
  type: 'stock' | 'ETF';
  reason: string;
  risk: string;
  selection_score?: number;
  role?: string;
  factors?: Record<string, number>;
  why_selected?: string[];
  risk_notes?: string[];
}

export interface AllocationSuggestion {
  aggressive: string;
  moderate: string;
  conservative: string;
}

export interface RejectedAlternative {
  symbol: string;
  name: string;
  selection_score: number;
  reason_rejected: string;
}

export interface SectorRecommendation {
  sector: string;
  direction: 'bullish' | 'neutral' | 'bearish';
  confidence: number;
  time_horizon: 'short_term' | 'medium_term' | 'long_term';
  recommended_instruments: Instrument[];
  allocation_suggestion: AllocationSuggestion;
  why_now: string;
  key_drivers: string[];
  risks: string[];
  summary: string;
  profile_fit?: {
    conservative: string[];
    moderate: string[];
    aggressive: string[];
  };
  rejected_alternatives?: RejectedAlternative[];
  strategy_note?: string;
}

export interface PortfolioAllocation {
  sector: string;
  weight_pct: number;
  instrument: string;
  rationale: string;
}

export interface PortfolioStrategy {
  profile: 'aggressive' | 'moderate' | 'conservative';
  allocations: PortfolioAllocation[];
  cash_pct: number;
  summary: string;
}

export interface RecommendationsResponse {
  generated_at: string;
  market_context: string;
  top_recommendations: SectorRecommendation[];
  portfolio_strategy: PortfolioStrategy[];
  disclaimer: string;
}
