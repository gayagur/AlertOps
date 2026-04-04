from pydantic import BaseModel
from typing import Literal
from datetime import datetime


class Opportunity(BaseModel):
    name: str
    direction: Literal["bullish", "neutral", "bearish"]
    confidence: int
    time_horizon: Literal["short_term", "medium_term", "long_term"]
    reasons: list[str]
    risks: list[str]
    summary: str


class MacroDriver(BaseModel):
    title: str
    impact: Literal["positive", "negative", "mixed"]
    summary: str


class RiskItem(BaseModel):
    title: str
    severity: Literal["low", "medium", "high", "critical"]
    category: str
    description: str


class MarketOverview(BaseModel):
    bullish_count: int
    bearish_count: int
    neutral_count: int
    strongest_signal: str
    highest_risk: str
    market_sentiment: Literal["risk_on", "risk_off", "mixed"]
    summary: str


class AnalysisResponse(BaseModel):
    generated_at: datetime
    overview: MarketOverview
    top_opportunities: list[Opportunity]
    macro_drivers: list[MacroDriver]
    risks: list[RiskItem]


class AnalyzeRequest(BaseModel):
    focus_sectors: list[str] | None = None
    time_horizon: Literal["short_term", "medium_term", "long_term"] | None = None
