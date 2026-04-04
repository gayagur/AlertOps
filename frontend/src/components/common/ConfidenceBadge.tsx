import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceBadge({ value, size = 'md' }: ConfidenceBadgeProps) {
  const getColor = () => {
    if (value >= 75) return 'text-bullish';
    if (value >= 50) return 'text-neutral-signal';
    return 'text-bearish';
  };

  const getTrackColor = () => {
    if (value >= 75) return 'stroke-bullish';
    if (value >= 50) return 'stroke-neutral-signal';
    return 'stroke-bearish';
  };

  const dimensions = { sm: 40, md: 56, lg: 72 };
  const strokeWidths = { sm: 3, md: 4, lg: 5 };
  const fontSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' };

  const dim = dimensions[size];
  const sw = strokeWidths[size];
  const radius = (dim - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          strokeWidth={sw}
          className="stroke-border"
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          strokeWidth={sw}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-700', getTrackColor())}
        />
      </svg>
      <span
        className={cn(
          'absolute font-semibold',
          fontSizes[size],
          getColor(),
        )}
      >
        {value}
      </span>
    </div>
  );
}
