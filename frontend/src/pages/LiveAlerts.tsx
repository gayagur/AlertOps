import { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Filter } from 'lucide-react';
import { useLiveAlerts } from '@/hooks/useLiveData';
import { FreshnessBar } from '@/components/common/FreshnessBar';
import { EventTypeBadge } from '@/components/common/EventTypeBadge';
import { SourceBadge } from '@/components/common/SourceBadge';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';
import { formatTimestamp, cn } from '@/lib/utils';
import { mockIncidents } from '@/lib/mock-conflict';
import type { EventType } from '@/types/conflict';

const EVENT_FILTERS: { value: EventType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'alert', label: 'Alerts' },
  { value: 'interception', label: 'Interceptions' },
  { value: 'impact', label: 'Impacts' },
  { value: 'launch_report', label: 'Launches' },
  { value: 'official_update', label: 'Updates' },
];

const disclaimer =
  'This dashboard is intended for civilian informational use based on public official sources and historical data. It does not provide real-time tactical forecasting.';

export function LiveAlerts() {
  const [filter, setFilter] = useState<EventType | 'all'>('all');
  const { data, isFetching, isLoading } = useLiveAlerts(50);

  if (isLoading) return <DashboardSkeleton />;

  const incidents: Array<Record<string, unknown>> = (data?.data ?? mockIncidents) as Array<Record<string, unknown>>;

  const filtered = filter === 'all'
    ? incidents
    : incidents.filter((inc) => String(inc.eventType ?? inc.alert_type) === filter);

  // Group by day
  const grouped = new Map<string, Array<Record<string, unknown>>>();
  for (const inc of filtered) {
    const ts = String(inc.timestamp ?? '');
    const day = ts ? new Date(ts).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown';
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(inc);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Live Alerts
          </h1>
          <span className="flex items-center gap-1.5 rounded-full bg-bearish-bg border border-bearish-border px-3 py-1 text-xs font-medium text-bearish">
            <Radio className="h-3 w-3 animate-pulse" />
            Real-time
          </span>
        </div>
        <p className="text-sm text-text-secondary mt-1">
          Official alerts as they are published. Refreshes every 5 seconds.
        </p>
        <div className="mt-3">
          <FreshnessBar
            source="Home Front Command"
            lastUpdated={data?.source_last_updated}
            tier="realtime"
            stale={data?.stale}
            isFetching={isFetching}
          />
        </div>
      </motion.div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-text-tertiary" />
        {EVENT_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              filter === f.value
                ? 'bg-accent text-white'
                : 'bg-background border border-border text-text-secondary hover:text-text-primary hover:border-border-subtle',
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="text-xs text-text-tertiary ml-2">
          {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Timeline grouped by day */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-text-tertiary">No events match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([day, events]) => (
            <div key={day}>
              <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                {day}
              </h2>
              <div className="space-y-2">
                {events.map((inc, idx) => {
                  const eventType = String(inc.eventType ?? inc.alert_type ?? 'alert');
                  const borderColor =
                    eventType === 'impact' ? 'border-l-bearish' :
                    eventType === 'interception' ? 'border-l-bullish' :
                    eventType === 'alert' ? 'border-l-amber-500' :
                    eventType === 'official_update' ? 'border-l-accent' :
                    'border-l-border';

                  return (
                    <motion.div
                      key={String(inc.id ?? idx)}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      className={cn(
                        'rounded-xl border border-border bg-surface p-4 border-l-4 transition-all hover:shadow-[var(--shadow-card-hover)]',
                        borderColor,
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <EventTypeBadge eventType={eventType as EventType} />
                            <span className="text-xs text-text-tertiary">
                              {formatTimestamp(String(inc.timestamp ?? ''))}
                            </span>
                            {inc.count && Number(inc.count) > 1 && (
                              <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                                ×{String(inc.count)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-text-primary">
                            {String(inc.title ?? 'Alert')}
                          </p>
                          {inc.description && (
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                              {String(inc.description)}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-xs text-text-tertiary">
                              {String(inc.region ?? (inc.areas as string[])?.join(', ') ?? '')}
                              {inc.city ? `, ${String(inc.city)}` : ''}
                            </span>
                            <SourceBadge
                              sourceName={String(inc.sourceName ?? inc.source ?? 'Home Front Command')}
                              confidence={String(inc.confidence ?? 'official') as 'official'}
                              compact
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border-subtle pt-4">
        <p className="text-xs text-text-tertiary text-center">{disclaimer}</p>
      </div>
    </div>
  );
}
