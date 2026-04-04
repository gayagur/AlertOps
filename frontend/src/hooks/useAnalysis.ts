import { useState, useEffect } from 'react';
import type { AnalysisResponse } from '@/types/analysis';
import { getAnalysis } from '@/lib/api';
import { mockAnalysis } from '@/lib/mock-data';

export function useAnalysis() {
  // Show mock data immediately, then replace with live data when ready
  const [data, setData] = useState<AnalysisResponse>(mockAnalysis);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getAnalysis();
        if (!cancelled) {
          setData(result);
          setIsLive(true);
        }
      } catch {
        // Mock data already displayed — no action needed
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, isLive };
}
