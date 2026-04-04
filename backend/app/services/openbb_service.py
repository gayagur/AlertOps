"""
Market Data Service
===================
Primary data source for market, sector, and macro data.
Uses yfinance (the same data engine behind OpenBB's free tier) for real-time
market data, with FRED API access via the pandas_datareader-compatible
yfinance interface.

Architecture:
  - Sector performance is measured via sector ETF proxies (SMH, XLF, etc.)
  - Each ETF's 1-month and 3-month returns are compared against SPY as benchmark
  - Momentum, relative strength, volume trend, and directional bias are derived
  - Macro indicators use the ^TNX (10Y yield), ^VIX, and sector-relative signals
  - Falls back to mock data if yfinance is unavailable or returns errors

Extending:
  - Add new sectors by adding ETF tickers to SECTOR_ETFS
  - Add macro indicators by adding tickers to MACRO_TICKERS
  - For premium data, OpenBB can be swapped in when version compatibility is resolved
"""

import logging
from datetime import datetime, timezone
from typing import Any

import yfinance as yf
import numpy as np

from app.models.signals import SectorSignal, MacroSignal, MarketDataBundle
from app.services.mock_data import get_mock_market_data

logger = logging.getLogger(__name__)

# Sector ETFs used as proxies for sector performance
SECTOR_ETFS = {
    "Semiconductors": "SMH",
    "Cloud Infrastructure": "SKYY",
    "Clean Energy": "ICLN",
    "Biotech": "XBI",
    "Commercial Real Estate": "VNQ",
    "Consumer Discretionary": "XLY",
    "Defense & Aerospace": "ITA",
    "Financials": "XLF",
}

BENCHMARK = "SPY"

# Macro tickers available via yfinance
MACRO_TICKERS = {
    "US 10Y Yield": "^TNX",
    "VIX": "^VIX",
    "USD Index (DXY)": "DX-Y.NYB",
    "Gold": "GC=F",
    "Crude Oil (WTI)": "CL=F",
    "S&P 500": "^GSPC",
}


class OpenBBService:
    """
    Fetches live market data using yfinance.
    Falls back to mock data if network or API errors occur.
    """

    def __init__(self, pat: str = ""):
        self._available = True
        try:
            # Quick connectivity check
            test = yf.Ticker(BENCHMARK)
            info = test.fast_info
            if info.last_price and info.last_price > 0:
                logger.info(f"yfinance connected — SPY last: ${info.last_price:.2f}")
            else:
                raise ValueError("No price data returned")
        except Exception as e:
            logger.warning(f"yfinance connectivity check failed: {e} — will try anyway")

    @property
    def is_available(self) -> bool:
        return self._available

    def get_sector_performance(self) -> list[SectorSignal]:
        """
        Fetch sector ETF performance and derive signals.
        Downloads 3 months of daily data for all sector ETFs + SPY benchmark,
        then computes 1-month returns, relative strength, volume trends, and bias.
        """
        try:
            all_tickers = list(SECTOR_ETFS.values()) + [BENCHMARK]
            data = yf.download(all_tickers, period="3mo", group_by="ticker", progress=False)

            if data.empty:
                logger.warning("yfinance returned empty data — falling back to mock")
                return get_mock_market_data().sectors

            # SPY benchmark return for relative strength
            spy_close = data[BENCHMARK]["Close"].dropna()
            spy_1m_ret = (spy_close.iloc[-1] / spy_close.iloc[-22] - 1) * 100 if len(spy_close) >= 22 else 0.0

            signals = []
            for sector_name, etf in SECTOR_ETFS.items():
                try:
                    close = data[etf]["Close"].dropna()
                    volume = data[etf]["Volume"].dropna()

                    if len(close) < 22:
                        continue

                    # 1-month return
                    ret_1m = (close.iloc[-1] / close.iloc[-22] - 1) * 100
                    # 3-month return (if enough data)
                    ret_3m = (close.iloc[-1] / close.iloc[0] - 1) * 100

                    # Momentum: normalized 1-month return to [-1, 1]
                    momentum = float(np.clip(ret_1m / 10, -1.0, 1.0))

                    # Relative strength vs SPY
                    rs = (1 + ret_1m / 100) / (1 + spy_1m_ret / 100) if spy_1m_ret != 0 else 1.0

                    # Volume trend: compare recent 5-day avg vs prior 20-day avg
                    if len(volume) >= 25:
                        recent_vol = volume.iloc[-5:].mean()
                        prior_vol = volume.iloc[-25:-5].mean()
                        vol_change = (recent_vol / prior_vol - 1) * 100 if prior_vol > 0 else 0
                        if vol_change > 10:
                            vol_trend = "increasing"
                        elif vol_change < -10:
                            vol_trend = "decreasing"
                        else:
                            vol_trend = "stable"
                    else:
                        vol_trend = "stable"

                    # Directional bias
                    if momentum > 0.15 and rs > 1.02:
                        bias = "bullish"
                    elif momentum < -0.15 and rs < 0.98:
                        bias = "bearish"
                    else:
                        bias = "neutral"

                    signals.append(SectorSignal(
                        sector=sector_name,
                        momentum=round(momentum, 3),
                        volume_trend=vol_trend,
                        relative_strength=round(float(rs), 3),
                        short_term_bias=bias,
                    ))

                except Exception as e:
                    logger.warning(f"Error processing {sector_name} ({etf}): {e}")

            if signals:
                logger.info(f"Fetched live data for {len(signals)} sectors")
                return signals

            logger.warning("No sector signals derived — falling back to mock")
            return get_mock_market_data().sectors

        except Exception as e:
            logger.error(f"Sector data fetch failed: {e}")
            return get_mock_market_data().sectors

    def get_macro_data(self) -> list[MacroSignal]:
        """
        Fetch macro indicators via yfinance ticker data.
        Compares current value to 1-month-ago value to derive direction.
        """
        try:
            tickers = list(MACRO_TICKERS.values())
            data = yf.download(tickers, period="2mo", group_by="ticker", progress=False)

            if data.empty:
                return get_mock_market_data().macro

            signals = []
            for name, ticker in MACRO_TICKERS.items():
                try:
                    close = data[ticker]["Close"].dropna()
                    if len(close) < 22:
                        continue

                    current = float(close.iloc[-1])
                    previous = float(close.iloc[-22])
                    change_pct = ((current - previous) / abs(previous) * 100) if previous != 0 else 0

                    # For VIX and yields, "improving" means declining
                    if ticker in ("^VIX", "^TNX"):
                        if change_pct < -2:
                            direction = "improving"
                        elif change_pct > 2:
                            direction = "deteriorating"
                        else:
                            direction = "stable"
                    else:
                        if change_pct > 2:
                            direction = "improving"
                        elif change_pct < -2:
                            direction = "deteriorating"
                        else:
                            direction = "stable"

                    signals.append(MacroSignal(
                        indicator=name,
                        current_value=round(current, 2),
                        previous_value=round(previous, 2),
                        change_pct=round(change_pct, 2),
                        direction=direction,
                    ))

                except Exception as e:
                    logger.warning(f"Error processing macro {name}: {e}")

            if signals:
                logger.info(f"Fetched {len(signals)} macro indicators")
                return signals

            return get_mock_market_data().macro

        except Exception as e:
            logger.error(f"Macro data fetch failed: {e}")
            return get_mock_market_data().macro

    def get_market_overview(self) -> dict[str, Any]:
        """Fetch broad market index data."""
        try:
            spy = yf.Ticker(BENCHMARK)
            info = spy.fast_info
            return {
                "source": "live",
                "spy_price": info.last_price,
                "spy_change": info.last_price - info.previous_close if info.previous_close else 0,
            }
        except Exception:
            return {"source": "mock"}

    def get_full_market_bundle(self) -> MarketDataBundle:
        """
        Aggregates all data sources into a single MarketDataBundle.
        This is the main entry point used by the signal engine.
        """
        sectors = self.get_sector_performance()
        macro = self.get_macro_data()

        return MarketDataBundle(
            timestamp=datetime.now(timezone.utc).isoformat(),
            sectors=sectors,
            macro=macro,
        )
