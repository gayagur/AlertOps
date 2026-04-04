import { motion } from 'framer-motion';
import { useAnalysis } from '@/hooks/useAnalysis';
import { OpportunityCard } from '@/components/cards/OpportunityCard';
import { SectorMomentumChart } from '@/components/charts/SectorMomentumChart';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';

export function Opportunities() {
  const { data, loading } = useAnalysis();

  if (loading) return <DashboardSkeleton />;

  const { top_opportunities } = data;

  if (!top_opportunities.length) {
    return (
      <EmptyState
        title="No opportunities found"
        description="The analysis engine hasn't identified any sector opportunities at this time."
      />
    );
  }

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Opportunities
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          {top_opportunities.length} sectors analyzed — ranked by conviction
        </p>
      </motion.div>

      <SectorMomentumChart opportunities={top_opportunities} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {top_opportunities.map((opp, i) => (
          <OpportunityCard key={opp.name} opportunity={opp} index={i} />
        ))}
      </div>
    </div>
  );
}
