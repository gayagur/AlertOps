import { cn } from '@/lib/utils';
import { Shield, Scale, Flame } from 'lucide-react';

interface ProfileFitSectionProps {
  profileFit?: {
    conservative: string[];
    moderate: string[];
    aggressive: string[];
  };
}

const profiles = [
  { key: 'conservative' as const, label: 'Conservative', icon: Shield, color: 'text-bullish', bg: 'bg-bullish-bg', border: 'border-bullish-border' },
  { key: 'moderate' as const, label: 'Moderate', icon: Scale, color: 'text-accent', bg: 'bg-accent/[0.04]', border: 'border-accent/20' },
  { key: 'aggressive' as const, label: 'Aggressive', icon: Flame, color: 'text-neutral-signal', bg: 'bg-neutral-bg', border: 'border-neutral-border' },
];

export function ProfileFitSection({ profileFit }: ProfileFitSectionProps) {
  if (!profileFit) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-text-primary">Best fit by profile</p>
      <div className="grid grid-cols-3 gap-2">
        {profiles.map(({ key, label, icon: Icon, color, bg, border }) => (
          <div
            key={key}
            className={cn('rounded-xl border px-3 py-2.5', bg, border)}
          >
            <div className={cn('flex items-center gap-1.5 mb-2', color)}>
              <Icon className="h-3 w-3" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <div className="space-y-1">
              {profileFit[key].map((symbol) => (
                <span
                  key={symbol}
                  className="block font-mono text-xs font-medium text-text-primary"
                >
                  {symbol}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
