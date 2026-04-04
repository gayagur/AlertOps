"""
Recommendation Service
======================
Generates investment instrument recommendations based on sector signals.

Key principles:
- Instruments come from a predefined mapping, NEVER invented by the LLM
- Confidence < 60 → cautious language, ETF-only suggestions
- High risk → emphasize diversified ETFs over single stocks
- Always include at least one ETF per sector
- Limit to top 3 sectors to avoid overconcentration
"""

import json
import logging
from datetime import datetime, timezone

from app.schemas.analysis import Opportunity
from app.schemas.recommendations import (
    RecommendationsResponse,
    SectorRecommendation,
    Instrument,
    AllocationSuggestion,
    PortfolioAllocation,
    PortfolioStrategy,
)
from app.services.ai_analysis_service import AIAnalysisService

logger = logging.getLogger(__name__)

# Predefined sector → instrument mapping
# These are well-known, liquid instruments — never hallucinated
SECTOR_INSTRUMENTS: dict[str, list[dict]] = {
    "Semiconductors": [
        {"symbol": "SMH", "name": "VanEck Semiconductor ETF", "type": "ETF"},
        {"symbol": "NVDA", "name": "NVIDIA", "type": "stock"},
        {"symbol": "AMD", "name": "Advanced Micro Devices", "type": "stock"},
        {"symbol": "TSM", "name": "Taiwan Semiconductor", "type": "stock"},
        {"symbol": "AVGO", "name": "Broadcom", "type": "stock"},
    ],
    "Cloud Infrastructure": [
        {"symbol": "SKYY", "name": "First Trust Cloud Computing ETF", "type": "ETF"},
        {"symbol": "MSFT", "name": "Microsoft", "type": "stock"},
        {"symbol": "AMZN", "name": "Amazon (AWS)", "type": "stock"},
        {"symbol": "GOOGL", "name": "Alphabet (GCP)", "type": "stock"},
        {"symbol": "CRM", "name": "Salesforce", "type": "stock"},
    ],
    "Clean Energy": [
        {"symbol": "ICLN", "name": "iShares Global Clean Energy ETF", "type": "ETF"},
        {"symbol": "ENPH", "name": "Enphase Energy", "type": "stock"},
        {"symbol": "FSLR", "name": "First Solar", "type": "stock"},
        {"symbol": "NEE", "name": "NextEra Energy", "type": "stock"},
    ],
    "Biotech": [
        {"symbol": "XBI", "name": "SPDR S&P Biotech ETF", "type": "ETF"},
        {"symbol": "LLY", "name": "Eli Lilly", "type": "stock"},
        {"symbol": "VRTX", "name": "Vertex Pharmaceuticals", "type": "stock"},
        {"symbol": "REGN", "name": "Regeneron", "type": "stock"},
        {"symbol": "MRNA", "name": "Moderna", "type": "stock"},
    ],
    "Commercial Real Estate": [
        {"symbol": "VNQ", "name": "Vanguard Real Estate ETF", "type": "ETF"},
        {"symbol": "PLD", "name": "Prologis", "type": "stock"},
        {"symbol": "AMT", "name": "American Tower", "type": "stock"},
        {"symbol": "SPG", "name": "Simon Property Group", "type": "stock"},
    ],
    "Consumer Discretionary": [
        {"symbol": "XLY", "name": "Consumer Discretionary Select ETF", "type": "ETF"},
        {"symbol": "AMZN", "name": "Amazon", "type": "stock"},
        {"symbol": "TSLA", "name": "Tesla", "type": "stock"},
        {"symbol": "HD", "name": "Home Depot", "type": "stock"},
        {"symbol": "NKE", "name": "Nike", "type": "stock"},
    ],
    "Defense & Aerospace": [
        {"symbol": "ITA", "name": "iShares US Aerospace & Defense ETF", "type": "ETF"},
        {"symbol": "LMT", "name": "Lockheed Martin", "type": "stock"},
        {"symbol": "RTX", "name": "RTX Corporation", "type": "stock"},
        {"symbol": "NOC", "name": "Northrop Grumman", "type": "stock"},
        {"symbol": "GD", "name": "General Dynamics", "type": "stock"},
    ],
    "Financials": [
        {"symbol": "XLF", "name": "Financial Select Sector ETF", "type": "ETF"},
        {"symbol": "JPM", "name": "JPMorgan Chase", "type": "stock"},
        {"symbol": "GS", "name": "Goldman Sachs", "type": "stock"},
        {"symbol": "V", "name": "Visa", "type": "stock"},
        {"symbol": "BRK-B", "name": "Berkshire Hathaway", "type": "stock"},
    ],
}

# Fallback for unknown sectors
DEFAULT_INSTRUMENTS = [
    {"symbol": "SPY", "name": "SPDR S&P 500 ETF", "type": "ETF"},
    {"symbol": "VTI", "name": "Vanguard Total Stock Market ETF", "type": "ETF"},
    {"symbol": "QQQ", "name": "Invesco QQQ Trust", "type": "ETF"},
]

RECOMMENDATION_PROMPT = """You are a senior investment research analyst producing institutional-grade recommendations.

You are given sector opportunity data with confidence scores and market signals.
Your job is to explain WHY specific instruments fit each opportunity.

CRITICAL RULES:
- You must ONLY use the exact symbols provided in the instruments list below
- Do NOT invent or suggest any symbols not in the list
- Do NOT provide specific price targets
- This is research analysis, NOT financial advice
- Be balanced — always mention risks alongside opportunities
- If confidence < 60, use cautious language and recommend ETFs over individual stocks
- Keep reasoning specific, data-driven, and professional

SECTOR OPPORTUNITIES:
{opportunities}

AVAILABLE INSTRUMENTS PER SECTOR:
{instruments}

MACRO CONTEXT:
{macro_context}

For each sector (limit to top 3 by confidence), produce JSON:
{{
  "recommendations": [
    {{
      "sector": "<sector name>",
      "recommended_instruments": [
        {{
          "symbol": "<from provided list only>",
          "type": "<stock|ETF>",
          "reason": "<1-2 sentence why this fits>",
          "risk": "<1 sentence key risk>"
        }}
      ],
      "allocation_suggestion": {{
        "aggressive": "<X-Y% of portfolio>",
        "moderate": "<X-Y%>",
        "conservative": "<X-Y%>"
      }},
      "why_now": "<2-3 sentences on timing>",
      "key_drivers": ["<driver 1>", "<driver 2>", "<driver 3>"],
      "risks": ["<risk 1>", "<risk 2>"],
      "summary": "<2-3 sentence institutional summary>"
    }}
  ],
  "portfolio_strategy": [
    {{
      "profile": "aggressive",
      "allocations": [
        {{"sector": "<name>", "weight_pct": <number>, "instrument": "<primary symbol>", "rationale": "<1 sentence>"}}
      ],
      "cash_pct": <number>,
      "summary": "<1-2 sentence strategy summary>"
    }},
    {{
      "profile": "moderate",
      "allocations": [...],
      "cash_pct": <number>,
      "summary": "..."
    }},
    {{
      "profile": "conservative",
      "allocations": [...],
      "cash_pct": <number>,
      "summary": "..."
    }}
  ],
  "market_context": "<2-3 sentence overall market assessment>"
}}

Select 2-4 instruments per sector. Always include the ETF. For confidence < 60, only recommend the ETF.
Portfolio allocations must sum to 100 (including cash)."""


def get_instruments_for_sector(sector: str) -> list[dict]:
    """Get predefined instruments for a sector."""
    return SECTOR_INSTRUMENTS.get(sector, DEFAULT_INSTRUMENTS)


def select_instruments(
    sector: str, confidence: int, direction: str
) -> list[Instrument]:
    """
    Select appropriate instruments based on confidence and direction.
    Low confidence → ETF only. High risk → prefer ETFs.
    """
    available = get_instruments_for_sector(sector)

    if confidence < 60 or direction == "bearish":
        # Conservative: ETF only
        etfs = [i for i in available if i["type"] == "ETF"]
        return [
            Instrument(
                symbol=i["symbol"],
                name=i["name"],
                type=i["type"],
                reason=f"Diversified {sector.lower()} exposure with reduced single-stock risk",
                risk="Sector-level drawdown risk remains",
            )
            for i in etfs[:2]
        ]

    # Include ETF + top stocks
    selected = []
    etfs = [i for i in available if i["type"] == "ETF"]
    stocks = [i for i in available if i["type"] == "stock"]

    for etf in etfs[:1]:
        selected.append(Instrument(
            symbol=etf["symbol"],
            name=etf["name"],
            type="ETF",
            reason=f"Broad {sector.lower()} exposure with built-in diversification",
            risk="Sector concentration risk",
        ))

    for stock in stocks[:3]:
        selected.append(Instrument(
            symbol=stock["symbol"],
            name=stock["name"],
            type="stock",
            reason=f"Leading {sector.lower()} company",
            risk="Single-stock volatility and company-specific risk",
        ))

    return selected


def get_allocation(confidence: int, direction: str) -> AllocationSuggestion:
    """Derive allocation suggestion from confidence score."""
    if confidence >= 80:
        return AllocationSuggestion(
            aggressive="15–25%", moderate="10–15%", conservative="5–10%"
        )
    elif confidence >= 65:
        return AllocationSuggestion(
            aggressive="10–15%", moderate="5–10%", conservative="3–7%"
        )
    elif confidence >= 50:
        return AllocationSuggestion(
            aggressive="5–10%", moderate="3–7%", conservative="2–5%"
        )
    else:
        return AllocationSuggestion(
            aggressive="3–5%", moderate="2–3%", conservative="0–2%"
        )


def build_fallback_recommendations(
    opportunities: list[Opportunity],
    macro_summary: str,
) -> RecommendationsResponse:
    """Build recommendations without AI enrichment."""
    # Sort by confidence, take top 3
    ranked = sorted(opportunities, key=lambda o: o.confidence, reverse=True)[:3]

    recs = []
    for opp in ranked:
        instruments = select_instruments(opp.name, opp.confidence, opp.direction)
        allocation = get_allocation(opp.confidence, opp.direction)

        recs.append(SectorRecommendation(
            sector=opp.name,
            direction=opp.direction,
            confidence=opp.confidence,
            time_horizon=opp.time_horizon,
            recommended_instruments=instruments,
            allocation_suggestion=allocation,
            why_now=opp.summary,
            key_drivers=opp.reasons[:3],
            risks=opp.risks[:2],
            summary=opp.summary,
        ))

    # Build simple portfolio strategies
    strategies = _build_portfolio_strategies(recs)

    return RecommendationsResponse(
        generated_at=datetime.now(timezone.utc),
        market_context=macro_summary,
        top_recommendations=recs,
        portfolio_strategy=strategies,
        disclaimer="This analysis is for informational purposes only and does not constitute financial advice. Past performance does not guarantee future results.",
    )


async def build_ai_recommendations(
    opportunities: list[Opportunity],
    macro_summary: str,
    ai_service: AIAnalysisService,
) -> RecommendationsResponse:
    """Build recommendations with AI enrichment."""
    ranked = sorted(opportunities, key=lambda o: o.confidence, reverse=True)[:3]

    # Prepare instrument lists for the prompt
    instruments_map = {}
    for opp in ranked:
        instruments_map[opp.name] = get_instruments_for_sector(opp.name)

    opp_data = [
        {
            "sector": o.name,
            "direction": o.direction,
            "confidence": o.confidence,
            "time_horizon": o.time_horizon,
            "reasons": o.reasons,
            "risks": o.risks,
        }
        for o in ranked
    ]

    try:
        from openai import AsyncOpenAI
        from app.core.config import get_settings

        settings = get_settings()
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        prompt = RECOMMENDATION_PROMPT.format(
            opportunities=json.dumps(opp_data, indent=2),
            instruments=json.dumps(instruments_map, indent=2),
            macro_context=macro_summary,
        )

        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are an institutional investment research analyst. Respond only with valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=4000,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        ai_data = json.loads(content)

        return _parse_ai_recommendations(ai_data, ranked, macro_summary)

    except Exception as e:
        logger.error(f"AI recommendation generation failed: {e}")
        return build_fallback_recommendations(opportunities, macro_summary)


def _parse_ai_recommendations(
    ai_data: dict,
    opportunities: list[Opportunity],
    macro_summary: str,
) -> RecommendationsResponse:
    """Parse AI response into RecommendationsResponse."""
    recs = []
    opp_map = {o.name: o for o in opportunities}

    for rec_data in ai_data.get("recommendations", []):
        sector = rec_data.get("sector", "")
        opp = opp_map.get(sector)
        if not opp:
            continue

        # Validate instruments against our predefined list
        valid_symbols = {i["symbol"] for i in get_instruments_for_sector(sector)}
        instruments = []
        for inst in rec_data.get("recommended_instruments", []):
            if inst.get("symbol") in valid_symbols:
                instr_info = next(
                    (i for i in get_instruments_for_sector(sector) if i["symbol"] == inst["symbol"]),
                    None,
                )
                instruments.append(Instrument(
                    symbol=inst["symbol"],
                    name=instr_info["name"] if instr_info else inst["symbol"],
                    type=inst.get("type", "stock"),
                    reason=inst.get("reason", ""),
                    risk=inst.get("risk", ""),
                ))

        if not instruments:
            instruments = select_instruments(sector, opp.confidence, opp.direction)

        alloc = rec_data.get("allocation_suggestion", {})
        allocation = AllocationSuggestion(
            aggressive=alloc.get("aggressive", "5–10%"),
            moderate=alloc.get("moderate", "3–7%"),
            conservative=alloc.get("conservative", "2–5%"),
        )

        recs.append(SectorRecommendation(
            sector=sector,
            direction=opp.direction,
            confidence=opp.confidence,
            time_horizon=opp.time_horizon,
            recommended_instruments=instruments,
            allocation_suggestion=allocation,
            why_now=rec_data.get("why_now", opp.summary),
            key_drivers=rec_data.get("key_drivers", opp.reasons[:3]),
            risks=rec_data.get("risks", opp.risks[:2]),
            summary=rec_data.get("summary", opp.summary),
        ))

    # Parse portfolio strategies
    strategies = []
    for strat in ai_data.get("portfolio_strategy", []):
        allocations = []
        for a in strat.get("allocations", []):
            allocations.append(PortfolioAllocation(
                sector=a.get("sector", ""),
                weight_pct=a.get("weight_pct", 0),
                instrument=a.get("instrument", ""),
                rationale=a.get("rationale", ""),
            ))
        strategies.append(PortfolioStrategy(
            profile=strat.get("profile", "moderate"),
            allocations=allocations,
            cash_pct=strat.get("cash_pct", 20),
            summary=strat.get("summary", ""),
        ))

    if not strategies:
        strategies = _build_portfolio_strategies(recs)

    return RecommendationsResponse(
        generated_at=datetime.now(timezone.utc),
        market_context=ai_data.get("market_context", macro_summary),
        top_recommendations=recs,
        portfolio_strategy=strategies,
        disclaimer="This analysis is for informational purposes only and does not constitute financial advice. Past performance does not guarantee future results.",
    )


def _build_portfolio_strategies(recs: list[SectorRecommendation]) -> list[PortfolioStrategy]:
    """Build portfolio strategies from recommendations."""
    profiles = [
        ("aggressive", 10),
        ("moderate", 25),
        ("conservative", 40),
    ]
    strategies = []

    for profile, cash in profiles:
        remaining = 100 - cash
        per_sector = remaining // max(len(recs), 1)

        allocations = []
        for rec in recs:
            etf = next((i for i in rec.recommended_instruments if i.type == "ETF"), None)
            primary = etf.symbol if etf else rec.recommended_instruments[0].symbol if rec.recommended_instruments else "SPY"
            allocations.append(PortfolioAllocation(
                sector=rec.sector,
                weight_pct=per_sector,
                instrument=primary,
                rationale=f"{rec.direction.title()} outlook with {rec.confidence}% confidence",
            ))

        strategies.append(PortfolioStrategy(
            profile=profile,
            allocations=allocations,
            cash_pct=cash,
            summary=f"{profile.title()} portfolio with {cash}% cash reserve and balanced sector exposure.",
        ))

    return strategies
