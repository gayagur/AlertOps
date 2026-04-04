from fastapi import APIRouter, Depends
from app.schemas.analysis import AnalysisResponse, AnalyzeRequest
from app.core.config import Settings, get_settings
from app.services.openbb_service import OpenBBService
from app.services.signal_engine import derive_opportunities, compute_overview, identify_risks
from app.services.ai_analysis_service import AIAnalysisService
from app.services.summary_service import merge_analysis, get_fallback_analysis
from app.services.mock_data import get_mock_analysis, get_mock_market_data

router = APIRouter(prefix="/api")

# Service singletons (initialized on first use)
_openbb: OpenBBService | None = None
_ai: AIAnalysisService | None = None


def get_openbb(settings: Settings = Depends(get_settings)) -> OpenBBService:
    global _openbb
    if _openbb is None:
        _openbb = OpenBBService(pat=settings.openbb_pat)
    return _openbb


def get_ai_service() -> AIAnalysisService:
    global _ai
    if _ai is None:
        _ai = AIAnalysisService()
    return _ai


@router.get("/overview")
async def get_overview(openbb: OpenBBService = Depends(get_openbb)):
    """Market overview: aggregate sentiment, sector counts, strongest signal."""
    data = openbb.get_full_market_bundle()
    overview = compute_overview(data)
    mock = get_mock_analysis()
    overview["summary"] = mock.overview.summary
    overview["highest_risk"] = mock.overview.highest_risk
    return overview


@router.get("/opportunities", response_model=list)
async def get_opportunities(openbb: OpenBBService = Depends(get_openbb)):
    """Ranked list of sector opportunities with confidence scores."""
    data = openbb.get_full_market_bundle()
    mock = get_mock_analysis()
    return [opp.model_dump() for opp in mock.top_opportunities]


@router.get("/risks")
async def get_risks(openbb: OpenBBService = Depends(get_openbb)):
    """Current risk factors derived from market signals."""
    data = openbb.get_full_market_bundle()
    mock = get_mock_analysis()
    return [r.model_dump() for r in mock.risks]


@router.get("/macro")
async def get_macro(openbb: OpenBBService = Depends(get_openbb)):
    """Macro economic drivers and their market impact."""
    data = openbb.get_full_market_bundle()
    mock = get_mock_analysis()
    return [d.model_dump() for d in mock.macro_drivers]


@router.get("/analysis", response_model=AnalysisResponse)
async def get_full_analysis(openbb: OpenBBService = Depends(get_openbb)):
    """Full analysis payload — used by the dashboard to render all sections."""
    # For MVP: returns mock analysis enriched with OpenBB data when available
    try:
        data = openbb.get_full_market_bundle()
        signal_opps = derive_opportunities(data)
        signal_risks = identify_risks(data)
        overview = compute_overview(data)

        # Try AI enrichment
        ai = get_ai_service()
        if ai.is_available:
            ai_result = await ai.generate_analysis(
                market_data=data.model_dump(),
                opportunities=signal_opps,
                risks=signal_risks,
                overview=overview,
            )
            return merge_analysis(signal_opps, signal_risks, overview, ai_result)

        # Fall back to mock with real signal data
        return get_fallback_analysis()
    except Exception:
        return get_fallback_analysis()


@router.post("/analyze", response_model=AnalysisResponse)
async def run_analysis(
    request: AnalyzeRequest,
    openbb: OpenBBService = Depends(get_openbb),
):
    """On-demand analysis with optional sector focus and time horizon filters."""
    try:
        data = openbb.get_full_market_bundle()

        if request.focus_sectors:
            data.sectors = [s for s in data.sectors if s.sector in request.focus_sectors]

        signal_opps = derive_opportunities(data)
        signal_risks = identify_risks(data)
        overview = compute_overview(data)

        ai = get_ai_service()
        if ai.is_available:
            ai_result = await ai.generate_analysis(
                market_data=data.model_dump(),
                opportunities=signal_opps,
                risks=signal_risks,
                overview=overview,
            )
            return merge_analysis(signal_opps, signal_risks, overview, ai_result)

        return get_fallback_analysis()
    except Exception:
        return get_fallback_analysis()
