/**
 * useUserStats — fetches trainer stats with refresh-on-focus and
 * refresh-on-route-change behaviour.
 *
 * Encapsulates the loading/error/stats triplet plus the two useEffects
 * that used to live in Dashboard.tsx.
 */

import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { authService } from '../services/authService';
import type { UserStats } from '../services/authService';

interface UseUserStatsResult {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useUserStats = (): UseUserStatsResult => {
  const location = useLocation();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const userStats = await authService.getStats();
      setStats(userStats);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch when the route changes (e.g. user navigates back to dashboard).
  useEffect(() => {
    refresh();
  }, [refresh, location.key]);

  // Re-fetch when the window regains focus.
  useEffect(() => {
    const handleFocus = () => {
      refresh();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refresh]);

  return { stats, loading, error, refresh };
};
