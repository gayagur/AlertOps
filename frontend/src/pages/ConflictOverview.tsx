import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, Target, MapPin, Clock, Bell, Calendar } from 'lucide-react';
import { MetricCard } from '@/components/cards/MetricCard';
import { SourceBadge } from '@/components/common/SourceBadge';
import { FreshnessBar } from '@/components/common/FreshnessBar';
import { EventTypeBadge } from '@/components/common/EventTypeBadge';
import { formatTimestamp } from '@/lib/utils';
import { useLiveAlerts, useOverview, useRegionStats, useTimeSeries } from '@/hooks/useLiveData';
import {
  mockOverview, mockTimeSeries, mockRegionStats, mockIncidents,
  mockOfficialUpdates,
} from '@/lib/mock-conflict';

const disclaimer =
  'This dashboard is intended for civilian informational use based on public official sources and historical data. It does not provide real-time tactical forecasting.';

export function ConflictOverview() {
  // Live data with mock fallbacks
  const liveAlerts = useLiveAlerts(5);
  const overviewQ = useOverview();
  const regionsQ = useRegionStats();
  const timeseriesQ = useTimeSeries();

  // Resolve data: live envelope → mock fallback
  const overview = overviewQ.data?.data
    ? {
        totalAlerts: (overviewQ.data.data as Record<string, number>).total_alerts ?? mockOverview.totalAlerts,
        totalImpacts: mockOverview.totalImpacts,
        mostAffectedRegion: (overviewQ.data.data as Record<string, string>).most_affected_region ?? mockOverview.mostAffectedRegion,
        peakActivityHour: (overviewQ.data.data as Record<string, number>).peak_activity_hour ?? mockOverview.peakActivityHour,
        last24hAlerts: (overviewQ.data.data as Record<string, number>).last_24h_alerts ?? mockOverview.last24hAlerts,
        last7dAlerts: (overviewQ.data.data as Record<string, number>).last_7d_alerts ?? mockOverview.last7dAlerts,
        sourceName: mockOverview.sourceName,
        lastUpdated: overviewQ.data?.generated_at ?? mockOverview.lastUpdated,
      }
    : mockOverview;

  const recentIncidents: Array<Record<string, unknown>> = (liveAlerts.data?.data ?? mockIncidents.slice(0, 5)) as Array<Record<string, unknown>>;
  const regionBarData = regionsQ.data?.data
    ? (regionsQ.data.data as Array<{ region: string; alerts: number }>).map((r) => ({ region: r.region, alerts: r.alerts }))
    : mockRegionStats.map((r) => ({ region: r.region, alerts: r.alerts }));
  const timeSeriesData = (timeseriesQ.data?.data as typeof mockTimeSeries) ?? mockTimeSeries;
  const latestUpdate = mockOfficialUpdates[0];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Situation Overview
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Aggregated civilian alert data from official public sources.
        </p>
        <div className="mt-3">
          <FreshnessBar
            source={overview.sourceName}
            lastUpdated={overviewQ.data?.source_last_updated ?? overview.lastUpdated}
            tier={overviewQ.data?.freshness_tier}
            stale={overviewQ.data?.stale}
            isFetching={overviewQ.isFetching}
          />
        </div>
      </motion.div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Total Alerts" value={overview.totalAlerts.toLocaleString()} icon={Bell} accent="neutral" />
        <MetricCard label="Total Impacts" value={overview.totalImpacts.toLocaleString()} icon={Target} accent="bearish" />
        <MetricCard label="Most Affected" value={overview.mostAffectedRegion} icon={MapPin} accent="default" />
        <MetricCard label="Peak Hour" value={`${String(overview.peakActivityHour).padStart(2, '0')}:00`} icon={Clock} accent="default" />
        <MetricCard label="24h Alerts" value={overview.last24hAlerts} icon={AlertTriangle} accent="neutral" />
        <MetricCard label="7d Alerts" value={overview.last7dAlerts} icon={Calendar} accent="neutral" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-2xl border border-border bg-surface p-6"
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-text-primary">Alerts Over Time</h2>
          </div>
          <p className="text-xs text-text-tertiary mb-2">Daily alert, impact, and interception counts</p>
          <FreshnessBar
            source="Home Front Command"
            lastUpdated={timeseriesQ.data?.source_last_updated}
            tier="aggregated"
            stale={timeseriesQ.data?.stale}
            isFetching={timeseriesQ.isFetching}
          />
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid var(--color-border)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="alerts" stroke="var(--color-neutral-signal)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="impacts" stroke="var(--color-bearish)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="interceptions" stroke="var(--color-bullish)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Regional Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="rounded-2xl border border-border bg-surface p-6"
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-text-primary">Regional Distribution</h2>
          </div>
          <p className="text-xs text-text-tertiary mb-2">Total alerts by region</p>
          <FreshnessBar
            source="Home Front Command"
            lastUpdated={regionsQ.data?.source_last_updated}
            tier="near_realtime"
            stale={regionsQ.data?.stale}
            isFetching={regionsQ.isFetching}
          />
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={regionBarData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
                <YAxis dataKey="region" type="category" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} width={100} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid var(--color-border)' }} />
                <Bar dataKey="alerts" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Incidents + Latest Update */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Incidents */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-text-primary">Recent Incidents</h2>
          </div>
          <FreshnessBar
            source="Home Front Command"
            lastUpdated={liveAlerts.data?.source_last_updated}
            tier="realtime"
            stale={liveAlerts.data?.stale}
            isFetching={liveAlerts.isFetching}
          />
          <div className="space-y-3 mt-3">
            {recentIncidents.slice(0, 5).map((inc, idx) => (
              <div key={String(inc.id ?? idx)} className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle bg-background">
                <div className="shrink-0 mt-0.5">
                  <EventTypeBadge eventType={String(inc.eventType ?? inc.alert_type ?? 'alert') as 'alert'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{String(inc.title ?? 'Alert')}</p>
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{String(inc.description ?? '')}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-text-tertiary">
                    <span>{String(inc.region ?? (inc.areas as string[])?.join(', ') ?? '')}</span>
                    <span>{formatTimestamp(String(inc.timestamp ?? ''))}</span>
                    <SourceBadge sourceName={String(inc.source ?? 'Home Front Command')} confidence="official" compact />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Latest Official Update */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="rounded-2xl border border-border bg-surface p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Latest Official Update</h2>
            <SourceBadge sourceName={latestUpdate.sourceName} confidence="official" compact />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-primary">{latestUpdate.title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{latestUpdate.body}</p>
            <p className="text-xs text-text-tertiary">{formatTimestamp(latestUpdate.timestamp)}</p>
          </div>
        </motion.div>
      </div>

      {/* Footer Disclaimer */}
      <div className="border-t border-border-subtle pt-4">
        <p className="text-xs text-text-tertiary text-center">{disclaimer}</p>
      </div>
    </div>
  );
}
