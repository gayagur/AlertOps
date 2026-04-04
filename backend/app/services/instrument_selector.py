"""
Instrument Selector
===================
Deterministic scoring engine for ranking investment instruments.

Every instrument is scored against 6 weighted factors:
  sector_match     (0.30) — how well the instrument maps to the target sector
  market_leadership (0.20) — size, liquidity, and sector importance
  trend_strength   (0.15) — recent price momentum
  diversification  (0.15) — ETFs score higher when uncertainty is elevated
  risk_fit         (0.10) — volatility match for the target profile
  liquidity        (0.10) — tradability and market cap

All scores are 0–100. Final score = weighted sum.
"""

import logging
from typing import Literal

import yfinance as yf
import numpy as np

logger = logging.getLogger(__name__)

RiskProfile = Literal["conservative", "moderate", "aggressive"]

# Extended candidate universe — these are screened, liquid instruments
CANDIDATE_UNIVERSE: dict[str, list[dict]] = {
    "Semiconductors": [
        {"symbol": "SMH", "name": "VanEck Semiconductor ETF", "type": "ETF", "leadership": 95},
        {"symbol": "SOXX", "name": "iShares Semiconductor ETF", "type": "ETF", "leadership": 90},
        {"symbol": "NVDA", "name": "NVIDIA", "type": "stock", "leadership": 98},
        {"symbol": "AMD", "name": "Advanced Micro Devices", "type": "stock", "leadership": 85},
        {"symbol": "TSM", "name": "Taiwan Semiconductor", "type": "stock", "leadership": 92},
        {"symbol": "AVGO", "name": "Broadcom", "type": "stock", "leadership": 88},
        {"symbol": "INTC", "name": "Intel", "type": "stock", "leadership": 70},
    ],
    "Cloud Infrastructure": [
        {"symbol": "SKYY", "name": "First Trust Cloud Computing ETF", "type": "ETF", "leadership": 85},
        {"symbol": "XLK", "name": "Technology Select ETF", "type": "ETF", "leadership": 95},
        {"symbol": "MSFT", "name": "Microsoft", "type": "stock", "leadership": 98},
        {"symbol": "AMZN", "name": "Amazon (AWS)", "type": "stock", "leadership": 95},
        {"symbol": "GOOGL", "name": "Alphabet (GCP)", "type": "stock", "leadership": 93},
        {"symbol": "CRM", "name": "Salesforce", "type": "stock", "leadership": 78},
        {"symbol": "ORCL", "name": "Oracle", "type": "stock", "leadership": 75},
    ],
    "Clean Energy": [
        {"symbol": "ICLN", "name": "iShares Global Clean Energy ETF", "type": "ETF", "leadership": 90},
        {"symbol": "TAN", "name": "Invesco Solar ETF", "type": "ETF", "leadership": 80},
        {"symbol": "ENPH", "name": "Enphase Energy", "type": "stock", "leadership": 82},
        {"symbol": "FSLR", "name": "First Solar", "type": "stock", "leadership": 80},
        {"symbol": "NEE", "name": "NextEra Energy", "type": "stock", "leadership": 90},
        {"symbol": "SEDG", "name": "SolarEdge", "type": "stock", "leadership": 65},
    ],
    "Biotech": [
        {"symbol": "XBI", "name": "SPDR S&P Biotech ETF", "type": "ETF", "leadership": 90},
        {"symbol": "IBB", "name": "iShares Biotech ETF", "type": "ETF", "leadership": 88},
        {"symbol": "LLY", "name": "Eli Lilly", "type": "stock", "leadership": 98},
        {"symbol": "VRTX", "name": "Vertex Pharmaceuticals", "type": "stock", "leadership": 85},
        {"symbol": "REGN", "name": "Regeneron", "type": "stock", "leadership": 83},
        {"symbol": "MRNA", "name": "Moderna", "type": "stock", "leadership": 72},
        {"symbol": "AMGN", "name": "Amgen", "type": "stock", "leadership": 88},
    ],
    "Commercial Real Estate": [
        {"symbol": "VNQ", "name": "Vanguard Real Estate ETF", "type": "ETF", "leadership": 95},
        {"symbol": "XLRE", "name": "Real Estate Select ETF", "type": "ETF", "leadership": 88},
        {"symbol": "PLD", "name": "Prologis", "type": "stock", "leadership": 92},
        {"symbol": "AMT", "name": "American Tower", "type": "stock", "leadership": 88},
        {"symbol": "SPG", "name": "Simon Property Group", "type": "stock", "leadership": 80},
        {"symbol": "O", "name": "Realty Income", "type": "stock", "leadership": 82},
    ],
    "Consumer Discretionary": [
        {"symbol": "XLY", "name": "Consumer Discretionary Select ETF", "type": "ETF", "leadership": 95},
        {"symbol": "AMZN", "name": "Amazon", "type": "stock", "leadership": 98},
        {"symbol": "TSLA", "name": "Tesla", "type": "stock", "leadership": 85},
        {"symbol": "HD", "name": "Home Depot", "type": "stock", "leadership": 90},
        {"symbol": "NKE", "name": "Nike", "type": "stock", "leadership": 82},
        {"symbol": "MCD", "name": "McDonald's", "type": "stock", "leadership": 88},
        {"symbol": "COST", "name": "Costco", "type": "stock", "leadership": 87},
    ],
    "Defense & Aerospace": [
        {"symbol": "ITA", "name": "iShares US Aerospace & Defense ETF", "type": "ETF", "leadership": 92},
        {"symbol": "XAR", "name": "SPDR Aerospace & Defense ETF", "type": "ETF", "leadership": 85},
        {"symbol": "LMT", "name": "Lockheed Martin", "type": "stock", "leadership": 95},
        {"symbol": "RTX", "name": "RTX Corporation", "type": "stock", "leadership": 90},
        {"symbol": "NOC", "name": "Northrop Grumman", "type": "stock", "leadership": 88},
        {"symbol": "GD", "name": "General Dynamics", "type": "stock", "leadership": 85},
        {"symbol": "BA", "name": "Boeing", "type": "stock", "leadership": 80},
    ],
    "Financials": [
        {"symbol": "XLF", "name": "Financial Select Sector ETF", "type": "ETF", "leadership": 95},
        {"symbol": "KBE", "name": "SPDR S&P Bank ETF", "type": "ETF", "leadership": 82},
        {"symbol": "JPM", "name": "JPMorgan Chase", "type": "stock", "leadership": 98},
        {"symbol": "GS", "name": "Goldman Sachs", "type": "stock", "leadership": 90},
        {"symbol": "V", "name": "Visa", "type": "stock", "leadership": 92},
        {"symbol": "BRK-B", "name": "Berkshire Hathaway", "type": "stock", "leadership": 95},
        {"symbol": "BAC", "name": "Bank of America", "type": "stock", "leadership": 85},
    ],
}

# Weights for the scoring model
WEIGHTS = {
    "sector_match": 0.30,
    "market_leadership": 0.20,
    "trend_strength": 0.15,
    "diversification": 0.15,
    "risk_fit": 0.10,
    "liquidity": 0.10,
}


def get_sector_candidates(sector: str) -> list[dict]:
    """Get the full candidate universe for a sector."""
    return CANDIDATE_UNIVERSE.get(sector, [
        {"symbol": "SPY", "name": "SPDR S&P 500 ETF", "type": "ETF", "leadership": 99},
        {"symbol": "VTI", "name": "Vanguard Total Stock Market ETF", "type": "ETF", "leadership": 95},
        {"symbol": "QQQ", "name": "Invesco QQQ Trust", "type": "ETF", "leadership": 95},
    ])


def score_instrument(
    candidate: dict,
    sector_confidence: int,
    sector_direction: str,
    risk_profile: RiskProfile,
    trend_data: dict | None = None,
) -> dict:
    """
    Score a single instrument against all 6 factors.
    Returns the candidate dict enriched with factor scores and final score.
    """
    factors = {}

    # 1. Sector match (all candidates in the universe match; ETFs match slightly better)
    factors["sector_match"] = 90 if candidate["type"] == "ETF" else 85

    # 2. Market leadership (from predefined data)
    factors["market_leadership"] = candidate.get("leadership", 70)

    # 3. Trend strength (from live price data if available)
    if trend_data and candidate["symbol"] in trend_data:
        td = trend_data[candidate["symbol"]]
        # Normalize 1-month return to 0–100 score
        ret = td.get("return_1m", 0)
        if sector_direction == "bullish":
            factors["trend_strength"] = max(0, min(100, 50 + ret * 5))
        elif sector_direction == "bearish":
            factors["trend_strength"] = max(0, min(100, 50 - ret * 5))
        else:
            factors["trend_strength"] = max(0, min(100, 50 + abs(ret) * 2))
    else:
        factors["trend_strength"] = 60  # neutral default

    # 4. Diversification value
    if candidate["type"] == "ETF":
        # ETFs get higher diversification score, especially when confidence is low
        base = 90
        if sector_confidence < 60:
            base = 98  # strongly prefer ETFs
        elif sector_confidence < 75:
            base = 92
        factors["diversification"] = base
    else:
        factors["diversification"] = max(30, 70 - (100 - sector_confidence) * 0.5)

    # 5. Risk fit — match instrument volatility profile to risk appetite
    is_high_vol = candidate.get("leadership", 70) < 80  # proxy: less established = more volatile
    if risk_profile == "conservative":
        if candidate["type"] == "ETF":
            factors["risk_fit"] = 95
        elif is_high_vol:
            factors["risk_fit"] = 30
        else:
            factors["risk_fit"] = 60
    elif risk_profile == "moderate":
        factors["risk_fit"] = 75 if candidate["type"] == "ETF" else 70
    else:  # aggressive
        if candidate["type"] == "stock":
            factors["risk_fit"] = 85
        else:
            factors["risk_fit"] = 65

    # 6. Liquidity (proxy from leadership score — large caps = more liquid)
    factors["liquidity"] = min(100, candidate.get("leadership", 70) + 5)

    # Compute weighted final score
    final = sum(factors[k] * WEIGHTS[k] for k in WEIGHTS)

    return {
        **candidate,
        "factors": factors,
        "selection_score": round(final),
    }


def fetch_trend_data(symbols: list[str]) -> dict:
    """
    Fetch recent price data for scoring trend_strength factor.
    Returns dict of symbol -> {return_1m, return_1w, volatility}.
    """
    try:
        if not symbols:
            return {}
        data = yf.download(symbols, period="2mo", group_by="ticker", progress=False)
        if data.empty:
            return {}

        result = {}
        for sym in symbols:
            try:
                if len(symbols) == 1:
                    close = data["Close"].dropna()
                else:
                    close = data[sym]["Close"].dropna()

                if len(close) < 22:
                    continue

                ret_1m = float((close.iloc[-1] / close.iloc[-22] - 1) * 100)
                ret_1w = float((close.iloc[-1] / close.iloc[-5] - 1) * 100) if len(close) >= 5 else 0
                vol = float(close.pct_change().std() * np.sqrt(252) * 100) if len(close) > 5 else 20

                result[sym] = {
                    "return_1m": ret_1m,
                    "return_1w": ret_1w,
                    "volatility": vol,
                }
            except Exception:
                continue

        return result
    except Exception as e:
        logger.warning(f"Trend data fetch failed: {e}")
        return {}


def select_best_instruments(
    sector: str,
    confidence: int,
    direction: str,
    risk_profile: RiskProfile,
    trend_data: dict | None = None,
) -> tuple[list[dict], list[dict]]:
    """
    Score all candidates, rank them, and return (selected, rejected).

    Selection rules:
    - Conservative: 1 ETF, max 1 stock
    - Moderate: 1 ETF + 2 stocks
    - Aggressive: 1 ETF + 3 stocks
    - Confidence < 60: ETF only regardless of profile
    """
    candidates = get_sector_candidates(sector)

    # Score all
    scored = [
        score_instrument(c, confidence, direction, risk_profile, trend_data)
        for c in candidates
    ]

    # Split and sort by score
    etfs = sorted([s for s in scored if s["type"] == "ETF"], key=lambda x: x["selection_score"], reverse=True)
    stocks = sorted([s for s in scored if s["type"] == "stock"], key=lambda x: x["selection_score"], reverse=True)

    selected = []
    rejected = []

    if confidence < 60:
        # ETF-only mode
        selected = etfs[:1]
        rejected = etfs[1:] + stocks
    elif risk_profile == "conservative":
        selected = etfs[:1] + stocks[:1]
        rejected = etfs[1:] + stocks[1:]
    elif risk_profile == "moderate":
        selected = etfs[:1] + stocks[:2]
        rejected = etfs[1:] + stocks[2:]
    else:  # aggressive
        selected = etfs[:1] + stocks[:3]
        rejected = etfs[1:] + stocks[3:]

    return selected, rejected


def build_recommendation_bundle(
    sector: str,
    confidence: int,
    direction: str,
    trend_data: dict | None = None,
) -> dict:
    """
    Build a complete recommendation bundle with all 3 risk profiles.
    Returns instruments selected for each profile plus rejected alternatives.
    """
    results = {}
    for profile in ("conservative", "moderate", "aggressive"):
        selected, rejected = select_best_instruments(
            sector, confidence, direction, profile, trend_data
        )
        results[profile] = {
            "selected": selected,
            "rejected": rejected[:3],  # Top 3 rejected for "why not" section
        }

    return results
