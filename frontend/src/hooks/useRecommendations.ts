import { useState, useEffect } from 'react';
import type { RecommendationsResponse } from '@/types/recommendations';
import { mockRecommendations } from '@/lib/mock-recommendations';

export function useRecommendations() {
  const [data, setData] = useState<RecommendationsResponse>(mockRecommendations);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/recommendations');
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const result = await res.json();
        if (!cancelled) {
          setData(result);
          setIsLive(true);
        }
      } catch {
        // Mock data already displayed
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, isLive };
}
