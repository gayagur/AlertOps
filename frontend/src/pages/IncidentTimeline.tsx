import { useState, useMemo, Fragment } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SourceBadge } from '@/components/common/SourceBadge';
import { EventTypeBadge } from '@/components/common/EventTypeBadge';
import { formatTimestamp } from '@/lib/utils';
import { mockIncidents } from '@/lib/mock-conflict';
import type { EventType } from '@/types/conflict';

const disclaimer =
  'This dashboard is intended for civilian informational use based on public official sources and historical data. It does not provide real-time tactical forecasting.';

const eventTypes: EventType[] = ['alert', 'launch_report', 'impact', 'interception', 'official_update'];

const borderByType: Record<EventType, string> = {
  alert: 'border-l-amber-400',
  launch_report: 'border-l-text-secondary',
  impact: 'border-l-bearish',
  interception: 'border-l-bullish',
  official_update: 'border-l-accent',
};

export function IncidentTimeline() {
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const inc of mockIncidents) set.add(inc.region);
    return ['all', ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() => {
    return mockIncidents.filter((inc) => {
      if (typeFilter !== 'all' && inc.eventType !== typeFilter) return false;
      if (regionFilter !== 'all' && inc.region !== regionFilter) return false;
      return true;
    });
  }, [typeFilter, regionFilter]);

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const inc of filtered) {
      const day = inc.timestamp.split('T')[0];
      const arr = map.get(day) ?? [];
      arr.push(inc);
      map.set(day, arr);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Incident Timeline
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Chronological feed of reported incidents from official sources.
        </p>
        <div className="mt-3">
          <SourceBadge sourceName="Home Front Command" sourceType="official" confidence="official" />
        </div>
      </motion.div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-border bg-surface p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Filter:</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTypeFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              typeFilter === 'all'
                ? 'bg-accent text-white'
                : 'bg-background text-text-secondary border border-border hover:bg-surface-hover',
            )}
          >
            All Types
          </button>
          {eventTypes.map((et) => (
            <button
              key={et}
              onClick={() => setTypeFilter(et)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                typeFilter === et
                  ? 'bg-accent text-white'
                  : 'bg-background text-text-secondary border border-border hover:bg-surface-hover',
              )}
            >
              {et === 'launch_report' ? 'Launch' : et === 'official_update' ? 'Update' : et.charAt(0).toUpperCase() + et.slice(1)}
            </button>
          ))}
        </div>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-background border border-border text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          {regions.map((r) => (
            <option key={r} value={r}>{r === 'all' ? 'All Regions' : r}</option>
          ))}
        </select>
      </div>

      {/* Timeline Feed */}
      <div className="space-y-6">
        {grouped.length === 0 && (
          <div className="text-center py-12 text-sm text-text-tertiary">
            No incidents match the selected filters.
          </div>
        )}
        {grouped.map(([day, incidents]) => (
          <Fragment key={day}>
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-text-secondary bg-background border border-border rounded-lg px-3 py-1">
                {new Date(day + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>
            <div className="space-y-3">
              {incidents.map((inc, idx) => (
                <motion.div
                  key={inc.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  className={cn(
                    'rounded-2xl border border-border bg-surface p-5 border-l-4',
                    borderByType[inc.eventType],
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <EventTypeBadge eventType={inc.eventType} />
                    <SourceBadge sourceName={inc.sourceName} confidence={inc.confidence} compact />
                    <span className="text-xs text-text-tertiary ml-auto">
                      {formatTimestamp(inc.timestamp)}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-text-primary">{inc.title}</h3>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">{inc.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-text-tertiary">
                    <span>{inc.region}{inc.city ? `, ${inc.city}` : ''}</span>
                    {inc.count != null && (
                      <span className="bg-background border border-border-subtle rounded px-1.5 py-0.5 text-[10px]">
                        Count: {inc.count}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Fragment>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border-subtle pt-4">
        <p className="text-xs text-text-tertiary text-center">{disclaimer}</p>
      </div>
    </div>
  );
}
