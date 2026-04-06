# AlertOps — Alert Relay Agent

A production-grade real-time alert relay system that polls officially published public alerts from the Home Front Command and forwards them to subscribed users via email, SMS, and WhatsApp.

**This system only relays officially published public alerts. It does not predict, anticipate, or provide tactical forecasting.**

---

## Overview

AlertOps ingests alerts from an official public JSON endpoint, deduplicates them via Redis, persists them to PostgreSQL, matches them against user subscriptions, and dispatches notifications through configurable channels (email via SendGrid, SMS and WhatsApp via Twilio). All notification attempts are logged with delivery status for auditability.

Key features:
- Real-time polling (default 3s interval)
- Redis-based atomic deduplication (SET NX with TTL)
- Multi-channel notifications with retry logic (tenacity)
- Notification idempotency (unique constraint prevents double-sends)
- Test alert safety (test mode skips real dispatch by default)
- Health endpoints for container orchestration (liveness + readiness)
- Alembic database migrations for schema management
- Freshness metadata on all API responses

---

## Architecture

```
┌───────────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐     ┌────────────┐
│ Official       │────>│ Ingestion │────>│  Dedup   │────>│ Matcher  │────>│  Notifier  │
│ Alert Source   │     │ (Parse)   │     │ (Redis)  │     │ (DB)     │     │ (Send)     │
└───────────────┘     └───────────┘     └──────────┘     └──────────┘     └────────────┘
                                                                                │
                                                                      ┌────────┴────────┐
                                                                      │  Email │ SMS │ WA │
                                                                      └─────────────────┘
```

**Pipeline:**

1. **Poller** — Background task polls the official source every N seconds
2. **Ingestion** — Parses and normalizes raw alert data
3. **Deduplication** — Redis SET NX (atomic) prevents duplicate processing
4. **Persistence** — New alerts stored in PostgreSQL
5. **Matching** — Finds subscriptions whose areas overlap alert areas (case-insensitive substring matching)
6. **Notification** — Sends via configured channels with exponential backoff retry
7. **Logging** — Every notification attempt is logged with delivery status

**Tech stack:** Python 3.11+ / FastAPI / SQLAlchemy (async) / asyncpg / Redis / Alembic / SendGrid / Twilio / tenacity

---

## Local Development

### Prerequisites

- Python 3.11+
- PostgreSQL (running locally or remote)
- Redis (running locally or remote)

### Setup

```bash
cd alert-relay

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database and Redis connection strings
# Notification keys (SendGrid, Twilio) are optional for local dev

# Run database migrations
alembic upgrade head

# Start the server (with hot reload)
uvicorn app.main:app --reload --port 8001
```

The server will be available at `http://localhost:8001`. The poller starts automatically on startup.

Without notification API keys, alerts are still ingested and stored. Notifications are skipped gracefully with log warnings.

---

## Database Migrations

AlertOps uses Alembic with async PostgreSQL support for schema management.

### Run existing migrations

```bash
cd alert-relay

# Apply all migrations
alembic upgrade head

# Check current migration state
alembic current

# View migration history
alembic history --verbose
```

### Create a new migration

```bash
# Auto-generate from model changes
alembic revision --autogenerate -m "description of change"

# Or create an empty migration to write manually
alembic revision -m "description of change"
```

### Roll back

```bash
# Downgrade one step
alembic downgrade -1

# Downgrade to a specific revision
alembic downgrade <revision_id>

# Downgrade all the way
alembic downgrade base
```

The `DATABASE_URL` environment variable must be set. Alembic reads it from the environment and overrides the placeholder in `alembic.ini`. Render-style `postgres://` URLs are automatically converted to `postgresql+asyncpg://`.

---

## Render Deployment

### Step-by-step

1. **Create a PostgreSQL database** on Render (free tier available)
   - Copy the **Internal Database URL**

2. **Create a Redis instance** on Render (free tier available)
   - Copy the **Internal Redis URL**

3. **Create a new Web Service**
   - Connect your GitHub repository
   - **Root directory:** `alert-relay`
   - **Runtime:** Python 3
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Set environment variables** in the Render dashboard:
   - `DATABASE_URL` — the Internal Database URL from step 1 (replace `postgres://` with `postgresql+asyncpg://`)
   - `REDIS_URL` — the Internal Redis URL from step 2
   - `API_SECRET_KEY` — generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`
   - Optional: `SENDGRID_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, etc.

5. **Deploy** — Render will build and start the service. Check logs for the configuration summary.

### Health checks

Configure Render health checks:
- **Health check path:** `/health/ready`
- This checks database, Redis, and poller status before accepting traffic.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | `postgresql+asyncpg://localhost:5432/alertops` | PostgreSQL connection string (asyncpg driver) |
| `REDIS_URL` | **Yes** | `redis://localhost:6379/0` | Redis connection string for deduplication |
| `API_SECRET_KEY` | **Yes** (prod) | `change-me` | Secret key for API authentication |
| `ALERT_SOURCE_URL` | No | Official HFC endpoint | URL to poll for alerts |
| `POLL_INTERVAL_SECONDS` | No | `3` | Polling interval in seconds |
| `DEDUP_TTL` | No | `3600` | Redis dedup entry TTL in seconds |
| `SENDGRID_API_KEY` | No | _(empty)_ | SendGrid API key for email notifications |
| `SENDGRID_FROM_EMAIL` | No | `alerts@alertops.app` | Sender email (must be verified in SendGrid) |
| `TWILIO_ACCOUNT_SID` | No | _(empty)_ | Twilio account SID for SMS/WhatsApp |
| `TWILIO_AUTH_TOKEN` | No | _(empty)_ | Twilio auth token |
| `TWILIO_FROM_PHONE` | No | _(empty)_ | Twilio sender phone (E.164 format) |
| `TWILIO_WHATSAPP_FROM` | No | `whatsapp:+14155238886` | Twilio WhatsApp sender |

Without notification API keys, the system still ingests and stores alerts. Notifications are skipped with log warnings.

---

## Testing Safely

The `/api/test-alert` endpoint is safe by default:

```bash
# Safe test — notifications are logged but NOT actually sent
curl -X POST http://localhost:8001/api/test-alert \
  -H "Content-Type: application/json" \
  -d '{
    "areas": ["Tel Aviv"],
    "title": "Test Alert — System Check"
  }'
```

Response:
```json
{
  "status": "test_sent",
  "mode": "test_mode (no real dispatch)",
  "matched": 2,
  "sent": 0,
  "skipped": 4
}
```

Test alerts are always:
- Stored with `source="AlertOps Test"`
- Stored with `alert_type` prefixed with `test_`
- Logged with status `test_skipped` (not actually dispatched)

To force real notification dispatch during testing:

```bash
# Real send — only use when you explicitly want to test delivery
curl -X POST http://localhost:8001/api/test-alert \
  -H "Content-Type: application/json" \
  -d '{
    "areas": ["Tel Aviv"],
    "title": "Test Alert — System Check",
    "send_real_notifications": true
  }'
```

---

## Production Readiness Checklist

- [ ] `DATABASE_URL` points to production PostgreSQL (not localhost)
- [ ] `REDIS_URL` points to production Redis (not localhost)
- [ ] `API_SECRET_KEY` is a strong random string (not the default)
- [ ] Database migrations applied (`alembic upgrade head`)
- [ ] Health check configured at `/health/ready`
- [ ] SendGrid API key set (for email notifications)
- [ ] Twilio credentials set (for SMS/WhatsApp notifications)
- [ ] CORS origins updated in `app/main.py` for your frontend domain
- [ ] Log monitoring configured (stdout logs from uvicorn)
- [ ] Tested with `/api/test-alert` in safe mode first

---

## API Reference

### Health Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Basic liveness check (always returns ok) |
| GET | `/health/live` | Checks if poller is running |
| GET | `/health/ready` | Checks DB + Redis + poller (returns 503 if unhealthy) |

### Data Endpoints (all prefixed with `/api`)

| Method | Path | Tier | Description |
|---|---|---|---|
| GET | `/api/alerts/live` | Realtime (5s) | Live alert feed with freshness metadata |
| GET | `/api/alerts/recent` | Realtime | Recent alerts (flat response) |
| GET | `/api/overview` | Near-realtime (30s) | Overview KPIs |
| GET | `/api/regions` | Near-realtime (30-60s) | Per-region statistics |
| GET | `/api/timeseries` | Aggregated (2-5min) | Daily alert time series |
| GET | `/api/heatmap` | Aggregated (2-5min) | Region x Hour heatmap |
| GET | `/api/system/status` | Internal | Full system observability metrics |
| GET | `/api/stats` | Internal | System statistics summary |

### Subscription Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/subscribe` | Subscribe to alerts for specific areas |
| GET | `/api/subscriptions` | List active subscriptions |
| DELETE | `/api/subscriptions/{id}` | Deactivate a subscription |

### Testing

| Method | Path | Description |
|---|---|---|
| POST | `/api/test-alert` | Send a test alert (safe mode by default) |

### Subscribe Example

```bash
curl -X POST http://localhost:8001/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Gaya",
    "email": "gaya@example.com",
    "areas": ["Tel Aviv", "Gush Dan"],
    "notify_email": true
  }'
```

### Test Alert Example

```bash
curl -X POST http://localhost:8001/api/test-alert \
  -H "Content-Type: application/json" \
  -d '{
    "areas": ["Tel Aviv"],
    "title": "Test Alert — System Check"
  }'
```

---

## Disclaimer

This system relays officially published public alerts only. It does not provide real-time tactical forecasting, prediction, or anticipation of future events.
