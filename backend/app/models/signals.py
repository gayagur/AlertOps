from pydantic import BaseModel
from typing import Literal


class SectorSignal(BaseModel):
    sector: str
    momentum: float
    volume_trend: Literal["increasing", "decreasing", "stable"]
    relative_strength: float
    short_term_bias: Literal["bullish", "neutral", "bearish"]


class MacroSignal(BaseModel):
    indicator: str
    current_value: float
    previous_value: float
    change_pct: float
    direction: Literal["improving", "deteriorating", "stable"]


class MarketDataBundle(BaseModel):
    sectors: list[SectorSignal]
    macro: list[MacroSignal]
    timestamp: str
