import { motion } from 'framer-motion';
import { Shield, CheckCircle, BookOpen, Radio } from 'lucide-react';
import { SourceBadge } from '@/components/common/SourceBadge';
import { InsightPanel } from '@/components/cards/InsightPanel';
import { formatTimestamp } from '@/lib/utils';
import { mockOfficialUpdates, mockGuidance } from '@/lib/mock-conflict';

const disclaimer =
  'This dashboard is intended for civilian informational use based on public official sources and historical data. It does not provide real-time tactical forecasting.';

const categoryStyle: Record<string, string> = {
  alert: 'border-l-amber-400',
  guidance: 'border-l-accent',
  update: 'border-l-bullish',
  all_clear: 'border-l-bullish',
};

export function OfficialAlerts() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-accent/[0.06] flex items-center justify-center">
            <Shield className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
              Official Alerts &amp; Guidance
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Verified information from official public sources only.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <SourceBadge sourceName="Home Front Command" sourceType="official" confidence="official" />
        </div>
      </motion.div>

      {/* Latest Official Updates */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Radio className="h-4 w-4 text-accent" />
          Latest Official Updates
        </h2>
        <div className="space-y-4">
          {mockOfficialUpdates.map((update, i) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`rounded-2xl border border-border bg-surface p-6 border-l-4 ${categoryStyle[update.category] ?? ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text-primary">{update.title}</h3>
                <SourceBadge sourceName={update.sourceName} confidence="official" compact />
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{update.body}</p>
              <p className="text-xs text-text-tertiary mt-3">{formatTimestamp(update.timestamp)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Guidance Section */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent" />
          Public Guidance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockGuidance.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <h3 className="text-sm font-semibold text-text-primary mb-2">{g.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{g.body}</p>
              <div className="flex items-center gap-3 mt-3">
                <SourceBadge sourceName={g.sourceName} confidence="official" compact />
                <span className="text-xs text-text-tertiary">{formatTimestamp(g.issuedAt)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Source Verification Panel */}
      <InsightPanel
        title="Source Verification"
        content="All data displayed on this dashboard originates from official public sources, primarily the Home Front Command. Each data point is labeled with its source and verification status. Items marked 'Official' come directly from government channels. Items marked 'Verified' have been corroborated by multiple credible sources. Items marked 'Unverified' are included for completeness but should be treated with caution."
      />

      {/* Information Sources Panel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-bullish" />
          Information Sources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { name: 'Home Front Command', desc: 'Official government alert and guidance authority', type: 'official' as const },
            { name: 'Emergency Services', desc: 'First responder situation reports', type: 'official' as const },
            { name: 'Verified Media', desc: 'Corroborated reporting from credible outlets', type: 'verified' as const },
            { name: 'Public Reports', desc: 'Community-sourced information (labeled accordingly)', type: 'unverified' as const },
          ].map((source) => (
            <div key={source.name} className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle bg-background">
              <SourceBadge sourceName={source.name} confidence={source.type} compact />
              <div>
                <p className="text-xs font-medium text-text-primary">{source.name}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{source.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="border-t border-border-subtle pt-4">
        <p className="text-xs text-text-tertiary text-center">{disclaimer}</p>
      </div>
    </div>
  );
}
