import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { ImpactPill } from '@/components/common/DirectionPill';
import type { MacroDriver } from '@/types/analysis';

interface DriverCardProps {
  driver: MacroDriver;
  index: number;
}

const impactIcons = {
  positive: TrendingUp,
  negative: TrendingDown,
  mixed: ArrowLeftRight,
};

export function DriverCard({ driver, index }: DriverCardProps) {
  const { title, impact, summary } = driver;
  const Icon = impactIcons[impact];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="flex gap-4 rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="shrink-0 mt-0.5">
        <div className="h-9 w-9 rounded-xl bg-background flex items-center justify-center">
          <Icon className="h-4 w-4 text-text-secondary" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-semibold text-text-primary truncate">{title}</h4>
          <ImpactPill impact={impact} />
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{summary}</p>
      </div>
    </motion.div>
  );
}
