"""
Signal Engine
=============
Derives internal signals from raw market data.
Computes directional bias, confidence scores, and sector rankings.

This is pure logic — no external API calls. It takes a MarketDataBundle
and produces structured signals that can be consumed by the AI layer.
"""

from app.models.signals import MarketDataBundle, SectorSignal, MacroSignal
from app.schemas.analysis import Opportunity, MarketOverview, RiskItem


def compute_confidence(sector: SectorSignal, macro_context: list[MacroSignal]) -> int:
    """
    Compute a confidence score (0-100) for a sector signal.
    Weights: momentum (40%), relative strength (30%), macro alignment (30%).
    """
    # Momentum contribution (0-40 points)
    momentum_score = max(0, min(40, int((sector.momentum + 1) / 2 * 40)))

    # Relative strength contribution (0-30 points)
    rs_score = max(0, min(30, int((sector.relative_strength - 0.5) / 1.0 * 30)))

    # Macro alignment: how many macro signals support growth (0-30 points)
    improving_count = sum(1 for m in macro_context if m.direction == "improving")
    macro_score = int(improving_count / max(len(macro_context), 1) * 30)

    return max(0, min(100, momentum_score + rs_score + macro_score))


def derive_opportunities(data: MarketDataBundle) -> list[dict]:
    """
    Convert raw sector signals into ranked opportunity dicts.
    Returns data suitable for AI enrichment (reasons/summary will be added by LLM).
    """
    opportunities = []
    for sector in data.sectors:
        conf = compute_confidence(sector, data.macro)
        opportunities.append({
            "name": sector.sector,
            "direction": sector.short_term_bias,
            "confidence": conf,
            "momentum": sector.momentum,
            "relative_strength": sector.relative_strength,
            "volume_trend": sector.volume_trend,
        })

    # Sort by confidence descending
    opportunities.sort(key=lambda x: x["confidence"], reverse=True)
    return opportunities


def compute_overview(data: MarketDataBundle) -> dict:
    """Compute aggregate market overview statistics."""
    bullish = sum(1 for s in data.sectors if s.short_term_bias == "bullish")
    bearish = sum(1 for s in data.sectors if s.short_term_bias == "bearish")
    neutral = len(data.sectors) - bullish - bearish

    strongest = max(data.sectors, key=lambda s: s.momentum)
    weakest = min(data.sectors, key=lambda s: s.momentum)

    improving_macro = sum(1 for m in data.macro if m.direction == "improving")
    if improving_macro > len(data.macro) * 0.6:
        sentiment = "risk_on"
    elif improving_macro < len(data.macro) * 0.3:
        sentiment = "risk_off"
    else:
        sentiment = "mixed"

    return {
        "bullish_count": bullish,
        "bearish_count": bearish,
        "neutral_count": neutral,
        "strongest_signal": strongest.sector,
        "weakest_signal": weakest.sector,
        "market_sentiment": sentiment,
    }


def identify_risks(data: MarketDataBundle) -> list[dict]:
    """Identify risk factors from deteriorating macro signals and bearish sectors."""
    risks = []
    for macro in data.macro:
        if macro.direction == "deteriorating":
            risks.append({
                "title": f"{macro.indicator} Deterioration",
                "category": "Macro",
                "severity": "high" if abs(macro.change_pct) > 5 else "medium",
                "change_pct": macro.change_pct,
            })

    for sector in data.sectors:
        if sector.short_term_bias == "bearish":
            risks.append({
                "title": f"{sector.sector} Weakness",
                "category": "Sector",
                "severity": "high" if sector.momentum < -0.4 else "medium",
                "momentum": sector.momentum,
            })

    return risks
