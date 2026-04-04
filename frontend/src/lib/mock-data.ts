import type { AnalysisResponse } from '@/types/analysis';

export const mockAnalysis: AnalysisResponse = {
  generated_at: new Date().toISOString(),
  overview: {
    bullish_count: 4,
    bearish_count: 1,
    neutral_count: 3,
    strongest_signal: 'Semiconductors',
    highest_risk: 'Commercial Real Estate exposure to rate sensitivity',
    market_sentiment: 'risk_on',
    summary:
      'Broad market conditions favor growth-oriented sectors. Declining yields and improving PMI data suggest an expanding economy with moderating inflation. Semiconductor and cloud infrastructure sectors show the strongest momentum, supported by sustained AI capital expenditure cycles.',
  },
  top_opportunities: [
    {
      name: 'Semiconductors',
      direction: 'bullish',
      confidence: 87,
      time_horizon: 'medium_term',
      reasons: [
        'AI infrastructure spending continues to accelerate across hyperscalers',
        'Supply chain normalization improving margins for leading manufacturers',
        'Strong order backlog visibility through next 2-3 quarters',
        'Government incentive programs (CHIPS Act) driving domestic capacity expansion',
      ],
      risks: [
        'Geopolitical tensions around Taiwan Strait could disrupt supply chains',
        'Potential demand correction if AI investment cycle moderates',
        'High valuations leave limited margin of safety',
      ],
      summary:
        'The semiconductor sector remains the strongest conviction opportunity. AI-driven demand is structural, not cyclical, and order visibility provides earnings confidence. However, elevated valuations and geopolitical risk warrant position sizing discipline.',
    },
    {
      name: 'Cloud Infrastructure',
      direction: 'bullish',
      confidence: 79,
      time_horizon: 'medium_term',
      reasons: [
        'Enterprise cloud migration still in early-to-mid innings globally',
        'AI workload demand creating new revenue streams for cloud providers',
        'Improving unit economics as scale benefits compound',
      ],
      risks: [
        'Margin pressure from aggressive infrastructure buildout',
        'Regulatory scrutiny on market concentration',
      ],
      summary:
        'Cloud infrastructure benefits from the same AI tailwinds as semiconductors but with more recurring revenue characteristics. Enterprise adoption curves suggest sustained multi-year growth runway.',
    },
    {
      name: 'Defense & Aerospace',
      direction: 'bullish',
      confidence: 74,
      time_horizon: 'long_term',
      reasons: [
        'Global defense budgets increasing amid geopolitical uncertainty',
        'Multi-year procurement cycles provide earnings visibility',
        'Modernization programs driving technology upgrade spending',
      ],
      risks: [
        'Budget sequestration or political shifts could delay procurement',
        'Supply chain constraints on specialized components',
      ],
      summary:
        'Rising global security concerns are translating into durable defense budget increases. Long procurement cycles mean current order books support multi-year earnings growth, though political risk remains.',
    },
    {
      name: 'Biotech',
      direction: 'bullish',
      confidence: 68,
      time_horizon: 'long_term',
      reasons: [
        'GLP-1 drug class expanding addressable market beyond diabetes',
        'AI-accelerated drug discovery reducing time-to-market',
        'M&A activity increasing as large pharma seeks pipeline replenishment',
      ],
      risks: [
        'Clinical trial failures can cause significant drawdowns',
        'Drug pricing regulation remains an ongoing political risk',
        'Higher sector volatility compared to other growth areas',
      ],
      summary:
        'Biotech offers asymmetric upside driven by innovation in GLP-1 therapeutics and AI-assisted research. The sector is volatile but M&A premium potential provides a valuation floor for quality names.',
    },
    {
      name: 'Clean Energy',
      direction: 'neutral',
      confidence: 52,
      time_horizon: 'long_term',
      reasons: [
        'Policy support remains intact through IRA incentives',
        'Declining costs of solar and battery storage improving project economics',
      ],
      risks: [
        'Interest rate sensitivity impacts project financing costs',
        'Political risk to subsidies in election cycles',
        'Grid infrastructure bottlenecks limiting deployment speed',
      ],
      summary:
        'Clean energy has long-term structural tailwinds but near-term headwinds from financing costs and political uncertainty. Selective positioning warranted over broad sector exposure.',
    },
  ],
  macro_drivers: [
    {
      title: 'Inflation Moderating Toward Target',
      impact: 'positive',
      summary:
        'CPI declining from 3.4% to 3.1% YoY suggests the disinflationary trend remains intact. This supports the case for rate cuts in the medium term.',
    },
    {
      title: 'Manufacturing PMI Crosses Expansion Threshold',
      impact: 'positive',
      summary:
        'PMI rising above 50 for the first time in several months signals manufacturing recovery. Supportive for industrial and semiconductor sectors.',
    },
    {
      title: 'Treasury Yields Declining',
      impact: 'positive',
      summary:
        'The 10Y yield falling from 4.45% to 4.28% eases financial conditions and supports equity valuations, particularly for longer-duration growth assets.',
    },
    {
      title: 'VIX at Multi-Month Lows',
      impact: 'positive',
      summary:
        'Volatility compression to 14.2 reflects institutional confidence in the current macro trajectory. Low VIX environments historically favor risk assets.',
    },
    {
      title: 'Geopolitical Tensions Persist',
      impact: 'mixed',
      summary:
        'Ongoing tensions create tail risk for supply chains and energy markets. While not currently market-moving, escalation scenarios remain the primary left-tail risk.',
    },
  ],
  risks: [
    {
      title: 'Geopolitical Escalation',
      severity: 'high',
      category: 'Geopolitical',
      description:
        'Escalation in key regions could disrupt semiconductor supply chains, energy markets, and global trade flows.',
    },
    {
      title: 'Inflation Re-acceleration',
      severity: 'medium',
      category: 'Macro',
      description:
        'Services inflation remains sticky. Any re-acceleration would delay rate cuts and pressure growth equity valuations.',
    },
    {
      title: 'AI Investment Cycle Correction',
      severity: 'medium',
      category: 'Sector',
      description:
        'Current AI capex levels may not be sustainable if monetization timelines extend.',
    },
    {
      title: 'Commercial Real Estate Stress',
      severity: 'high',
      category: 'Financial',
      description:
        'Office vacancy rates remain elevated and refinancing risks are increasing as loans originated at lower rates mature.',
    },
    {
      title: 'Election Policy Uncertainty',
      severity: 'medium',
      category: 'Political',
      description:
        'Upcoming election cycles introduce uncertainty around tax policy, regulation, trade policy, and sector-specific subsidies.',
    },
    {
      title: 'Liquidity Tightening',
      severity: 'low',
      category: 'Macro',
      description:
        'Quantitative tightening continues to reduce system liquidity. Currently orderly but disruption risk exists.',
    },
  ],
};
