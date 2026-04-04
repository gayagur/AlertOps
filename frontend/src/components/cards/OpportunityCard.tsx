import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DirectionPill } from '@/components/common/DirectionPill';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import { formatTimeHorizon } from '@/lib/utils';
import type { Opportunity } from '@/types/analysis';

interface OpportunityCardProps {
  opportunity: Opportunity;
  index: number;
}

export function OpportunityCard({ opportunity, index }: OpportunityCardProps) {
  const { name, direction, confidence, time_horizon, reasons, summary } = opportunity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Link
        to={`/analysis?sector=${encodeURIComponent(name)}`}
        className="group block rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:border-border-subtle"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-2">
              <DirectionPill direction={direction} />
              <span className="flex items-center gap-1 text-xs text-text-tertiary">
                <Clock className="h-3 w-3" />
                {formatTimeHorizon(time_horizon)}
              </span>
            </div>
          </div>
          <ConfidenceBadge value={confidence} size="md" />
        </div>

        {/* Summary */}
        <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-2">
          {summary}
        </p>

        {/* Key reasons */}
        <div className="space-y-1.5 mb-4">
          {reasons.slice(0, 2).map((reason, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-text-tertiary shrink-0" />
              <span className="line-clamp-1">{reason}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
          View full analysis
          <ArrowRight className="h-3 w-3 ml-1" />
        </div>
      </Link>
    </motion.div>
  );
}
