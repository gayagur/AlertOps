import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { MetricCard } from '@/components/cards/MetricCard';
import { OpportunityCard } from '@/components/cards/OpportunityCard';
import { DriverCard } from '@/components/cards/DriverCard';
import { RiskCard } from '@/components/cards/RiskCard';
import { InsightPanel } from '@/components/cards/InsightPanel';
import { SectorMomentumChart } from '@/components/charts/SectorMomentumChart';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';
import { formatTimestamp } from '@/lib/utils';

export function Dashboard() {
  const { data, loading } = useAnalysis();

  if (loading) return <DashboardSkeleton />;

  const { overview, top_opportunities, macro_drivers, risks } = data;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Market Intelligence
            </h1>
            <p className="text-sm text-text-tertiary mt-1">
              Generated {formatTimestamp(data.generated_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-bullish-bg text-bullish border border-bullish-border">
              <span className="h-1.5 w-1.5 rounded-full bg-bullish animate-pulse" />
              {overview.market_sentiment === 'risk_on'
                ? 'Risk On'
                : overview.market_sentiment === 'risk_off'
                  ? 'Risk Off'
                  : 'Mixed Signals'}
            </span>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">
          {overview.summary}
        </p>
      </motion.div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Bullish Sectors"
          value={overview.bullish_count}
          icon={TrendingUp}
          accent="bullish"
          subtitle="Showing momentum"
        />
        <MetricCard
          label="Bearish Sectors"
          value={overview.bearish_count}
          icon={TrendingDown}
          accent="bearish"
          subtitle="Under pressure"
        />
        <MetricCard
          label="Strongest Signal"
          value={overview.strongest_signal}
          icon={Zap}
          accent="default"
          subtitle="Highest conviction"
        />
        <MetricCard
          label="Top Risk"
          value={risks[0]?.title || 'None'}
          icon={ShieldAlert}
          accent="neutral"
          subtitle={risks[0]?.severity || ''}
        />
      </div>

      {/* Top Opportunities */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Top Opportunities</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Sectors ranked by confidence score</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {top_opportunities.slice(0, 3).map((opp, i) => (
            <OpportunityCard key={opp.name} opportunity={opp} index={i} />
          ))}
        </div>
      </section>

      {/* Charts + Insight row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectorMomentumChart opportunities={top_opportunities} />
        <InsightPanel
          title="Why This Matters"
          content={overview.summary}
        />
      </div>

      {/* Macro Drivers */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-text-primary">Macro Drivers</h2>
          <p className="text-xs text-text-tertiary mt-0.5">Key economic forces shaping markets</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {macro_drivers.slice(0, 4).map((driver, i) => (
            <DriverCard key={driver.title} driver={driver} index={i} />
          ))}
        </div>
      </section>

      {/* Risk Radar */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-text-primary">Risk Radar</h2>
          <p className="text-xs text-text-tertiary mt-0.5">Current risk factors to monitor</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risks.slice(0, 4).map((risk, i) => (
            <RiskCard key={risk.title} risk={risk} index={i} />
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="text-center py-6 border-t border-border">
        <p className="text-xs text-text-tertiary max-w-lg mx-auto">
          This analysis is for informational and research purposes only. It does not constitute
          financial advice, investment recommendations, or an offer to buy or sell securities.
        </p>
      </div>
    </div>
  );
}
