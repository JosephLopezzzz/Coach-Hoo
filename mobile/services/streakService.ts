import { mealsApi, getLocalDateString } from './api';
import type { DayQuality, StreakDayEntry, StreakInfo, StreakLevelName } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Days of history to load for the full calendar view */
const CALENDAR_DAYS = 90;

/**
 * Calorie proximity thresholds (relative to target).
 * Perfect: ±150 kcal    → quality 3
 * Close:   -500 / +300  → quality 2
 * Logged:  any other    → quality 1
 * Missed:  no meals     → quality 0
 */
const PERFECT_LOWER = -150;
const PERFECT_UPPER = 150;
const CLOSE_LOWER   = -500;
const CLOSE_UPPER   = 300;

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

function classifyQuality(calories: number, target: number, hasLogged: boolean): DayQuality {
  if (!hasLogged) return 0;
  if (target <= 0) return 1; // no target set — just count as logged
  const diff = calories - target;
  if (diff >= PERFECT_LOWER && diff <= PERFECT_UPPER) return 3;
  if (diff >= CLOSE_LOWER   && diff <= CLOSE_UPPER)   return 2;
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

export async function computeStreakInfo(caloriesTarget: number): Promise<StreakInfo> {
  try {
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
    const calendarData: StreakDayEntry[] = allDates.map((date) => {
      const calories = calMap[date] ?? 0;
      const hasLogged = loggedSet.has(date);
      return {
        date,
        quality: classifyQuality(calories, caloriesTarget, hasLogged),
        calories,
      };
    });

    // ── Current streak ────────────────────────────────────────────────────────
    // Walk backwards from today; streak grows on quality >= 2, stays alive on
    // quality 1 (just logged), breaks on quality 0 (missed).
    let currentStreak = 0;
    let streakStartDate: string | null = null;
    let inStreak = true;

    for (let i = calendarData.length - 1; i >= 0; i--) {
      const entry = calendarData[i];
      if (!inStreak) break;

      if (entry.quality >= 2) {
        currentStreak++;
        streakStartDate = entry.date;
      } else if (entry.quality === 1) {
        // Neutral — today's partial progress or a day far from target
        // If today (last entry), don't break the streak yet
        if (i === calendarData.length - 1) {
          // Today — user logged but not near target; let it pass
        } else if (currentStreak > 0) {
          // A neutral day embedded in a running streak is fine (doesn't break)
          // but we stop counting backwards here
          inStreak = false;
        } else {
          inStreak = false;
        }
      } else {
        // quality 0 — missed day — breaks streak
        inStreak = false;
      }
    }

    // ── Longest streak ────────────────────────────────────────────────────────
    let longestStreak = 0;
    let runningStreak = 0;

    for (const entry of calendarData) {
      if (entry.quality >= 2) {
        runningStreak++;
        if (runningStreak > longestStreak) longestStreak = runningStreak;
      } else if (entry.quality === 0) {
        // Only a missed day fully resets
        runningStreak = 0;
      }
      // quality 1 — neutral, doesn't add or reset
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
    case 3: return '#E8A254'; // golden — Perfect
    case 2: return '#FFA76C'; // peach-orange — Close
    case 1: return '#B0B0B0'; // muted grey — Logged (neutral)
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
