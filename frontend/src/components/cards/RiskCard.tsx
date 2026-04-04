import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { SeverityPill } from '@/components/common/DirectionPill';
import { cn } from '@/lib/utils';
import type { RiskItem } from '@/types/analysis';

interface RiskCardProps {
  risk: RiskItem;
  index: number;
}

export function RiskCard({ risk, index }: RiskCardProps) {
  const { title, severity, category, description } = risk;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'rounded-2xl border bg-surface p-5 transition-all duration-200 hover:shadow-[var(--shadow-card-hover)]',
        severity === 'critical' && 'border-bearish-border',
        severity === 'high' && 'border-bearish-border/50',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={cn(
              'h-4 w-4',
              severity === 'critical' || severity === 'high' ? 'text-bearish' : 'text-neutral-signal',
            )}
          />
          <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
        </div>
        <SeverityPill severity={severity} />
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mb-3">
        {description}
      </p>

      <span className="inline-flex items-center rounded-md bg-background px-2 py-1 text-[11px] font-medium text-text-tertiary">
        {category}
      </span>
    </motion.div>
  );
}
