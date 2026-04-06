import asyncio
import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.database import init_db
from app.core.redis import close_redis
from app.workers.poller import start_polling, stop_polling

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
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


@app.get("/health")
async def health():
    return {"status": "ok", "service": "alertops"}
