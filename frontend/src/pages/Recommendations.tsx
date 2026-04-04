import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { RecommendationCard } from '@/components/recommendations/RecommendationCard';
import { StrategyPanel } from '@/components/recommendations/StrategyPanel';
import { MetricCard } from '@/components/cards/MetricCard';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { formatTimestamp } from '@/lib/utils';

export function Recommendations() {
  const { data, loading, isLive } = useRecommendations();

  if (loading) return <DashboardSkeleton />;

  const { top_recommendations, portfolio_strategy, market_context, disclaimer } = data;

  if (!top_recommendations.length) {
    return (
      <EmptyState
        title="No recommendations available"
        description="The recommendation engine hasn't identified actionable opportunities at this time."
      />
    );
  }

  const topOpp = top_recommendations[0];
  const highestConf = [...top_recommendations].sort((a, b) => b.confidence - a.confidence)[0];
  const lowestRiskIdx = top_recommendations.findIndex((r) => r.risks.length <= 1);
  const bestEtf = top_recommendations
    .flatMap((r) => r.recommended_instruments)
    .find((i) => i.type === 'ETF');

  return (
    <div className="space-y-10">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Recommendations
            </h1>
            <p className="text-sm text-text-tertiary mt-1">
              AI-scored instruments ranked by sector conviction
              <span className="mx-2 text-border">·</span>
              {formatTimestamp(data.generated_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1.5 text-xs text-bullish">
                <span className="h-1.5 w-1.5 rounded-full bg-bullish animate-pulse" />
                Live data
              </span>
            )}
            <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Market context */}
        <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">
          {market_context}
        </p>
      </motion.div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Top Opportunity"
          value={topOpp.sector}
          icon={TrendingUp}
          accent={topOpp.direction === 'bullish' ? 'bullish' : 'neutral'}
          subtitle={`${topOpp.confidence}% confidence`}
        />
        <MetricCard
          label="Highest Conviction"
          value={`${highestConf.confidence}%`}
          icon={Zap}
          accent="default"
          subtitle={highestConf.sector}
        />
        <MetricCard
          label="Best ETF Idea"
          value={bestEtf?.symbol || 'N/A'}
          icon={ShieldCheck}
          accent="default"
          subtitle={bestEtf?.name || ''}
        />
        <MetricCard
          label="Sectors Analyzed"
          value={top_recommendations.length}
          icon={BarChart3}
          accent="default"
          subtitle="Top ranked"
        />
      </div>

      {/* Main content: Recommendations + Strategy panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8">
        {/* Recommendation cards */}
        <div className="space-y-6">
          {top_recommendations.map((rec, i) => (
            <RecommendationCard key={rec.sector} rec={rec} index={i} />
          ))}
        </div>

        {/* Strategy panel (sticky on desktop) */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          <StrategyPanel strategies={portfolio_strategy} disclaimer={disclaimer} />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center py-6 border-t border-border">
        <p className="text-xs text-text-tertiary max-w-lg mx-auto">{disclaimer}</p>
      </div>
    </div>
  );
}
