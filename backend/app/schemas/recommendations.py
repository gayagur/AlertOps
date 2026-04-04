from pydantic import BaseModel
from typing import Literal
from datetime import datetime


class Instrument(BaseModel):
    symbol: str
    name: str
    type: Literal["stock", "ETF"]
    reason: str
    risk: str


class AllocationSuggestion(BaseModel):
    aggressive: str
    moderate: str
    conservative: str


class SectorRecommendation(BaseModel):
    sector: str
    direction: Literal["bullish", "neutral", "bearish"]
    confidence: int
    time_horizon: Literal["short_term", "medium_term", "long_term"]
    recommended_instruments: list[Instrument]
    allocation_suggestion: AllocationSuggestion
    why_now: str
    key_drivers: list[str]
    risks: list[str]
    summary: str


class PortfolioAllocation(BaseModel):
    sector: str
    weight_pct: int
    instrument: str
    rationale: str


class PortfolioStrategy(BaseModel):
    profile: Literal["aggressive", "moderate", "conservative"]
    allocations: list[PortfolioAllocation]
    cash_pct: int
    summary: str


class RecommendationsResponse(BaseModel):
    generated_at: datetime
    market_context: str
    top_recommendations: list[SectorRecommendation]
    portfolio_strategy: list[PortfolioStrategy]
    disclaimer: str
