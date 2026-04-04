import { motion } from 'framer-motion';
import { useAnalysis } from '@/hooks/useAnalysis';
import { RiskCard } from '@/components/cards/RiskCard';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';

export function RiskMonitor() {
  const { data, loading } = useAnalysis();

  if (loading) return <DashboardSkeleton />;

  const { risks } = data;

  if (!risks.length) {
    return (
      <EmptyState
        title="No active risks"
        description="No significant risk factors have been identified in the current analysis."
      />
    );
  }

  const critical = risks.filter((r) => r.severity === 'critical' || r.severity === 'high');
  const moderate = risks.filter((r) => r.severity === 'medium');
  const low = risks.filter((r) => r.severity === 'low');

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Risk Monitor
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          {risks.length} risk factors under surveillance
        </p>
      </motion.div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-3">
        {critical.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-bearish-bg border border-bearish-border px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-bearish" />
            <span className="text-sm font-medium text-bearish">{critical.length} High / Critical</span>
          </div>
        )}
        {moderate.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-neutral-bg border border-neutral-border px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-neutral-signal" />
            <span className="text-sm font-medium text-neutral-signal">{moderate.length} Medium</span>
          </div>
        )}
        {low.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-bullish-bg border border-bullish-border px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-bullish" />
            <span className="text-sm font-medium text-bullish">{low.length} Low</span>
          </div>
        )}
      </div>

      {critical.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-bearish uppercase tracking-wider mb-4">
            High Priority
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {critical.map((r, i) => (
              <RiskCard key={r.title} risk={r} index={i} />
            ))}
          </div>
        </section>
      )}

      {moderate.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-neutral-signal uppercase tracking-wider mb-4">
            Moderate
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moderate.map((r, i) => (
              <RiskCard key={r.title} risk={r} index={i} />
            ))}
          </div>
        </section>
      )}

      {low.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-bullish uppercase tracking-wider mb-4">
            Low Priority
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {low.map((r, i) => (
              <RiskCard key={r.title} risk={r} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
