/**
 * Live Data Hooks
 * ===============
 * Each hook is assigned to a freshness tier with appropriate refetch intervals.
 *
 * Tier 1 (5s):  live alerts, incident feed
 * Tier 2 (30s): overview KPIs, region stats, official updates
 * Tier 3 (3min): heatmaps, time series, trend charts
 */

import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

async function fetchLive<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export interface FreshnessEnvelope<T> {
  generated_at: string;
  source_last_updated: string | null;
  freshness_tier: 'realtime' | 'near_realtime' | 'aggregated';
  source: string;
  stale: boolean;
  data: T;
}

// ─── Tier 1: Real-time (5s) ──────────────────────────────────────

export function useLiveAlerts(limit = 20) {
  return useQuery({
    queryKey: ['alerts', 'live', limit],
    queryFn: () => fetchLive<FreshnessEnvelope<unknown[]>>(`/alerts/live?limit=${limit}`),
    refetchInterval: 5_000,
  });
}

// ─── Tier 2: Near real-time (30s) ────────────────────────────────

export function useOverview() {
  return useQuery({
    queryKey: ['overview'],
    queryFn: () => fetchLive<FreshnessEnvelope<Record<string, unknown>>>('/overview'),
    refetchInterval: 30_000,
  });
}

export function useRegionStats() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => fetchLive<FreshnessEnvelope<unknown[]>>('/regions'),
    refetchInterval: 30_000,
  });
}

// ─── Tier 3: Aggregated (3min) ───────────────────────────────────

export function useTimeSeries(days = 14) {
  return useQuery({
    queryKey: ['timeseries', days],
    queryFn: () => fetchLive<FreshnessEnvelope<unknown[]>>(`/timeseries?days=${days}`),
    refetchInterval: 180_000,
  });
}

export function useHeatmap(days = 7) {
  return useQuery({
    queryKey: ['heatmap', days],
    queryFn: () => fetchLive<FreshnessEnvelope<unknown[]>>(`/heatmap?days=${days}`),
    refetchInterval: 180_000,
  });
}

// ─── System Status ───────────────────────────────────────────────

export function useSystemStatus() {
  return useQuery({
    queryKey: ['system', 'status'],
    queryFn: () => fetchLive<Record<string, unknown>>('/system/status'),
    refetchInterval: 10_000,
  });
}
