# AlertOps — Civilian Conflict Monitor

**Live Dashboard:** [market-intel-sooty.vercel.app](https://market-intel-sooty.vercel.app/)

A civilian-facing conflict monitoring dashboard providing historical alert analytics, regional analysis, and official guidance based on publicly available data from the Home Front Command.

**This is a public information platform. It does not provide tactical forecasting, attack prediction, or operational intelligence.**

## Architecture

```
┌───────────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐     ┌────────────┐
│ Official HFC   │────▶│ Ingestion │────▶│  Dedup   │────▶│ Matcher  │────▶│  Notifier  │
│ Alert Source   │     │ (Parse)   │     │ (Redis)  │     │ (DB)     │     │ (Send)     │
└───────────────┘     └───────────┘     └──────────┘     └──────────┘     └────────────┘
         │                                    │                                  │
         │                                    ▼                          ┌───────┴───────┐
         │                              ┌──────────┐                     │ Email│SMS│WA  │
         │                              │ Postgres │                     └───────────────┘
         │                              └──────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Dashboard (Vercel)                   │
│  Overview │ Live Alerts │ Regional │ Time │ Timeline │ Alerts │
└─────────────────────────────────────────────────────────────┘
```

## Components

| Component | Directory | Stack | Deployment |
|-----------|-----------|-------|------------|
| **Dashboard** | `frontend/` | React, TypeScript, Tailwind, TanStack Query, Recharts | Vercel |
| **Alert Relay** | `alert-relay/` | FastAPI, PostgreSQL, Redis, Alembic | Render |

## Dashboard Pages

| Page | Path | Description | Refresh |
|------|------|-------------|---------|
| **Overview** | `/` | KPIs, charts, recent incidents, official updates | 30s |
| **Live Alerts** | `/live` | Real-time alert feed with filtering | 5s |
| **Regional** | `/regional` | Per-region stats, comparison cards, charts | 30-60s |
| **Time Analysis** | `/time` | Hourly heatmap, trends, activity charts | 2-5min |
| **Timeline** | `/timeline` | Chronological incident feed with filters | 5s |
| **Official Alerts** | `/alerts` | Guidance, shelter times, source info | 60s |

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` to your deployed alert-relay backend URL for live data.

### Alert Relay Backend

```bash
cd alert-relay
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with DATABASE_URL, REDIS_URL
alembic upgrade head
uvicorn app.main:app --reload --port 8001
```

See [alert-relay/README.md](alert-relay/README.md) for full deployment guide.

## Environment Variables

### Frontend (Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Alert relay backend URL (e.g. `https://your-app.onrender.com`) |

### Alert Relay (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL (use `postgresql+asyncpg://` prefix) |
| `REDIS_URL` | Yes | Redis connection string |
| `API_SECRET_KEY` | Yes (prod) | Random secret for API auth |
| `SENDGRID_API_KEY` | No | Email notifications |
| `TWILIO_ACCOUNT_SID` | No | SMS/WhatsApp notifications |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth |

## Data Freshness

Every API response includes freshness metadata (`generated_at`, `source_last_updated`, `freshness_tier`, `stale`). The frontend displays live/updating/delayed status on every data panel.

| Tier | Interval | Used For |
|------|----------|----------|
| Realtime | 5s | Live alerts, incident feed |
| Near-realtime | 30s | KPIs, region stats, official updates |
| Aggregated | 2-5min | Heatmaps, time series, trends |

## Disclaimer

This dashboard is intended for civilian informational use based on public official sources and historical data. It does not provide real-time tactical forecasting.
