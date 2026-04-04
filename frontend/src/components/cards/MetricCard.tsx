import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'default' | 'bullish' | 'bearish' | 'neutral';
  subtitle?: string;
}

export function MetricCard({ label, value, icon: Icon, accent = 'default', subtitle }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group rounded-2xl border bg-surface p-5 transition-all duration-200 hover:shadow-[var(--shadow-card-hover)]',
        'shadow-[var(--shadow-card)]',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          {label}
        </span>
        <div
          className={cn(
            'rounded-lg p-2 transition-colors',
            accent === 'bullish' && 'bg-bullish-bg',
            accent === 'bearish' && 'bg-bearish-bg',
            accent === 'neutral' && 'bg-neutral-bg',
            accent === 'default' && 'bg-background',
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4',
              accent === 'bullish' && 'text-bullish',
              accent === 'bearish' && 'text-bearish',
              accent === 'neutral' && 'text-neutral-signal',
              accent === 'default' && 'text-text-tertiary',
            )}
          />
        </div>
      </div>
      <div className="text-2xl font-semibold text-text-primary tracking-tight truncate" title={String(value)}>
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-text-tertiary mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
}
