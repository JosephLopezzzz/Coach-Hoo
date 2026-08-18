import { useState, useEffect, useCallback } from 'react';
import { computeStreakInfo } from '../services/streakService';
import type { StreakInfo } from '../types';
import type { Meal, DailyTargets } from '../types';

const DEFAULT_STREAK: StreakInfo = {
  currentStreak: 0,
  longestStreak: 0,
  streakStartDate: null,
  currentLevel: 1,
  levelName: 'Spark',
  weekHeatmap: [],
  calendarData: [],
};

/**
 * Computes and exposes streak data for the current user.
 *
 * @param meals       Today's meals array from MealContext (used as dep to re-compute)
 * @param targets     Daily macro targets (used to read caloriesTarget)
 */
export function useStreak(meals: Meal[], targets: DailyTargets | null) {
  const [streakInfo, setStreakInfo] = useState<StreakInfo>(DEFAULT_STREAK);
  const [isLoading, setIsLoading]   = useState(true);

  const caloriesTarget = targets?.calories_target ?? 0;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const info = await computeStreakInfo(caloriesTarget);
      setStreakInfo(info);
    } catch (err) {
      console.error('[useStreak] refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [caloriesTarget]);

  // Re-compute whenever meals or target changes
  useEffect(() => {
    refresh();
  }, [refresh, meals.length]);

  return { streakInfo, isLoading, refresh };
}
