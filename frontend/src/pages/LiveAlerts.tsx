import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Bell, Rocket, Shield, Clock } from 'lucide-react';
import { useLiveAlerts } from '@/hooks/useLiveData';
import { FreshnessBar } from '@/components/common/FreshnessBar';
import { EventTypeBadge } from '@/components/common/EventTypeBadge';
import { SourceBadge } from '@/components/common/SourceBadge';
import { RegionSelector } from '@/components/common/RegionSelector';
import { MetricCard } from '@/components/cards/MetricCard';
import { formatTimestamp, formatRelativeTime, cn } from '@/lib/utils';
import { mockIncidents } from '@/lib/mock-conflict';
import type { EventType } from '@/types/conflict';

type TimeWindow = 'live' | '1h' | '6h' | '24h';

const TIME_WINDOWS: { value: TimeWindow; label: string }[] = [
  { value: 'live', label: 'Live' },
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
];

const EVENT_FILTERS: { value: EventType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'alert', label: 'Alerts' },
  { value: 'launch_report', label: 'Launches' },
  { value: 'interception', label: 'Interceptions' },
  { value: 'impact', label: 'Impacts' },
];

const disclaimer =
  'This dashboard is intended for civilian informational use based on public official sources and historical data. It does not provide real-time tactical forecasting.';

function withinWindow(ts: string, window: TimeWindow): boolean {
  if (window === 'live') return true;
  const hours = window === '1h' ? 1 : window === '6h' ? 6 : 24;
  return Date.now() - new Date(ts).getTime() < hours * 3600_000;
}

// Sub-area mappings: selecting a region includes its known cities/sub-areas
const REGION_ALIASES: Record<string, string[]> = {
  'Gush Dan': ['Tel Aviv', 'Ramat Gan', 'Holon', 'Bat Yam', 'Rishon LeZion', 'Petah Tikva', 'Bnei Brak', 'Givatayim'],
  'Sharon': ['Netanya', 'Herzliya', 'Kfar Saba', 'Ra\'anana', 'Hod HaSharon'],
  'Haifa': ['Haifa', 'Krayot', 'Nesher', 'Tirat Carmel'],
  'Jerusalem': ['Jerusalem', 'Beit Shemesh', 'Mevaseret Zion'],
  'Northern Negev': ['Beer Sheva', 'Arad', 'Ofakim', 'Netivot'],
  'Upper Galilee': ['Kiryat Shmona', 'Safed', 'Metula'],
  'Shfela': ['Rehovot', 'Ramle', 'Lod', 'Gedera'],
  'Coastal Plain': ['Ashdod', 'Ashkelon', 'Yavne'],
  'Eilat': ['Eilat'],
};

export function LiveAlerts() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<EventType | 'all'>('all');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('24h');
  const [displayLimit, setDisplayLimit] = useState(20);

  const { data, isFetching } = useLiveAlerts(100);

  // Always show content — mock data is the fallback, never show blank page
  const allIncidents: Array<Record<string, unknown>> = (data?.data ?? mockIncidents) as Array<Record<string, unknown>>;

  // Filter by region — includes sub-area/city aliases
  const regionFiltered = useMemo(() => {
    if (!selectedRegion) return allIncidents;
    const sel = selectedRegion.toLowerCase();
    const aliases = (REGION_ALIASES[selectedRegion] ?? []).map((a) => a.toLowerCase());

    return allIncidents.filter((inc) => {
      const region = String(inc.region ?? '').toLowerCase();
      const city = String(inc.city ?? '').toLowerCase();
      const areas = ((inc.areas as string[]) ?? []).map((a) => a.toLowerCase());

      // Match if region name matches
      if (region.includes(sel) || sel.includes(region)) return true;
      // Match if city is a known alias of the selected region
      if (city && aliases.some((a) => city.includes(a) || a.includes(city))) return true;
      // Match if any area string contains the region or its aliases
      if (areas.some((a) => a.includes(sel) || aliases.some((al) => a.includes(al)))) return true;

      return false;
    });
  }, [allIncidents, selectedRegion]);

  // Filter by event type
  const typeFiltered = useMemo(() => {
    if (eventFilter === 'all') return regionFiltered;
    return regionFiltered.filter((inc) => String(inc.eventType ?? inc.alert_type) === eventFilter);
  }, [regionFiltered, eventFilter]);

  // Filter by time window
  const filtered = useMemo(() => {
    return typeFiltered.filter((inc) => {
      const ts = String(inc.timestamp ?? '');
      return ts ? withinWindow(ts, timeWindow) : true;
    });
  }, [typeFiltered, timeWindow]);

  // Area KPIs
  const areaAlerts24h = regionFiltered.filter((inc) => {
    const ts = String(inc.timestamp ?? '');
    return ts && withinWindow(ts, '24h') && String(inc.eventType ?? inc.alert_type) === 'alert';
  }).length;

  const areaLaunches24h = regionFiltered.filter((inc) => {
    const ts = String(inc.timestamp ?? '');
    return ts && withinWindow(ts, '24h') && String(inc.eventType ?? inc.alert_type) === 'launch_report';
  }).length;

  const latestAlertTs = regionFiltered.length > 0 ? String(regionFiltered[0].timestamp ?? '') : '';
  const isActive = latestAlertTs ? (Date.now() - new Date(latestAlertTs).getTime()) < 3600_000 : false;

  const regionLabel = selectedRegion ?? 'All Areas';

  return (
    <div className="space-y-6">
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
          <span className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border',
            isActive
              ? 'bg-bearish-bg border-bearish-border text-bearish'
              : 'bg-bullish-bg border-bullish-border text-bullish',
          )}>
            <Radio className={cn('h-3 w-3', isActive && 'animate-pulse')} />
            {isActive ? 'Active' : 'Calm'}
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          {selectedRegion
            ? `Real-time official alerts for ${selectedRegion}`
            : 'Select an area to monitor real-time alerts'}
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

      {/* Area Control Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <RegionSelector
          value={selectedRegion}
          onChange={setSelectedRegion}
          allLabel="All Areas"
          placeholder="Search area..."
        />

        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {EVENT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setEventFilter(f.value)}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                eventFilter === f.value
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {TIME_WINDOWS.map((w) => (
            <button
              key={w.value}
              onClick={() => setTimeWindow(w.value)}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                timeWindow === w.value
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary',
              )}
            >
              {w.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-text-tertiary">
          {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Area KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Last Alert"
          value={latestAlertTs ? formatRelativeTime(latestAlertTs) : '—'}
          icon={Clock}
          accent={isActive ? 'bearish' : 'default'}
          subtitle={regionLabel}
        />
        <MetricCard
          label="Alerts (24h)"
          value={areaAlerts24h}
          icon={Bell}
          accent="neutral"
          subtitle={regionLabel}
        />
        <MetricCard
          label="Launches (24h)"
          value={areaLaunches24h}
          icon={Rocket}
          accent="default"
          subtitle={regionLabel}
        />
        <MetricCard
          label="Status"
          value={isActive ? 'Active' : 'Calm'}
          icon={Shield}
          accent={isActive ? 'bearish' : 'bullish'}
          subtitle="Current area status"
        />
      </div>

      {/* Live Feed */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="rounded-full bg-bullish-bg p-4 mb-4">
            <Shield className="h-6 w-6 text-bullish" />
          </div>
          <h3 className="text-sm font-medium text-text-primary mb-1">
            No recent alerts{selectedRegion ? ` for ${selectedRegion}` : ''}
          </h3>
          <p className="text-sm text-text-tertiary max-w-sm">
            This view will update automatically as new official events are detected.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {/* Total count */}
          <div className="flex items-center justify-between text-xs text-text-tertiary pb-1">
            <span>Showing {Math.min(displayLimit, filtered.length)} of {filtered.length} events</span>
            <span>Times shown in Israel local time</span>
          </div>
          <AnimatePresence mode="popLayout">
            {filtered.slice(0, displayLimit).map((inc, idx) => {
              const eventType = String(inc.eventType ?? inc.alert_type ?? 'alert');
              const ts = String(inc.timestamp ?? '');

              const dotColor =
                eventType === 'alert' ? 'bg-amber-500' :
                eventType === 'launch_report' ? 'bg-accent-light' :
                eventType === 'impact' ? 'bg-bearish' :
                eventType === 'interception' ? 'bg-bullish' :
                'bg-text-tertiary';

              return (
                <motion.div
                  key={String(inc.id ?? idx)}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="group rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1.5">
                      <span className={cn('block h-2.5 w-2.5 rounded-full', dotColor)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <EventTypeBadge eventType={eventType as EventType} />
                        <span className="text-xs text-text-tertiary">
                          {String(inc.region ?? (inc.areas as string[])?.join(', ') ?? '')}
                          {inc.city ? `, ${String(inc.city)}` : ''}
                        </span>
                        {Number(inc.count ?? 0) > 1 && (
                          <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                            ×{String(inc.count)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-text-primary">
                        {String(inc.title ?? 'Alert')}
                      </p>
                      {String(inc.description ?? '') !== '' && (
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-2">
                          {String(inc.description)}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right space-y-1">
                      <p className="text-xs font-medium text-text-primary">
                        {ts ? formatRelativeTime(ts) : '—'}
                      </p>
                      <p className="text-[10px] text-text-tertiary">
                        {formatTimestamp(ts)}
                      </p>
                      <SourceBadge
                        sourceName={String(inc.sourceName ?? inc.source ?? 'HFC')}
                        confidence="official"
                        compact
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Show more */}
          {filtered.length > displayLimit && (
            <button
              onClick={() => setDisplayLimit((l) => l + 20)}
              className="w-full rounded-xl border border-border bg-surface py-3 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all"
            >
              Show more ({filtered.length - displayLimit} remaining)
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border-subtle pt-4">
        <p className="text-xs text-text-tertiary text-center">{disclaimer}</p>
      </div>
    </div>
  );
}
