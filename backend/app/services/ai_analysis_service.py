"""
AI Analysis Service
====================
Uses OpenAI to convert raw market signals into structured explanations.

Key principles:
- The LLM never invents market data — all data is passed in via the prompt
- The LLM's role is to explain, contextualize, and rank signals
- Responses are required in strict JSON format
- Validation and fallback protect against malformed responses
"""

import json
import logging
from openai import AsyncOpenAI
from app.core.config import get_settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior macro-economic analyst at a top-tier investment research firm.
Your role is to analyze market signals and produce structured investment intelligence.

IMPORTANT RULES:
- You do NOT invent or fabricate market data
- You ONLY analyze the signals provided to you
- You provide structured reasoning, not trading recommendations
- This is analysis, NOT financial advice
- Be specific, cite the data points given to you
- Be balanced — always mention both opportunity and risk
- Write in a professional, institutional tone

You must respond ONLY with valid JSON matching the requested schema. No markdown, no code fences."""

ANALYSIS_PROMPT = """Analyze these market signals and produce a comprehensive investment intelligence report.

RAW MARKET DATA:
{market_data}

DERIVED SIGNALS:
- Top opportunities (ranked by confidence): {opportunities}
- Identified risks: {risks}
- Market overview: {overview}

Produce a JSON response with this exact structure:
{{
  "opportunities": [
    {{
      "name": "<sector name>",
      "direction": "<bullish|neutral|bearish>",
      "confidence": <number 0-100>,
      "time_horizon": "<short_term|medium_term|long_term>",
      "reasons": ["<reason 1>", "<reason 2>", "<reason 3>"],
      "risks": ["<risk 1>", "<risk 2>"],
      "summary": "<2-3 sentence institutional-quality summary>"
    }}
  ],
  "macro_drivers": [
    {{
      "title": "<driver name>",
      "impact": "<positive|negative|mixed>",
      "summary": "<1-2 sentence explanation>"
    }}
  ],
  "risks": [
    {{
      "title": "<risk name>",
      "severity": "<low|medium|high|critical>",
      "category": "<Geopolitical|Macro|Sector|Financial|Political>",
      "description": "<1-2 sentence description>"
    }}
  ],
  "overview_summary": "<3-4 sentence market overview>"
}}

Include all sectors from the data. Rank opportunities by conviction. Be specific and data-driven."""


class AIAnalysisService:
    def __init__(self):
        settings = get_settings()
        self.client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.model = settings.openai_model

    @property
    def is_available(self) -> bool:
        return self.client is not None

    async def generate_analysis(
        self,
        market_data: dict,
        opportunities: list[dict],
        risks: list[dict],
        overview: dict,
    ) -> dict | None:
        """
        Send structured signal data to OpenAI and get back enriched analysis.
        Returns parsed JSON dict or None if the call fails.
        """
        if not self.is_available:
            logger.warning("OpenAI API key not configured — skipping AI analysis")
            return None

        prompt = ANALYSIS_PROMPT.format(
            market_data=json.dumps(market_data, indent=2, default=str),
            opportunities=json.dumps(opportunities, indent=2),
            risks=json.dumps(risks, indent=2),
            overview=json.dumps(overview, indent=2),
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=4000,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            return self._parse_and_validate(content)

        except Exception as e:
            logger.error(f"OpenAI analysis failed: {e}")
            return None

    def _parse_and_validate(self, raw: str) -> dict | None:
        """Parse JSON response and validate required fields exist."""
        try:
            data = json.loads(raw)

            required_keys = ["opportunities", "macro_drivers", "risks"]
            for key in required_keys:
                if key not in data:
                    logger.warning(f"AI response missing required key: {key}")
                    return None
                if not isinstance(data[key], list):
                    logger.warning(f"AI response key '{key}' is not a list")
                    return None

            return data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            return None
