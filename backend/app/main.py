from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="Market Opportunity Intelligence",
    description="Structured market analysis, opportunity signals, and risk context",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://market-intel-mc8bqv3b9-gayagur333-5297s-projects.vercel.app",
        "https://market-intel-gayagur333-5297s-projects.vercel.app",
        "https://market-intel.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok"}
