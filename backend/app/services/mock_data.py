from datetime import datetime, timezone
from app.schemas.analysis import (
    AnalysisResponse, Opportunity, MacroDriver, RiskItem, MarketOverview,
)
from app.models.signals import SectorSignal, MacroSignal, MarketDataBundle


def get_mock_market_data() -> MarketDataBundle:
    return MarketDataBundle(
        timestamp=datetime.now(timezone.utc).isoformat(),
        sectors=[
            SectorSignal(sector="Semiconductors", momentum=0.78, volume_trend="increasing", relative_strength=1.32, short_term_bias="bullish"),
            SectorSignal(sector="Cloud Infrastructure", momentum=0.65, volume_trend="increasing", relative_strength=1.18, short_term_bias="bullish"),
            SectorSignal(sector="Clean Energy", momentum=0.42, volume_trend="stable", relative_strength=0.95, short_term_bias="neutral"),
            SectorSignal(sector="Biotech", momentum=0.55, volume_trend="increasing", relative_strength=1.08, short_term_bias="bullish"),
            SectorSignal(sector="Commercial Real Estate", momentum=-0.22, volume_trend="decreasing", relative_strength=0.72, short_term_bias="bearish"),
            SectorSignal(sector="Consumer Discretionary", momentum=-0.15, volume_trend="stable", relative_strength=0.85, short_term_bias="neutral"),
            SectorSignal(sector="Defense & Aerospace", momentum=0.61, volume_trend="increasing", relative_strength=1.15, short_term_bias="bullish"),
            SectorSignal(sector="Financials", momentum=0.30, volume_trend="stable", relative_strength=0.98, short_term_bias="neutral"),
        ],
        macro=[
            MacroSignal(indicator="US 10Y Yield", current_value=4.28, previous_value=4.45, change_pct=-3.82, direction="improving"),
            MacroSignal(indicator="CPI YoY", current_value=3.1, previous_value=3.4, change_pct=-8.82, direction="improving"),
            MacroSignal(indicator="PMI Manufacturing", current_value=51.2, previous_value=49.8, change_pct=2.81, direction="improving"),
            MacroSignal(indicator="Consumer Confidence", current_value=104.7, previous_value=102.0, change_pct=2.65, direction="improving"),
            MacroSignal(indicator="USD Index (DXY)", current_value=103.8, previous_value=104.5, change_pct=-0.67, direction="stable"),
            MacroSignal(indicator="VIX", current_value=14.2, previous_value=16.8, change_pct=-15.48, direction="improving"),
        ],
    )


def get_mock_analysis() -> AnalysisResponse:
    return AnalysisResponse(
        generated_at=datetime.now(timezone.utc),
        overview=MarketOverview(
            bullish_count=4,
            bearish_count=1,
            neutral_count=3,
            strongest_signal="Semiconductors",
            highest_risk="Commercial Real Estate exposure to rate sensitivity",
            market_sentiment="risk_on",
            summary="Broad market conditions favor growth-oriented sectors. Declining yields and improving PMI data suggest an expanding economy with moderating inflation. Semiconductor and cloud infrastructure sectors show the strongest momentum, supported by sustained AI capital expenditure cycles.",
        ),
        top_opportunities=[
            Opportunity(
                name="Semiconductors",
                direction="bullish",
                confidence=87,
                time_horizon="medium_term",
                reasons=[
                    "AI infrastructure spending continues to accelerate across hyperscalers",
                    "Supply chain normalization improving margins for leading manufacturers",
                    "Strong order backlog visibility through next 2-3 quarters",
                    "Government incentive programs (CHIPS Act) driving domestic capacity expansion",
                ],
                risks=[
                    "Geopolitical tensions around Taiwan Strait could disrupt supply chains",
                    "Potential demand correction if AI investment cycle moderates",
                    "High valuations leave limited margin of safety",
                ],
                summary="The semiconductor sector remains the strongest conviction opportunity. AI-driven demand is structural, not cyclical, and order visibility provides earnings confidence. However, elevated valuations and geopolitical risk warrant position sizing discipline.",
            ),
            Opportunity(
                name="Cloud Infrastructure",
                direction="bullish",
                confidence=79,
                time_horizon="medium_term",
                reasons=[
                    "Enterprise cloud migration still in early-to-mid innings globally",
                    "AI workload demand creating new revenue streams for cloud providers",
                    "Improving unit economics as scale benefits compound",
                ],
                risks=[
                    "Margin pressure from aggressive infrastructure buildout",
                    "Regulatory scrutiny on market concentration",
                ],
                summary="Cloud infrastructure benefits from the same AI tailwinds as semiconductors but with more recurring revenue characteristics. Enterprise adoption curves suggest sustained multi-year growth runway.",
            ),
            Opportunity(
                name="Defense & Aerospace",
                direction="bullish",
                confidence=74,
                time_horizon="long_term",
                reasons=[
                    "Global defense budgets increasing amid geopolitical uncertainty",
                    "Multi-year procurement cycles provide earnings visibility",
                    "Modernization programs driving technology upgrade spending",
                ],
                risks=[
                    "Budget sequestration or political shifts could delay procurement",
                    "Supply chain constraints on specialized components",
                ],
                summary="Rising global security concerns are translating into durable defense budget increases. Long procurement cycles mean current order books support multi-year earnings growth, though political risk remains.",
            ),
            Opportunity(
                name="Biotech",
                direction="bullish",
                confidence=68,
                time_horizon="long_term",
                reasons=[
                    "GLP-1 drug class expanding addressable market beyond diabetes",
                    "AI-accelerated drug discovery reducing time-to-market",
                    "M&A activity increasing as large pharma seeks pipeline replenishment",
                ],
                risks=[
                    "Clinical trial failures can cause significant drawdowns",
                    "Drug pricing regulation remains an ongoing political risk",
                    "Higher sector volatility compared to other growth areas",
                ],
                summary="Biotech offers asymmetric upside driven by innovation in GLP-1 therapeutics and AI-assisted research. The sector is volatile but M&A premium potential provides a valuation floor for quality names.",
            ),
            Opportunity(
                name="Clean Energy",
                direction="neutral",
                confidence=52,
                time_horizon="long_term",
                reasons=[
                    "Policy support remains intact through IRA incentives",
                    "Declining costs of solar and battery storage improving project economics",
                ],
                risks=[
                    "Interest rate sensitivity impacts project financing costs",
                    "Political risk to subsidies in election cycles",
                    "Grid infrastructure bottlenecks limiting deployment speed",
                ],
                summary="Clean energy has long-term structural tailwinds but near-term headwinds from financing costs and political uncertainty. Selective positioning in companies with strong project backlogs is warranted over broad sector exposure.",
            ),
        ],
        macro_drivers=[
            MacroDriver(
                title="Inflation Moderating Toward Target",
                impact="positive",
                summary="CPI declining from 3.4% to 3.1% YoY suggests the disinflationary trend remains intact. This supports the case for rate cuts in the medium term, which would benefit growth equities and reduce discount rates.",
            ),
            MacroDriver(
                title="Manufacturing PMI Crosses Expansion Threshold",
                impact="positive",
                summary="PMI rising above 50 for the first time in several months signals manufacturing recovery. This is supportive for industrial and semiconductor sectors tied to physical production cycles.",
            ),
            MacroDriver(
                title="Treasury Yields Declining",
                impact="positive",
                summary="The 10Y yield falling from 4.45% to 4.28% eases financial conditions and supports equity valuations, particularly for longer-duration growth assets.",
            ),
            MacroDriver(
                title="VIX at Multi-Month Lows",
                impact="positive",
                summary="Volatility compression to 14.2 reflects institutional confidence in the current macro trajectory. Low VIX environments historically favor risk assets, though complacency risk exists.",
            ),
            MacroDriver(
                title="Geopolitical Tensions Persist",
                impact="mixed",
                summary="Ongoing tensions in multiple regions create tail risk for supply chains and energy markets. While not currently market-moving, escalation scenarios remain the primary left-tail risk.",
            ),
        ],
        risks=[
            RiskItem(
                title="Geopolitical Escalation",
                severity="high",
                category="Geopolitical",
                description="Escalation in key regions could disrupt semiconductor supply chains, energy markets, and global trade flows. Defense sector may benefit but broader market impact would be negative.",
            ),
            RiskItem(
                title="Inflation Re-acceleration",
                severity="medium",
                category="Macro",
                description="Services inflation remains sticky. Any re-acceleration would delay rate cuts and pressure growth equity valuations. Energy price spikes from geopolitical events are the most likely catalyst.",
            ),
            RiskItem(
                title="AI Investment Cycle Correction",
                severity="medium",
                category="Sector",
                description="Current AI capex levels may not be sustainable if monetization timelines extend. A correction in AI-related spending would disproportionately impact semiconductor and cloud sectors.",
            ),
            RiskItem(
                title="Commercial Real Estate Stress",
                severity="high",
                category="Financial",
                description="Office vacancy rates remain elevated and refinancing risks are increasing as loans originated at lower rates mature. Regional bank exposure to CRE portfolios could create contagion effects.",
            ),
            RiskItem(
                title="Election Policy Uncertainty",
                severity="medium",
                category="Political",
                description="Upcoming election cycles introduce uncertainty around tax policy, regulation, trade policy, and sector-specific subsidies. Markets typically see increased volatility in election periods.",
            ),
            RiskItem(
                title="Liquidity Tightening",
                severity="low",
                category="Macro",
                description="Quantitative tightening continues to reduce system liquidity. While currently orderly, any disruption to Treasury market functioning could trigger rapid risk-off moves.",
            ),
        ],
    )
