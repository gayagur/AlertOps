import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DirectionPill } from '@/components/common/DirectionPill';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import { InstrumentRow } from './InstrumentRow';
import { ProfileFitSection } from './ProfileFitSection';
import { RejectedAlternatives } from './RejectedAlternatives';
import { formatTimeHorizon } from '@/lib/utils';
import type { SectorRecommendation } from '@/types/recommendations';

interface RecommendationCardProps {
  rec: SectorRecommendation;
  index: number;
}

export function RecommendationCard({ rec, index }: RecommendationCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-5">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-text-primary tracking-tight">{rec.sector}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <DirectionPill direction={rec.direction} />
              <span className="flex items-center gap-1 text-xs text-text-tertiary">
                <Clock className="h-3 w-3" />
                {formatTimeHorizon(rec.time_horizon)}
              </span>
            </div>
          </div>
          <ConfidenceBadge value={rec.confidence} size="md" />
        </div>

        {/* Summary */}
        <p className="text-sm text-text-secondary leading-relaxed mb-4">{rec.summary}</p>

        {/* Why now */}
        <div className="rounded-xl bg-accent/[0.02] border border-accent/10 px-4 py-3 mb-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-text-primary mb-1">Why now</p>
              <p className="text-xs text-text-secondary leading-relaxed">{rec.why_now}</p>
            </div>
          </div>
        </div>

        {/* Key Drivers + Risks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <p className="text-xs font-medium text-text-primary mb-2">Key drivers</p>
            <ul className="space-y-1.5">
              {rec.key_drivers.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-bullish shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-text-primary mb-2">Risks</p>
            <ul className="space-y-1.5">
              {rec.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-bearish shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommended Instruments */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">
            Recommended Instruments
          </p>
          <div className="space-y-2">
            {rec.recommended_instruments.map((inst, i) => (
              <InstrumentRow key={inst.symbol} instrument={inst} index={i} />
            ))}
          </div>
        </div>

        {/* Allocation suggestion */}
        <div className="rounded-xl bg-background px-4 py-3 mb-5">
          <p className="text-xs font-medium text-text-primary mb-2">Allocation range</p>
          <div className="grid grid-cols-3 gap-3">
            {(['conservative', 'moderate', 'aggressive'] as const).map((profile) => (
              <div key={profile} className="text-center">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-0.5">{profile}</p>
                <p className="text-sm font-semibold text-text-primary">{rec.allocation_suggestion[profile]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profile fit */}
        <ProfileFitSection profileFit={rec.profile_fit} />
      </div>

      {/* Expandable details */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 px-6 py-3 text-xs font-medium transition-colors',
            showDetails ? 'text-text-primary bg-background' : 'text-text-tertiary hover:text-text-secondary hover:bg-background/50',
          )}
        >
          {showDetails ? 'Hide details' : 'Why these picks? • Rejected alternatives'}
          {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="px-6 pb-5 space-y-5"
          >
            {/* Strategy note */}
            {rec.strategy_note && (
              <div className="rounded-xl bg-background px-4 py-3">
                <p className="text-xs font-medium text-text-primary mb-1">Strategy note</p>
                <p className="text-xs text-text-secondary leading-relaxed">{rec.strategy_note}</p>
              </div>
            )}

            {/* Rejected alternatives */}
            <RejectedAlternatives alternatives={rec.rejected_alternatives} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
