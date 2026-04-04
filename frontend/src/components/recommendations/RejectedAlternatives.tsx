import { XCircle } from 'lucide-react';
import type { RejectedAlternative } from '@/types/recommendations';

interface RejectedAlternativesProps {
  alternatives?: RejectedAlternative[];
}

export function RejectedAlternatives({ alternatives }: RejectedAlternativesProps) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-text-primary flex items-center gap-1.5">
        <XCircle className="h-3.5 w-3.5 text-text-tertiary" />
        Why not the others
      </p>
      <div className="space-y-2">
        {alternatives.map((alt) => (
          <div
            key={alt.symbol}
            className="flex items-start gap-3 rounded-lg bg-background/60 px-3 py-2.5"
          >
            <div className="shrink-0 h-8 w-8 rounded-lg bg-bearish-bg/50 flex items-center justify-center text-[10px] font-semibold text-text-tertiary">
              {alt.selection_score}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-text-secondary">{alt.symbol}</span>
                {alt.name && <span className="text-[11px] text-text-tertiary truncate">{alt.name}</span>}
              </div>
              <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">{alt.reason_rejected}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
