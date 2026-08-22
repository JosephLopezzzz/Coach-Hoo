import { useState, useEffect, useCallback, useMemo } from 'react';
import { computeStreakInfo } from '../services/streakService';
import type { StreakInfo } from '../types';
import type { DailyTargets, MacroResult } from '../types';

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
 * @param currentCalories Today's total consumed calories from MealContext
 * @param targets         Daily macro targets (used to read calories_target)
 */
export function useStreak(currentCalories: number, targets: DailyTargets | null, currentMacros?: MacroResult) {
  const [streakInfo, setStreakInfo] = useState<StreakInfo>(DEFAULT_STREAK);
  const [isLoading, setIsLoading] = useState(false);

  const caloriesTarget = targets?.calories_target || 0;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const info = await computeStreakInfo(currentCalories, caloriesTarget, currentMacros, targets);
      setStreakInfo(info);
    } catch (err) {
      console.error('[useStreak] refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentCalories, caloriesTarget, currentMacros, targets]);

  // Re-compute whenever derived values change
  useEffect(() => {
    refresh();
  }, [currentCalories, caloriesTarget, currentMacros, refresh]);

  return { streakInfo, isLoading, refresh };
}
