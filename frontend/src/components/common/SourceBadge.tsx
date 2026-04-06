import { cn } from '@/lib/utils';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import type { Confidence, SourceType } from '@/types/conflict';

interface SourceBadgeProps {
  sourceName: string;
  sourceType?: SourceType;
  confidence?: Confidence;
  timestamp?: string;
  compact?: boolean;
}

const confidenceConfig = {
  official: { icon: Shield, label: 'Official', color: 'text-accent', bg: 'bg-accent/[0.06]', border: 'border-accent/15' },
  verified: { icon: CheckCircle, label: 'Verified', color: 'text-bullish', bg: 'bg-bullish-bg', border: 'border-bullish-border' },
  unverified: { icon: AlertCircle, label: 'Unverified', color: 'text-neutral-signal', bg: 'bg-neutral-bg', border: 'border-neutral-border' },
};

export function SourceBadge({ sourceName, confidence = 'official', timestamp, compact }: SourceBadgeProps) {
  const config = confidenceConfig[confidence];
  const Icon = config.icon;

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium', config.bg, config.border, config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs text-text-tertiary">
      <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium', config.bg, config.border, config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
      <span>Source: {sourceName}</span>
      {formattedTime && <span>Updated: {formattedTime}</span>}
    </div>
  );
}
