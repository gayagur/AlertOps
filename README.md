# Market Opportunity Intelligence

**Live Demo:** [market-intel-mc8bqv3b9-gayagur333-5297s-projects.vercel.app](https://market-intel-mc8bqv3b9-gayagur333-5297s-projects.vercel.app/)

A premium market analysis dashboard that ingests macro events, market signals, and sector-level trends, then explains where investment opportunities may exist and why.

**This is NOT a trading bot or financial advice tool.** It provides structured market analysis, opportunity signals, risk context, and clear explanations.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌───────────┐
│  yfinance    │────▶│ Signal Engine │────▶│ AI Analysis  │────▶│  Summary  │
│  (Live ETF   │     │ (Derive bias,│     │ (OpenAI for  │     │  Service  │
│   & Macro)   │     │  confidence) │     │  enrichment) │     │ (Merge)   │
└─────────────┘     └──────────────┘     └──────────────┘     └───────────┘
                                                                      │
                                                                      ▼
                                                              ┌───────────┐
                                                              │  FastAPI   │
                                                              │  Routes    │
                                                              └───────────┘
                                                                      │
                                                                      ▼
                                                              ┌───────────┐
                                                              │  React +  │
                                                              │ Dashboard │
                                                              └───────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS v4, Framer Motion, Recharts |
| **Backend** | FastAPI, Python 3.13 |
| **Data** | yfinance (sector ETFs + macro tickers), mock fallback |
| **AI** | OpenAI API (GPT-4o) for structured analysis enrichment |

## How It Works

1. **Data Layer** — Fetches 3 months of daily OHLCV data for 8 sector ETFs (SMH, SKYY, ICLN, XBI, VNQ, XLY, ITA, XLF) plus SPY benchmark, and macro tickers (10Y yield, VIX, DXY, Gold, Oil, S&P 500)
2. **Signal Engine** — Computes 1-month returns, relative strength vs SPY, volume trends, confidence scores, and directional bias (bullish / neutral / bearish)
3. **AI Analysis** — Sends structured signal data to OpenAI, which generates explanations, risk assessments, and opportunity rankings in strict JSON format. The LLM never invents data — it only analyzes what the signals show.
4. **Summary Service** — Merges raw signals + AI enrichment into the final API response
5. **Dashboard** — Renders a premium institutional-grade UI with KPI cards, opportunity rankings, macro driver timeline, risk radar, and sector confidence charts

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your OpenAI API key

# Run
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` requests to `http://localhost:8000`.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | OpenAI key for AI-enriched analysis |
| `OPENAI_MODEL` | No | Model to use (default: `gpt-4o`) |

Without an OpenAI key, the app still works — it shows signal-derived analysis without AI narrative enrichment. Without a network connection, it falls back to built-in mock data.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/overview` | Market overview and sentiment |
| GET | `/api/opportunities` | Ranked sector opportunities |
| GET | `/api/risks` | Current risk factors |
| GET | `/api/macro` | Macro economic drivers |
| GET | `/api/analysis` | Full analysis payload (used by dashboard) |
| POST | `/api/analyze` | On-demand analysis with sector focus filters |

## Project Structure

```
market-intel/
├── backend/
│   ├── app/
│   │   ├── api/routes.py          # FastAPI endpoints
│   │   ├── core/config.py         # Settings & env vars
│   │   ├── models/signals.py      # Internal signal models
│   │   ├── schemas/analysis.py    # API response schemas
│   │   └── services/
│   │       ├── openbb_service.py  # Live market data (yfinance)
│   │       ├── signal_engine.py   # Signal computation
│   │       ├── ai_analysis_service.py  # OpenAI integration
│   │       ├── summary_service.py # Response merging
│   │       └── mock_data.py       # Fallback mock data
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/            # AppShell, Sidebar, Topbar
│   │   │   ├── cards/             # MetricCard, OpportunityCard, RiskCard, etc.
│   │   │   ├── charts/            # SectorMomentumChart
│   │   │   └── common/            # Pills, badges, skeletons, empty states
│   │   ├── pages/                 # Dashboard, Opportunities, Macro, Risks, Analysis
│   │   ├── hooks/useAnalysis.ts   # Data fetching hook
│   │   ├── lib/                   # API client, utils, mock data
│   │   └── types/analysis.ts      # TypeScript types
│   └── package.json
└── README.md
```

## Disclaimer

This application is for informational and research purposes only. It does not constitute financial advice, investment recommendations, or an offer to buy or sell securities.
