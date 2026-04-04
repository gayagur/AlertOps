import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Instrument } from '@/types/recommendations';
import { ChevronDown, ChevronUp, ShieldCheck, Zap, Target, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const roleConfig: Record<string, { icon: typeof Zap; color: string; bg: string }> = {
  'Core Sector Exposure': { icon: ShieldCheck, color: 'text-accent', bg: 'bg-accent/[0.06]' },
  'High Conviction': { icon: Zap, color: 'text-bullish', bg: 'bg-bullish-bg' },
  'Quality Growth': { icon: TrendingUp, color: 'text-accent-light', bg: 'bg-accent/[0.04]' },
  default: { icon: Target, color: 'text-text-secondary', bg: 'bg-background' },
};

interface InstrumentRowProps {
  instrument: Instrument;
  index: number;
}

export function InstrumentRow({ instrument, index }: InstrumentRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { symbol, name, type, reason, risk, selection_score, role, why_selected, risk_notes } = instrument;

  const config = roleConfig[role || ''] || roleConfig.default;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <div
        className={cn(
          'group rounded-xl border border-border bg-surface transition-all duration-150',
          'hover:shadow-[var(--shadow-card-hover)] hover:border-border-subtle',
        )}
      >
        {/* Main row */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left px-4 py-3.5 flex items-center gap-3"
        >
          {/* Score badge */}
          {selection_score && (
            <div className={cn(
              'shrink-0 h-10 w-10 rounded-lg flex items-center justify-center text-sm font-semibold',
              selection_score >= 80 ? 'bg-bullish-bg text-bullish' :
              selection_score >= 65 ? 'bg-neutral-bg text-neutral-signal' :
              'bg-background text-text-tertiary',
            )}>
              {selection_score}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-text-primary">{symbol}</span>
              <span className={cn(
                'rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                type === 'ETF' ? 'bg-accent/[0.06] text-accent' : 'bg-background text-text-tertiary',
              )}>
                {type}
              </span>
              {role && (
                <span className={cn('flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium', config.bg, config.color)}>
                  <Icon className="h-3 w-3" />
                  {role}
                </span>
              )}
            </div>
            <p className="text-xs text-text-tertiary mt-0.5 truncate">{name}</p>
          </div>

          {/* Reason */}
          <p className="hidden lg:block text-xs text-text-secondary max-w-xs truncate">{reason}</p>

          {/* Expand */}
          <div className="shrink-0 text-text-tertiary">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {/* Expanded detail */}
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border px-4 py-4 space-y-3"
          >
            <div>
              <p className="text-xs font-medium text-text-primary mb-1">Why selected</p>
              {why_selected && why_selected.length > 0 ? (
                <ul className="space-y-1">
                  {why_selected.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                      <span className="mt-1 h-1 w-1 rounded-full bg-bullish shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-secondary">{reason}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-text-primary mb-1">Risk considerations</p>
              {risk_notes && risk_notes.length > 0 ? (
                <ul className="space-y-1">
                  {risk_notes.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                      <span className="mt-1 h-1 w-1 rounded-full bg-bearish shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-secondary">{risk}</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
