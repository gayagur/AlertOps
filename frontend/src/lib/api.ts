import type { AnalysisResponse } from '@/types/analysis';

const BASE_URL = '/api';

async function fetchJSON<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getAnalysis(): Promise<AnalysisResponse> {
  return fetchJSON<AnalysisResponse>('/analysis');
}

export async function getOverview() {
  return fetchJSON('/overview');
}

export async function getOpportunities() {
  return fetchJSON('/opportunities');
}

export async function getRisks() {
  return fetchJSON('/risks');
}

export async function getMacro() {
  return fetchJSON('/macro');
}
