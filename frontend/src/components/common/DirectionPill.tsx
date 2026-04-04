import { cn } from '@/lib/utils';
import type { Direction, Impact, Severity } from '@/types/analysis';

interface DirectionPillProps {
  direction: Direction;
}

export function DirectionPill({ direction }: DirectionPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase',
        direction === 'bullish' && 'bg-bullish-bg text-bullish border border-bullish-border',
        direction === 'bearish' && 'bg-bearish-bg text-bearish border border-bearish-border',
        direction === 'neutral' && 'bg-neutral-bg text-neutral-signal border border-neutral-border',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          direction === 'bullish' && 'bg-bullish',
          direction === 'bearish' && 'bg-bearish',
          direction === 'neutral' && 'bg-neutral-signal',
        )}
      />
      {direction}
    </span>
  );
}

interface ImpactPillProps {
  impact: Impact;
}

export function ImpactPill({ impact }: ImpactPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase',
        impact === 'positive' && 'bg-bullish-bg text-bullish border border-bullish-border',
        impact === 'negative' && 'bg-bearish-bg text-bearish border border-bearish-border',
        impact === 'mixed' && 'bg-neutral-bg text-neutral-signal border border-neutral-border',
      )}
    >
      {impact}
    </span>
  );
}

interface SeverityPillProps {
  severity: Severity;
}

export function SeverityPill({ severity }: SeverityPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase',
        severity === 'critical' && 'bg-bearish-bg text-bearish border border-bearish-border',
        severity === 'high' && 'bg-bearish-bg text-bearish border border-bearish-border',
        severity === 'medium' && 'bg-neutral-bg text-neutral-signal border border-neutral-border',
        severity === 'low' && 'bg-bullish-bg text-bullish border border-bullish-border',
      )}
    >
      {severity}
    </span>
  );
}
