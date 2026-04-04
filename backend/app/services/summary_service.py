"""
Summary Service
===============
Merges raw signal engine output with AI-generated explanations
into the final AnalysisResponse payload returned to the frontend.

If AI analysis is available, it enriches the signal data with
explanations, reasons, and summaries. If not, the raw signal
data is returned with generic descriptions.
"""

from datetime import datetime, timezone

from app.schemas.analysis import (
    AnalysisResponse, Opportunity, MacroDriver, RiskItem, MarketOverview,
)
from app.services.mock_data import get_mock_analysis


def merge_analysis(
    signal_opportunities: list[dict],
    signal_risks: list[dict],
    signal_overview: dict,
    ai_result: dict | None,
) -> AnalysisResponse:
    """
    Combine signal engine output with AI analysis into the final response.
    Falls back to signal-only data if AI result is None.
    """
    now = datetime.now(timezone.utc)

    if ai_result:
        return _build_from_ai(now, ai_result, signal_overview)

    return _build_from_signals(now, signal_opportunities, signal_risks, signal_overview)


def _build_from_ai(now: datetime, ai: dict, overview_data: dict) -> AnalysisResponse:
    """Build response using AI-enriched data."""
    opportunities = [
        Opportunity(
            name=o["name"],
            direction=o["direction"],
            confidence=o["confidence"],
            time_horizon=o.get("time_horizon", "medium_term"),
            reasons=o.get("reasons", []),
            risks=o.get("risks", []),
            summary=o.get("summary", ""),
        )
        for o in ai.get("opportunities", [])
    ]

    macro_drivers = [
        MacroDriver(
            title=d["title"],
            impact=d["impact"],
            summary=d["summary"],
        )
        for d in ai.get("macro_drivers", [])
    ]

    risks = [
        RiskItem(
            title=r["title"],
            severity=r["severity"],
            category=r.get("category", "Macro"),
            description=r.get("description", ""),
        )
        for r in ai.get("risks", [])
    ]

    overview = MarketOverview(
        bullish_count=overview_data.get("bullish_count", 0),
        bearish_count=overview_data.get("bearish_count", 0),
        neutral_count=overview_data.get("neutral_count", 0),
        strongest_signal=overview_data.get("strongest_signal", "N/A"),
        highest_risk=risks[0].title if risks else "None identified",
        market_sentiment=overview_data.get("market_sentiment", "mixed"),
        summary=ai.get("overview_summary", ""),
    )

    return AnalysisResponse(
        generated_at=now,
        overview=overview,
        top_opportunities=opportunities,
        macro_drivers=macro_drivers,
        risks=risks,
    )


def _build_from_signals(
    now: datetime,
    opportunities: list[dict],
    risks: list[dict],
    overview_data: dict,
) -> AnalysisResponse:
    """Build response from signal data only (no AI enrichment)."""
    opp_models = [
        Opportunity(
            name=o["name"],
            direction=o["direction"],
            confidence=o["confidence"],
            time_horizon="medium_term",
            reasons=[
                f"Momentum: {o.get('momentum', 'N/A')}",
                f"Relative strength: {o.get('relative_strength', 'N/A')}",
                f"Volume trend: {o.get('volume_trend', 'N/A')}",
            ],
            risks=["AI analysis unavailable — limited context"],
            summary=f"{o['name']} shows {o['direction']} signals with {o['confidence']}% confidence based on quantitative factors.",
        )
        for o in opportunities
    ]

    risk_models = [
        RiskItem(
            title=r["title"],
            severity=r.get("severity", "medium"),
            category=r.get("category", "Macro"),
            description=f"Signal-derived risk factor. Change: {r.get('change_pct', r.get('momentum', 'N/A'))}",
        )
        for r in risks
    ]

    overview = MarketOverview(
        bullish_count=overview_data.get("bullish_count", 0),
        bearish_count=overview_data.get("bearish_count", 0),
        neutral_count=overview_data.get("neutral_count", 0),
        strongest_signal=overview_data.get("strongest_signal", "N/A"),
        highest_risk=risk_models[0].title if risk_models else "None identified",
        market_sentiment=overview_data.get("market_sentiment", "mixed"),
        summary="Market analysis generated from quantitative signals. AI enrichment unavailable.",
    )

    return AnalysisResponse(
        generated_at=now,
        overview=overview,
        top_opportunities=opp_models,
        macro_drivers=[],
        risks=risk_models,
    )


def get_fallback_analysis() -> AnalysisResponse:
    """Complete fallback when all services are down."""
    return get_mock_analysis()
