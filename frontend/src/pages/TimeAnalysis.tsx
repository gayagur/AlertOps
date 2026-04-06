import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer,
} from 'recharts';
import { Clock, TrendingUp, Calendar } from 'lucide-react';
import { MetricCard } from '@/components/cards/MetricCard';
import { InsightPanel } from '@/components/cards/InsightPanel';
import { FreshnessBar } from '@/components/common/FreshnessBar';
import { RegionSelector } from '@/components/common/RegionSelector';
import { mockTimeSeries, mockHeatmap } from '@/lib/mock-conflict';
import { useTimeSeries, useHeatmap } from '@/hooks/useLiveData';

const disclaimer =
  'This dashboard is intended for civilian informational use based on public official sources and historical data. It does not provide real-time tactical forecasting.';

export function TimeAnalysis() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const timeseriesQ = useTimeSeries();
  const heatmapQ = useHeatmap();

  const rawHeatmap = (heatmapQ.data?.data ?? mockHeatmap) as typeof mockHeatmap;
  const rawTimeSeries = (timeseriesQ.data?.data ?? mockTimeSeries) as typeof mockTimeSeries;

  // Filter heatmap by selected region
  const filteredHeatmap = useMemo(() => {
    if (!selectedRegion) return rawHeatmap;
    return rawHeatmap.filter((c) => c.region === selectedRegion);
  }, [rawHeatmap, selectedRegion]);

  // Hourly aggregation from filtered heatmap
  const hourlyData = useMemo(() => {
    const byHour: Record<number, number> = {};
    for (const cell of filteredHeatmap) {
      byHour[cell.hour] = (byHour[cell.hour] ?? 0) + cell.value;
    }
    return Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, '0')}:00`,
      value: byHour[h] ?? 0,
    }));
  }, [filteredHeatmap]);

  // Peak hour from filtered data
  const peakHour = useMemo(() => {
    let maxH = 0;
    let maxV = 0;
    for (const d of hourlyData) {
      if (d.value > maxV) { maxV = d.value; maxH = Number(d.hour.split(':')[0]); }
    }
    return maxH;
  }, [hourlyData]);

  // Busiest day
  const busiestDay = useMemo(() => {
    let max = rawTimeSeries[0] ?? { date: '—', alerts: 0 };
    for (const pt of rawTimeSeries) {
      if (pt.alerts > max.alerts) max = pt;
    }
    return max;
  }, [rawTimeSeries]);

  // 7-day trend
  const sevenDayTrend = useMemo(() => {
    const last7 = rawTimeSeries.slice(-7);
    const prev7 = rawTimeSeries.slice(-14, -7);
    const lastSum = last7.reduce((s, p) => s + p.alerts, 0);
    const prevSum = prev7.reduce((s, p) => s + p.alerts, 0);
    const regionLabel = selectedRegion ?? 'all regions';
    if (prevSum === 0) return `No prior data for comparison (${regionLabel})`;
    const pct = ((lastSum - prevSum) / prevSum * 100).toFixed(1);
    return Number(pct) > 0
      ? `Alerts for ${regionLabel} increased ${pct}% compared to the prior 7-day period`
      : `Alerts for ${regionLabel} decreased ${Math.abs(Number(pct))}% compared to the prior 7-day period`;
  }, [rawTimeSeries, selectedRegion]);

  // Heatmap grid data
  const heatRegions = useMemo(() => {
    const set = new Set<string>();
    for (const c of filteredHeatmap) set.add(c.region);
    return [...set];
  }, [filteredHeatmap]);

  const heatmapMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of filteredHeatmap) m.set(`${c.region}-${c.hour}`, c.value);
    return m;
  }, [filteredHeatmap]);

  const maxHeatVal = useMemo(() => {
    let max = 0;
    for (const c of filteredHeatmap) {
      if (c.value > max) max = c.value;
    }
    return max || 1;
  }, [filteredHeatmap]);

  const regionLabel = selectedRegion ?? 'All Regions';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
              Time Analysis
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Temporal patterns and trends — {regionLabel}
            </p>
          </div>
          <RegionSelector value={selectedRegion} onChange={setSelectedRegion} />
        </div>
        <div className="mt-3">
          <FreshnessBar
            source="Home Front Command"
            lastUpdated={heatmapQ.data?.source_last_updated}
            tier="aggregated"
            stale={heatmapQ.data?.stale}
            isFetching={heatmapQ.isFetching}
          />
        </div>
      </motion.div>

      {/* Trend Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Busiest Hour"
          value={`${String(peakHour).padStart(2, '0')}:00`}
          icon={Clock}
          accent="neutral"
          subtitle={`Peak activity — ${regionLabel}`}
        />
        <MetricCard
          label="Busiest Day"
          value={busiestDay.date}
          icon={Calendar}
          accent="neutral"
          subtitle={`${busiestDay.alerts} alerts recorded`}
        />
        <MetricCard
          label="7-Day Trend"
          value={`${rawTimeSeries.slice(-7).reduce((s, p) => s + p.alerts, 0)} alerts`}
          icon={TrendingUp}
          accent="default"
          subtitle="Last 7 days total"
        />
      </div>

      <InsightPanel title="Trend Summary" content={sevenDayTrend} />

      {/* Alerts Over Time */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-semibold text-text-primary mb-1">Alerts Over Time</h2>
        <p className="text-xs text-text-tertiary mb-4">Daily breakdown — {regionLabel}</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={rawTimeSeries}>
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

      {/* Hourly Activity Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-semibold text-text-primary mb-1">Hourly Activity Heatmap</h2>
        <p className="text-xs text-text-tertiary mb-4">
          Alert intensity by hour — {regionLabel}
        </p>
        <div className="overflow-x-auto">
          <div className="grid min-w-[800px]" style={{ gridTemplateColumns: '120px repeat(24, 1fr)' }}>
            <div className="text-[10px] text-text-tertiary font-medium p-1" />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-[10px] text-text-tertiary text-center font-medium p-1">{h}</div>
            ))}

            {heatRegions.map((region) => (
              <div key={region} className="contents">
                <div className="text-[11px] text-text-secondary font-medium p-1 flex items-center truncate">
                  {region}
                </div>
                {Array.from({ length: 24 }, (_, h) => {
                  const val = heatmapMap.get(`${region}-${h}`) ?? 0;
                  const opacity = 0.05 + (val / maxHeatVal) * 0.8;
                  return (
                    <div
                      key={h}
                      className="m-0.5 rounded-sm aspect-square min-h-[18px]"
                      style={{ backgroundColor: `rgba(30, 58, 95, ${opacity.toFixed(2)})` }}
                      title={`${region} ${String(h).padStart(2, '0')}:00 — ${val} events`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Activity by Hour */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-semibold text-text-primary mb-1">Activity by Hour</h2>
        <p className="text-xs text-text-tertiary mb-4">Aggregated alert volume — {regionLabel}</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid var(--color-border)' }} />
            <Bar dataKey="value" name="Events" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Footer */}
      <div className="border-t border-border-subtle pt-4">
        <p className="text-xs text-text-tertiary text-center">{disclaimer}</p>
      </div>
    </div>
  );
}
