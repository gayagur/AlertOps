import type { RecommendationsResponse } from '@/types/recommendations';

export const mockRecommendations: RecommendationsResponse = {
  generated_at: new Date().toISOString(),
  market_context:
    'The market is in a risk-off environment with rising yields and elevated VIX. Biotech shows relative strength while defensive and consumer sectors face headwinds. Selective positioning in high-conviction areas is warranted.',
  top_recommendations: [
    {
      sector: 'Biotech',
      direction: 'bullish',
      confidence: 72,
      time_horizon: 'long_term',
      recommended_instruments: [
        {
          symbol: 'XBI',
          name: 'SPDR S&P Biotech ETF',
          type: 'ETF',
          reason: 'Broad biotech exposure with built-in diversification across 130+ holdings',
          risk: 'Sector-level drawdown risk during risk-off periods',
          selection_score: 88,
          role: 'Core Sector Exposure',
          why_selected: [
            'Highest diversification score in the biotech universe',
            'Lower single-name risk compared to individual stocks',
            'Strong liquidity with tight bid-ask spreads',
          ],
          risk_notes: [
            'Still concentrated in biotech cycle',
            'Sensitive to FDA approval calendar',
          ],
        },
        {
          symbol: 'LLY',
          name: 'Eli Lilly',
          type: 'stock',
          reason: 'Market leader in GLP-1 therapeutics with strong revenue visibility',
          risk: 'Premium valuation leaves limited margin of safety',
          selection_score: 85,
          role: 'High Conviction',
          why_selected: [
            'Dominant GLP-1 franchise with expanding indications',
            'Highest market leadership score in biotech universe',
            'Strong earnings momentum supports premium multiple',
          ],
          risk_notes: [
            'Valuation already reflects significant growth expectations',
            'Competitive GLP-1 landscape intensifying',
          ],
        },
        {
          symbol: 'VRTX',
          name: 'Vertex Pharmaceuticals',
          type: 'stock',
          reason: 'Dominant franchise in cystic fibrosis with pipeline optionality',
          risk: 'Revenue concentration in single therapeutic area',
          selection_score: 79,
          role: 'Quality Growth',
        },
      ],
      allocation_suggestion: {
        aggressive: '10–15%',
        moderate: '5–10%',
        conservative: '3–7%',
      },
      why_now:
        'Biotech is showing relative strength in a weak market, suggesting institutional rotation into the sector. GLP-1 pipeline catalysts and M&A activity provide near-term catalysts.',
      key_drivers: [
        'GLP-1 drug class expansion beyond diabetes into obesity and cardiovascular',
        'AI-accelerated drug discovery reducing development timelines',
        'Large pharma M&A creating premium acquisition targets',
      ],
      risks: [
        'Clinical trial failures can cause 20-40% drawdowns in individual names',
        'Drug pricing regulation remains an ongoing political risk',
      ],
      summary:
        'Biotech offers the strongest risk-adjusted opportunity in the current market. The sector is showing relative strength against broad market weakness, supported by structural innovation in GLP-1 therapeutics and AI-driven research.',
      profile_fit: {
        conservative: ['XBI'],
        moderate: ['XBI', 'LLY'],
        aggressive: ['LLY', 'VRTX', 'XBI'],
      },
      rejected_alternatives: [
        {
          symbol: 'MRNA',
          name: 'Moderna',
          selection_score: 62,
          reason_rejected: 'Higher volatility and uncertain post-COVID revenue trajectory reduce risk-adjusted attractiveness',
        },
        {
          symbol: 'IBB',
          name: 'iShares Biotech ETF',
          selection_score: 71,
          reason_rejected: 'Lower score than XBI due to more concentrated large-cap weighting reducing diversification benefit',
        },
      ],
      strategy_note:
        'For this opportunity, the ETF (XBI) is preferred as the core position due to the inherent binary risk in biotech. Individual stock positions should be sized conservatively.',
    },
    {
      sector: 'Cloud Infrastructure',
      direction: 'neutral',
      confidence: 58,
      time_horizon: 'medium_term',
      recommended_instruments: [
        {
          symbol: 'SKYY',
          name: 'First Trust Cloud Computing ETF',
          type: 'ETF',
          reason: 'Diversified cloud exposure without single-stock concentration risk',
          risk: 'Sector exposed to enterprise spending slowdown',
          selection_score: 82,
          role: 'Core Sector Exposure',
        },
      ],
      allocation_suggestion: {
        aggressive: '5–10%',
        moderate: '3–7%',
        conservative: '2–5%',
      },
      why_now:
        'Cloud infrastructure shows stable trends but lacks strong directional momentum. Positioning warranted for long-term exposure but conviction is below the threshold for aggressive sizing.',
      key_drivers: [
        'Enterprise cloud migration continues as a secular trend',
        'AI workloads driving incremental demand for compute infrastructure',
      ],
      risks: [
        'Enterprise IT budget tightening could slow adoption rates',
        'Margin pressure from competitive infrastructure buildout',
      ],
      summary:
        'Cloud infrastructure maintains structural tailwinds but near-term signals are mixed. ETF-only exposure recommended until directional clarity improves.',
      profile_fit: {
        conservative: ['SKYY'],
        moderate: ['SKYY'],
        aggressive: ['SKYY'],
      },
      rejected_alternatives: [
        {
          symbol: 'MSFT',
          name: 'Microsoft',
          selection_score: 68,
          reason_rejected: 'Confidence below 60% threshold — individual stock picks not recommended at this conviction level',
        },
        {
          symbol: 'CRM',
          name: 'Salesforce',
          selection_score: 55,
          reason_rejected: 'Weaker trend strength and lower market leadership score relative to cloud mega-caps',
        },
      ],
      strategy_note:
        'With confidence below 60%, this sector warrants ETF-only exposure. Individual stock positions carry outsized risk relative to the moderate conviction level.',
    },
    {
      sector: 'Semiconductors',
      direction: 'neutral',
      confidence: 55,
      time_horizon: 'medium_term',
      recommended_instruments: [
        {
          symbol: 'SMH',
          name: 'VanEck Semiconductor ETF',
          type: 'ETF',
          reason: 'Broad semiconductor exposure with strong liquidity',
          risk: 'Sector facing near-term demand uncertainty and geopolitical headwinds',
          selection_score: 80,
          role: 'Core Sector Exposure',
        },
      ],
      allocation_suggestion: {
        aggressive: '5–10%',
        moderate: '3–5%',
        conservative: '0–3%',
      },
      why_now:
        'Semiconductors are experiencing a consolidation after the AI-driven rally. Long-term structural thesis remains intact but near-term headwinds from geopolitical tensions and demand normalization warrant patience.',
      key_drivers: [
        'AI infrastructure demand provides long-term structural support',
        'CHIPS Act incentives supporting domestic capacity expansion',
      ],
      risks: [
        'Geopolitical tensions around Taiwan could disrupt supply chains',
        'Near-term demand correction as AI investment cycle normalizes',
      ],
      summary:
        'Semiconductors show reduced momentum but retain long-term appeal. ETF exposure provides a patient way to maintain sector participation without concentrated single-name risk.',
      profile_fit: {
        conservative: ['SMH'],
        moderate: ['SMH'],
        aggressive: ['SMH'],
      },
      rejected_alternatives: [
        {
          symbol: 'NVDA',
          name: 'NVIDIA',
          selection_score: 65,
          reason_rejected: 'Elevated volatility and valuation risk make individual stock position inadvisable at current conviction level',
        },
        {
          symbol: 'INTC',
          name: 'Intel',
          selection_score: 48,
          reason_rejected: 'Weaker market leadership and execution concerns reduce risk-adjusted score significantly',
        },
      ],
      strategy_note:
        'Semiconductor conviction is moderate — ETF-only positioning is appropriate. Wait for a higher-conviction entry point before adding individual stock exposure.',
    },
  ],
  portfolio_strategy: [
    {
      profile: 'aggressive',
      allocations: [
        { sector: 'Biotech', weight_pct: 35, instrument: 'LLY', rationale: 'Highest conviction single-stock opportunity' },
        { sector: 'Biotech', weight_pct: 15, instrument: 'XBI', rationale: 'Diversified biotech exposure' },
        { sector: 'Cloud Infrastructure', weight_pct: 15, instrument: 'SKYY', rationale: 'Secular growth at moderate conviction' },
        { sector: 'Semiconductors', weight_pct: 15, instrument: 'SMH', rationale: 'Patient positioning in structural theme' },
      ],
      cash_pct: 20,
      summary: 'Concentrated in highest-conviction biotech thesis with diversified satellite positions. 20% cash reserve reflects elevated macro uncertainty.',
    },
    {
      profile: 'moderate',
      allocations: [
        { sector: 'Biotech', weight_pct: 20, instrument: 'XBI', rationale: 'Core biotech via diversified ETF' },
        { sector: 'Biotech', weight_pct: 10, instrument: 'LLY', rationale: 'Quality single-name complement' },
        { sector: 'Cloud Infrastructure', weight_pct: 15, instrument: 'SKYY', rationale: 'Secular cloud exposure' },
        { sector: 'Semiconductors', weight_pct: 10, instrument: 'SMH', rationale: 'Reduced semiconductor allocation' },
      ],
      cash_pct: 45,
      summary: 'Balanced allocation emphasizing ETF diversification. Higher cash position reflects risk-off environment and moderate conviction levels.',
    },
    {
      profile: 'conservative',
      allocations: [
        { sector: 'Biotech', weight_pct: 15, instrument: 'XBI', rationale: 'ETF-only biotech with managed risk' },
        { sector: 'Cloud Infrastructure', weight_pct: 10, instrument: 'SKYY', rationale: 'Minimal cloud position via ETF' },
        { sector: 'Semiconductors', weight_pct: 5, instrument: 'SMH', rationale: 'Small semiconductor tracking position' },
      ],
      cash_pct: 70,
      summary: 'Defensive positioning with ETF-only exposure. 70% cash preserves capital during elevated macro uncertainty while maintaining upside participation.',
    },
  ],
  disclaimer:
    'This analysis is for informational purposes only and does not constitute financial advice. Past performance does not guarantee future results.',
};
