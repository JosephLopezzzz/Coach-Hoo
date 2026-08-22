import { mealsApi, getLocalDateString } from './api';
import type { DayQuality, StreakDayEntry, StreakInfo, StreakLevelName, MacroResult, DailyTargets } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Days of history to load for the full calendar view */
const CALENDAR_DAYS = 90;

/**
 * Calorie proximity thresholds (relative to target).
 * Perfect: -300 / +400   → quality 3  (within ~15-18% of a 2200 target)
 * Close:   -800 / +800   → quality 2  (within ~36% of a 2200 target)
 * Logged:  any other      → quality 1  (way under or way over)
 * Missed:  no meals       → quality 0
 */
const PERFECT_LOWER = -300;
const PERFECT_UPPER = 400;
const CLOSE_LOWER   = -800;
const CLOSE_UPPER   = 800;

// ─── Flame level thresholds ───────────────────────────────────────────────────
const LEVELS: { min: number; level: 1 | 2 | 3 | 4 | 5; name: StreakLevelName }[] = [
  { min: 30, level: 5, name: 'Inferno' },
  { min: 14, level: 4, name: 'Ignite'  },
  { min:  7, level: 3, name: 'Blaze'   },
  { min:  3, level: 2, name: 'Glow'    },
  { min:  0, level: 1, name: 'Spark'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFlameLevel(streak: number): { level: 1|2|3|4|5; name: StreakLevelName } {
  for (const l of LEVELS) {
    if (streak >= l.min) return { level: l.level, name: l.name };
  }
  return { level: 1, name: 'Spark' };
}

function classifyQuality(
  calories: number,
  target: number,
  hasLogged: boolean,
  isToday: boolean = false,
  macros?: MacroResult,
  macroTargets?: DailyTargets | null,
): DayQuality {
  if (!hasLogged) return 0;
  if (target <= 0) return 1; // no target set — just count as logged

  // If they hit all their macro targets perfectly (90%-125%), award a Perfect score
  if (isToday && macros && macroTargets) {
    const withinBand = (value: number, goal: number) =>
      goal > 0 && value >= goal * 0.9 && value <= goal * 1.25;
    if (
      withinBand(macros.protein, macroTargets.protein_target) &&
      withinBand(macros.carbs, macroTargets.carbs_target) &&
      withinBand(macros.fat, macroTargets.fat_target) &&
      withinBand(macros.calories, macroTargets.calories_target)
    ) {
      return 3;
    }
  }
  
  const diff = calories - target;

  // Perfect if within [-300, +200]
  if (diff >= PERFECT_LOWER && diff <= PERFECT_UPPER) return 3;
  
  // Close if within [-800, +400]
  if (diff >= CLOSE_LOWER   && diff <= CLOSE_UPPER)   return 2;
  
  // Otherwise, they logged something but missed the close window (either starvation or binge)
  return 1;
}

/** Returns the last `n` calendar dates as 'YYYY-MM-DD' strings, oldest first */
function getLastNDates(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(getLocalDateString(d));
  }
  return dates;
}

// ─── Main export ──────────────────────────────────────────────────────────────

// Module-level cache for historical data (up to yesterday)
let _cachedCalendarData: { date: string, calories: number, hasLogged: boolean }[] | null = null;
let _cachedLastUpdateDate: string | null = null;

export function clearStreakCache() {
  _cachedCalendarData = null;
  _cachedLastUpdateDate = null;
}

export async function computeStreakInfo(
  currentCalories: number,
  caloriesTarget: number,
  currentMacros?: MacroResult,
  macroTargets?: DailyTargets | null,
): Promise<StreakInfo> {
  try {
    const todayStr = getLocalDateString(new Date());
    
    // Check if we need to rebuild the historical cache
    if (!_cachedCalendarData || _cachedLastUpdateDate !== todayStr) {
      // Fetch last 90 days of history
      const { data: historyRaw } = await mealsApi.history(CALENDAR_DAYS);

      // Build a lookup map: date → calories
      const calMap: Record<string, number> = {};
      const loggedSet = new Set<string>();
      for (const entry of historyRaw) {
        calMap[entry.date] = entry.calories;
        if (entry.calories > 0) loggedSet.add(entry.date);
      }

      // Build full calendar data (last 90 days)
      const allDates = getLastNDates(CALENDAR_DAYS);
      _cachedCalendarData = allDates.map((date) => {
        const calories = calMap[date] ?? 0;
        const hasLogged = loggedSet.has(date);
        return {
          date,
          calories,
          hasLogged,
        };
      });
      _cachedLastUpdateDate = todayStr;
    }

    // Compute quality dynamically so it uses the latest caloriesTarget
    const calendarData: StreakDayEntry[] = _cachedCalendarData.map((entry) => {
      if (entry.date === todayStr) {
        return {
          date: todayStr,
          quality: classifyQuality(
            currentCalories,
            caloriesTarget,
            currentCalories > 0,
            true,
            currentMacros,
            macroTargets,
          ),
          calories: currentCalories,
        };
      }
      return {
        date: entry.date,
        quality: classifyQuality(entry.calories, caloriesTarget, entry.hasLogged, false),
        calories: entry.calories,
      };
    });

    // ── Current streak ────────────────────────────────────────────────────────
    // Walk backwards from today; any logged day (quality >= 1) keeps the streak
    // alive and incrementing. Only a missed day (quality 0) breaks it.
    // The hierarchical quality tiers (Perfect/Close/Logged) are still shown
    // visually in the heatmap, but all count toward the streak number.
    let currentStreak = 0;
    let streakStartDate: string | null = null;
    let inStreak = true;

    for (let i = calendarData.length - 1; i >= 0; i--) {
      const entry = calendarData[i];
      if (!inStreak) break;

      if (entry.quality >= 1) {
        // Any logging counts — streak increments
        currentStreak++;
        streakStartDate = entry.date;
      } else {
        // quality 0 — missed day — breaks streak
        inStreak = false;
      }
    }

    // ── Longest streak ────────────────────────────────────────────────────────
    let longestStreak = 0;
    let runningStreak = 0;

    for (const entry of calendarData) {
      if (entry.quality >= 1) {
        runningStreak++;
        if (runningStreak > longestStreak) longestStreak = runningStreak;
      } else {
        // Only a missed day fully resets
        runningStreak = 0;
      }
    }

    // ── Week heatmap (last 7 days) ────────────────────────────────────────────
    const weekHeatmap = calendarData.slice(-7);

    // ── Flame level ───────────────────────────────────────────────────────────
    const { level: currentLevel, name: levelName } = getFlameLevel(currentStreak);

    return {
      currentStreak,
      longestStreak,
      streakStartDate,
      currentLevel,
      levelName,
      weekHeatmap,
      calendarData,
    };
  } catch (err) {
    console.error('[streakService] Failed to compute streak:', err);
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakStartDate: null,
      currentLevel: 1,
      levelName: 'Spark',
      weekHeatmap: [],
      calendarData: [],
    };
  }
}

// ─── Milestone definitions ────────────────────────────────────────────────────

export interface StreakMilestone {
  days: number;
  label: string;
  icon: string; // Ionicons name
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3,   label: '3-Day Streak',   icon: 'flame-outline'   },
  { days: 7,   label: '1 Week',         icon: 'star-outline'    },
  { days: 14,  label: '2 Weeks',        icon: 'ribbon-outline'  },
  { days: 30,  label: '1 Month',        icon: 'trophy-outline'  },
  { days: 60,  label: '2 Months',       icon: 'medal-outline'   },
  { days: 100, label: '100 Days',       icon: 'diamond-outline' },
];

/** Get the next milestone the user hasn't hit yet */
export function getNextMilestone(currentStreak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find((m) => m.days > currentStreak) ?? null;
}

// ─── Visual helpers ───────────────────────────────────────────────────────────

/** Returns the hex color for a given day quality tier */
export function getQualityColor(quality: DayQuality): string {
  switch (quality) {
    case 3: return '#D94A1E'; // red orange — Perfect
    case 2: return '#E8A254'; // orange — Close
    case 1: return '#F4C97A'; // yellow — Logged
    default: return 'transparent';
  }
}

/** Returns [gradientFrom, gradientTo] for each flame level hero banner */
export function getLevelGradient(level: number): [string, string] {
  switch (level) {
    case 5: return ['#C0392B', '#E74C3C']; // Inferno — deep crimson-red
    case 4: return ['#D35400', '#E67E22']; // Ignite  — burnt orange
    case 3: return ['#D94A1E', '#E8A254']; // Blaze   — brand red-orange
    case 2: return ['#E8A254', '#F4C97A']; // Glow    — warm golden
    default: return ['#F4C97A', '#FDE8B5']; // Spark  — soft amber
  }
}

/** Returns the flame emoji label for a streak level */
export function getLevelEmoji(level: number): string {
  switch (level) {
    case 5: return '🔥';
    case 4: return '🔥';
    case 3: return '🔥';
    case 2: return '🔥';
    default: return '🔸';
  }
}
