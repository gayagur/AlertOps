import asyncio
import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import get_settings
from app.core.database import init_db, engine
from app.core.redis import get_redis, close_redis
from app.services.system_status import metrics
from app.workers.poller import start_polling, stop_polling

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


def _validate_startup_config():
    """Validate configuration at startup. Logs warnings for missing optional keys."""
    settings = get_settings()

    # Required checks
    if not settings.database_url or settings.database_url == "postgresql+asyncpg://localhost:5432/alertops":
        logger.warning(
            "DATABASE_URL is not set or is using the default value. "
            "Set DATABASE_URL to your production PostgreSQL connection string."
        )

    if not settings.redis_url or settings.redis_url == "redis://localhost:6379/0":
        logger.warning(
            "REDIS_URL is not set or is using the default value. "
            "Set REDIS_URL to your production Redis connection string."
        )

    if settings.api_secret_key in ("change-me", "change-me-to-a-random-string", ""):
        logger.warning(
            "API_SECRET_KEY is not set or is using the default value. "
            "Generate a strong secret: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
        )

    # Optional notification keys — warn but don't crash
    if not settings.sendgrid_api_key:
        logger.warning("SENDGRID_API_KEY not set — email notifications will be skipped")
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        logger.warning("Twilio credentials not set — SMS and WhatsApp notifications will be skipped")

    # Log configuration summary
    logger.info("=" * 60)
    logger.info("AlertOps Configuration Summary")
    logger.info("=" * 60)
    logger.info(f"  Database:      {'configured' if settings.database_url else 'MISSING'}")
    logger.info(f"  Redis:         {'configured' if settings.redis_url else 'MISSING'}")
    logger.info(f"  SendGrid:      {'configured' if settings.sendgrid_api_key else 'not configured'}")
    logger.info(f"  Twilio SMS:    {'configured' if settings.twilio_account_sid else 'not configured'}")
    logger.info(f"  Twilio WA:     {'configured' if settings.twilio_whatsapp_from else 'not configured'}")
    logger.info(f"  Poll interval: {settings.poll_interval_seconds}s")
    logger.info(f"  Dedup TTL:     {settings.dedup_ttl}s")
    logger.info(f"  Alert source:  {settings.alert_source_url[:60]}...")
    logger.info("=" * 60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Startup validation
    _validate_startup_config()

    # Startup
    logger.info("AlertOps starting up...")
    await init_db()
    logger.info("Database initialized")

    # Start poller in background
    poller_task = asyncio.create_task(start_polling())

    yield

    # Shutdown
    stop_polling()
    poller_task.cancel()
    await close_redis()
    logger.info("AlertOps shut down")


app = FastAPI(
    title="AlertOps — Alert Relay Agent",
    description="Civilian alert relay system based on official public sources",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://market-intel-sooty.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


# ─── Health Endpoints (not behind /api prefix) ──────────────────────────────

@app.get("/health")
async def health():
    """Basic liveness check. Always returns ok if the process is running."""
    return {"status": "ok", "service": "alertops"}


@app.get("/health/live")
async def health_live():
    """Liveness check — verifies the poller is running."""
    poller_ok = metrics.poller_running
    return {
        "status": "ok" if poller_ok else "degraded",
        "poller_running": poller_ok,
        "polling_healthy": metrics.is_polling_healthy(),
    }


@app.get("/health/ready")
async def health_ready():
    """
    Readiness check — verifies DB connection, Redis connection, and poller status.
    Returns 503 if any critical dependency is down.
    """
    from fastapi.responses import JSONResponse
    from sqlalchemy import text

    checks = {
        "database": False,
        "redis": False,
        "poller": metrics.poller_running,
    }

    # Check database connection
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception as e:
        logger.error(f"Health check: database connection failed: {e}")

    # Check Redis connection
    try:
        r = await get_redis()
        await r.ping()
        checks["redis"] = True
    except Exception as e:
        logger.error(f"Health check: Redis connection failed: {e}")

    all_ok = all(checks.values())
    status_code = 200 if all_ok else 503

    body = {
        "status": "ok" if all_ok else "unhealthy",
        "checks": checks,
    }

    return JSONResponse(content=body, status_code=status_code)
