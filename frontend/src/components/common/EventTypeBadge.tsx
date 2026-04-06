import { cn } from '@/lib/utils';
import { Siren, Rocket, Target, Shield, Megaphone } from 'lucide-react';
import type { EventType } from '@/types/conflict';

const config: Record<EventType, { icon: typeof Siren; label: string; color: string; bg: string; border: string }> = {
  alert: { icon: Siren, label: 'Alert', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  launch_report: { icon: Rocket, label: 'Launch', color: 'text-text-secondary', bg: 'bg-background', border: 'border-border' },
  impact: { icon: Target, label: 'Impact', color: 'text-bearish', bg: 'bg-bearish-bg', border: 'border-bearish-border' },
  interception: { icon: Shield, label: 'Interception', color: 'text-bullish', bg: 'bg-bullish-bg', border: 'border-bullish-border' },
  official_update: { icon: Megaphone, label: 'Update', color: 'text-accent', bg: 'bg-accent/[0.06]', border: 'border-accent/15' },
};

interface EventTypeBadgeProps {
  eventType: EventType;
}

export function EventTypeBadge({ eventType }: EventTypeBadgeProps) {
  const c = config[eventType];
  const Icon = c.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', c.bg, c.border, c.color)}>
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}
