import { motion } from 'framer-motion';
import { useAnalysis } from '@/hooks/useAnalysis';
import { DriverCard } from '@/components/cards/DriverCard';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';

export function MacroDrivers() {
  const { data, loading } = useAnalysis();

  if (loading) return <DashboardSkeleton />;

  const { macro_drivers } = data;

  if (!macro_drivers.length) {
    return (
      <EmptyState
        title="No macro data available"
        description="Macro economic indicators are not yet available for this analysis period."
      />
    );
  }

  const positive = macro_drivers.filter((d) => d.impact === 'positive');
  const negative = macro_drivers.filter((d) => d.impact === 'negative');
  const mixed = macro_drivers.filter((d) => d.impact === 'mixed');

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Macro Drivers
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          Economic forces shaping market direction
        </p>
      </motion.div>

      {positive.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-bullish uppercase tracking-wider mb-4">
            Tailwinds
          </h2>
          <div className="space-y-3">
            {positive.map((d, i) => (
              <DriverCard key={d.title} driver={d} index={i} />
            ))}
          </div>
        </section>
      )}

      {mixed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-neutral-signal uppercase tracking-wider mb-4">
            Mixed Signals
          </h2>
          <div className="space-y-3">
            {mixed.map((d, i) => (
              <DriverCard key={d.title} driver={d} index={i} />
            ))}
          </div>
        </section>
      )}

      {negative.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-bearish uppercase tracking-wider mb-4">
            Headwinds
          </h2>
          <div className="space-y-3">
            {negative.map((d, i) => (
              <DriverCard key={d.title} driver={d} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
