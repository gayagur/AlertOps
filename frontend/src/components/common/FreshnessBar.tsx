import { cn, formatIsraelTimeShort } from '@/lib/utils';
import { Shield, RefreshCw, AlertCircle, Clock } from 'lucide-react';

type FreshnessState = 'live' | 'updating' | 'delayed' | 'unknown';

interface FreshnessBarProps {
  source?: string;
  lastUpdated?: string | null;
  tier?: string;
  stale?: boolean;
  isFetching?: boolean;
}

function getState(stale?: boolean, isFetching?: boolean, lastUpdated?: string | null): FreshnessState {
  if (isFetching) return 'updating';
  if (stale) return 'delayed';
  if (lastUpdated) return 'live';
  return 'unknown';
}

const stateConfig: Record<FreshnessState, { icon: typeof Shield; label: string; color: string; dot: string }> = {
  live: { icon: Shield, label: 'Live', color: 'text-bullish', dot: 'bg-bullish' },
  updating: { icon: RefreshCw, label: 'Updating', color: 'text-accent', dot: 'bg-accent' },
  delayed: { icon: AlertCircle, label: 'Delayed', color: 'text-neutral-signal', dot: 'bg-neutral-signal' },
  unknown: { icon: Clock, label: 'Waiting', color: 'text-text-tertiary', dot: 'bg-text-tertiary' },
};

export function FreshnessBar({ source, lastUpdated, tier, stale, isFetching }: FreshnessBarProps) {
  const state = getState(stale, isFetching, lastUpdated);
  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 text-[11px] text-text-tertiary flex-wrap">
      {/* State indicator */}
      <span className={cn('inline-flex items-center gap-1.5 font-medium', config.color)}>
        {state === 'updating' ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : (
          <span className={cn('h-1.5 w-1.5 rounded-full', config.dot, state === 'live' && 'animate-pulse')} />
        )}
        {config.label}
      </span>

      {/* Source */}
      {source && (
        <span className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {source}
        </span>
      )}

      {/* Last updated */}
      {lastUpdated && (
        <span>Updated {formatIsraelTimeShort(lastUpdated)}</span>
      )}

      {/* Tier */}
      {tier && (
        <span className="rounded bg-background px-1.5 py-0.5 text-[10px]">
          {tier === 'realtime' ? '~5s' : tier === 'near_realtime' ? '~30s' : '~3min'}
        </span>
      )}

      {/* Stale warning */}
      {stale && (
        <span className="text-neutral-signal font-medium">Data may be delayed</span>
      )}

      {/* Timezone note */}
      <span className="text-[10px] opacity-60">Israel time</span>
    </div>
  );
}
