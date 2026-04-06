import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { MapPin, Shield, Target, Clock, Bell, Calendar } from 'lucide-react';
import { SourceBadge } from '@/components/common/SourceBadge';
import { mockRegionStats } from '@/lib/mock-conflict';

const disclaimer =
  'This dashboard is intended for civilian informational use based on public official sources and historical data. It does not provide real-time tactical forecasting.';

export function RegionalAnalysis() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Regional Analysis
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Breakdown of alert and impact data by region.
        </p>
        <div className="mt-3">
          <SourceBadge sourceName="Home Front Command" sourceType="official" confidence="official" />
        </div>
      </motion.div>

      {/* Region Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mockRegionStats.map((r, i) => (
          <motion.div
            key={r.region}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
            className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow"
          >
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-text-primary">{r.region}</h3>
            </div>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Bell className="h-3 w-3 text-neutral-signal" />
                <span className="text-text-tertiary">Alerts</span>
                <span className="ml-auto font-medium text-text-primary">{r.alerts}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="h-3 w-3 text-bearish" />
                <span className="text-text-tertiary">Impacts</span>
                <span className="ml-auto font-medium text-text-primary">{r.impacts}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-bullish" />
                <span className="text-text-tertiary">Intercept.</span>
                <span className="ml-auto font-medium text-text-primary">{r.interceptions}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-text-tertiary" />
                <span className="text-text-tertiary">Peak</span>
                <span className="ml-auto font-medium text-text-primary">{String(r.peakHour).padStart(2, '0')}:00</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bell className="h-3 w-3 text-text-tertiary" />
                <span className="text-text-tertiary">24h</span>
                <span className="ml-auto font-medium text-text-primary">{r.last24hAlerts}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-text-tertiary" />
                <span className="text-text-tertiary">7d</span>
                <span className="ml-auto font-medium text-text-primary">{r.last7dAlerts}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts by Region */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-2xl border border-border bg-surface p-6"
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-text-primary">Alerts by Region</h2>
            <SourceBadge sourceName="Home Front Command" confidence="official" compact />
          </div>
          <p className="text-xs text-text-tertiary mb-4">Total cumulative alert count</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockRegionStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
              <XAxis dataKey="region" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid var(--color-border)' }} />
              <Bar dataKey="alerts" fill="var(--color-neutral-signal)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Impacts by Region */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="rounded-2xl border border-border bg-surface p-6"
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-text-primary">Impacts by Region</h2>
            <SourceBadge sourceName="Home Front Command" confidence="official" compact />
          </div>
          <p className="text-xs text-text-tertiary mb-4">Total reported impact events</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockRegionStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
              <XAxis dataKey="region" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid var(--color-border)' }} />
              <Bar dataKey="impacts" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Source + Disclaimer */}
      <div className="flex items-center justify-between">
        <SourceBadge sourceName="Home Front Command" confidence="official" compact />
      </div>
      <div className="border-t border-border-subtle pt-4">
        <p className="text-xs text-text-tertiary text-center">{disclaimer}</p>
      </div>
    </div>
  );
}
