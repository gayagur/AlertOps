import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, Target, MapPin, Clock, Bell, Calendar } from 'lucide-react';
import { MetricCard } from '@/components/cards/MetricCard';
import { SourceBadge } from '@/components/common/SourceBadge';
import { EventTypeBadge } from '@/components/common/EventTypeBadge';
import { formatTimestamp } from '@/lib/utils';
import {
  mockOverview, mockTimeSeries, mockRegionStats, mockIncidents,
  mockOfficialUpdates,
} from '@/lib/mock-conflict';

const disclaimer =
  'This dashboard is intended for civilian informational use based on public official sources and historical data. It does not provide real-time tactical forecasting.';

export function ConflictOverview() {
  const overview = mockOverview;
  const recentIncidents = mockIncidents.slice(0, 5);
  const latestUpdate = mockOfficialUpdates[0];

  const regionBarData = mockRegionStats.map((r) => ({
    region: r.region,
    alerts: r.alerts,
  }));

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
          <SourceBadge
            sourceName={overview.sourceName}
            sourceType="official"
            confidence="official"
            timestamp={overview.lastUpdated}
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
            <SourceBadge sourceName="Home Front Command" confidence="official" compact />
          </div>
          <p className="text-xs text-text-tertiary mb-4">Daily alert, impact, and interception counts</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={mockTimeSeries}>
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
            <SourceBadge sourceName="Home Front Command" confidence="official" compact />
          </div>
          <p className="text-xs text-text-tertiary mb-4">Total alerts by region</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={regionBarData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
              <YAxis dataKey="region" type="category" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} width={100} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid var(--color-border)' }} />
              <Bar dataKey="alerts" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Recent Incidents</h2>
            <SourceBadge sourceName="Home Front Command" confidence="official" compact />
          </div>
          <div className="space-y-3">
            {recentIncidents.map((inc) => (
              <div key={inc.id} className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle bg-background">
                <div className="shrink-0 mt-0.5">
                  <EventTypeBadge eventType={inc.eventType} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{inc.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{inc.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-text-tertiary">
                    <span>{inc.region}{inc.city ? `, ${inc.city}` : ''}</span>
                    <span>{formatTimestamp(inc.timestamp)}</span>
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
