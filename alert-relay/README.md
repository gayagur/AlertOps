# AlertOps — Alert Relay Agent

A real-time alert relay system that listens to official public alerts from the Home Front Command and forwards them to subscribed users via email, SMS, and WhatsApp.

**This system only relays officially published public alerts. It does not predict, anticipate, or provide tactical forecasting.**

## Architecture

```
┌───────────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌────────────┐
│ Official       │────▶│ Ingestion│────▶│  Dedup   │────▶│ Matcher  │────▶│  Notifier  │
│ Alert Source   │     │ (Parse)  │     │ (Redis)  │     │ (DB)     │     │ (Send)     │
└───────────────┘     └─────────┘     └──────────┘     └──────────┘     └────────────┘
                                                                              │
                                                                    ┌────────┴────────┐
                                                                    │  Email │ SMS │ WA │
                                                                    └─────────────────┘
```

## Pipeline

1. **Ingestion** — Polls official source every 3 seconds, normalizes alerts
2. **Deduplication** — Redis SET NX with TTL prevents duplicate processing
3. **Persistence** — New alerts stored in Postgres
4. **Matching** — Finds subscribers whose areas overlap the alert areas
5. **Notification** — Sends via configured channels with retry logic
6. **Logging** — Every notification attempt is logged with delivery status

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL
- Redis

### Local Development

```bash
cd alert-relay

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database, Redis, and API keys

# Run
uvicorn app.main:app --reload --port 8001
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `SENDGRID_API_KEY` | No | SendGrid key for email alerts |
| `SENDGRID_FROM_EMAIL` | No | Sender email address |
| `TWILIO_ACCOUNT_SID` | No | Twilio SID for SMS/WhatsApp |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_FROM_PHONE` | No | Twilio sender phone number |
| `TWILIO_WHATSAPP_FROM` | No | Twilio WhatsApp sender |
| `POLL_INTERVAL_SECONDS` | No | Polling interval (default: 3) |

Without notification API keys, alerts are still ingested and stored — notifications are skipped gracefully.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/subscribe` | Subscribe to alerts for areas |
| GET | `/api/subscriptions` | List active subscriptions |
| DELETE | `/api/subscriptions/{id}` | Deactivate a subscription |
| GET | `/api/alerts/recent` | Get recent alerts |
| POST | `/api/test-alert` | Send a test alert |
| GET | `/api/stats` | System statistics |
| GET | `/health` | Health check |

### Subscribe Example

```bash
curl -X POST http://localhost:8001/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Gaya",
    "email": "gaya@example.com",
    "areas": ["תל אביב", "Gush Dan"],
    "notify_email": true
  }'
```

### Test Alert Example

```bash
curl -X POST http://localhost:8001/api/test-alert \
  -H "Content-Type: application/json" \
  -d '{
    "areas": ["תל אביב"],
    "title": "Test Alert — System Check"
  }'
```

## Deploying to Render

1. Create a new **Web Service** pointing to the `alert-relay/` directory
2. **Build command:** `pip install -r requirements.txt`
3. **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables in Render dashboard
5. Add a **PostgreSQL** database (Render provides free tier)
6. Add a **Redis** instance (Render provides free tier)

## Disclaimer

This system relays officially published public alerts only. It does not provide real-time tactical forecasting, prediction, or anticipation of future events.
