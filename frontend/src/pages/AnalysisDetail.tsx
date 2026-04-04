import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAnalysis } from '@/hooks/useAnalysis';
import { DirectionPill } from '@/components/common/DirectionPill';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import { InsightPanel } from '@/components/cards/InsightPanel';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { formatTimeHorizon } from '@/lib/utils';

export function AnalysisDetail() {
  const [params] = useSearchParams();
  const sectorName = params.get('sector');
  const { data, loading } = useAnalysis();

  if (loading) return <DashboardSkeleton />;

  const opportunity = sectorName
    ? data.top_opportunities.find((o) => o.name === sectorName)
    : data.top_opportunities[0];

  if (!opportunity) {
    return (
      <div>
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <EmptyState
          title="Sector not found"
          description="The requested sector analysis is not available."
        />
      </div>
    );
  }

  const { name, direction, confidence, time_horizon, reasons, risks, summary } = opportunity;

  return (
    <div className="max-w-3xl space-y-8">
      <Link
        to="/opportunities"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to opportunities
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <DirectionPill direction={direction} />
              <span className="flex items-center gap-1 text-sm text-text-tertiary">
                <Clock className="h-3.5 w-3.5" />
                {formatTimeHorizon(time_horizon)}
              </span>
            </div>
          </div>
          <ConfidenceBadge value={confidence} size="lg" />
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-semibold text-text-primary mb-3">Analysis Summary</h2>
        <p className="text-sm text-text-secondary leading-relaxed">{summary}</p>
      </motion.div>

      {/* Reasons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-bullish" />
          Supporting Factors
        </h2>
        <div className="space-y-3">
          {reasons.map((reason, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="shrink-0 mt-1.5 h-5 w-5 rounded-full bg-bullish-bg text-bullish text-xs font-medium flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-text-secondary leading-relaxed">{reason}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Risks */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-bearish" />
          Risk Factors
        </h2>
        <div className="space-y-3">
          {risks.map((risk, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="shrink-0 mt-1.5 h-5 w-5 rounded-full bg-bearish-bg text-bearish text-xs font-medium flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-text-secondary leading-relaxed">{risk}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Insight */}
      <InsightPanel
        title="What This Means for Positioning"
        content={`${name} shows a ${direction} outlook with ${confidence}% confidence on a ${formatTimeHorizon(time_horizon).toLowerCase()} basis. ${direction === 'bullish' ? 'The favorable signal environment supports constructive positioning, though risk management remains essential.' : direction === 'bearish' ? 'Caution is warranted given the negative signal environment. Consider defensive positioning.' : 'Mixed signals suggest a neutral stance until directional clarity emerges.'}`}
      />

      {/* Disclaimer */}
      <div className="text-center py-4 border-t border-border">
        <p className="text-xs text-text-tertiary">
          This analysis is for research purposes only and does not constitute financial advice.
        </p>
      </div>
    </div>
  );
}
