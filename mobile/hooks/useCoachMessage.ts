import type { Meal, MacroResult, DailyTargets } from '../types';
import type { Language } from '../services/coachMessageService';
import { t } from '../constants/i18n';
import type { StringKey } from '../constants/i18n';

export type CoachMessageType =
  | 'welcome'
  | 'encouragement'
  | 'progress'
  | 'celebration'
  | 'late-night'
  | 'confirmation';

export interface CoachMessageResult {
  greeting: string;
  message: string;
  messageType: CoachMessageType;
}

function getGreetingKey(): StringKey {
  const h = new Date().getHours();
  if (h < 12) return 'coach.greeting.morning';
  if (h < 17) return 'coach.greeting.afternoon';
  return 'coach.greeting.evening';
}

export function useCoachMessage(
  userName: string | undefined,
  meals: Meal[],
  totals: MacroResult,
  targets: DailyTargets | null,
  lang: Language = 'english',
  currentStreak: number = 0,
): CoachMessageResult {
  const name = userName?.split(' ')[0] || t(lang, 'coach.friend');
  const hour = new Date().getHours();
  const isLate = hour >= 22 || hour < 5;
  const greeting = t(lang, getGreetingKey(), { name });

  if (isLate) {
    return {
      greeting,
      message: t(lang, 'coach.lateNight'),
      messageType: 'late-night',
    };
  }

  // Streak milestone shout-outs (checked once per session via meals.length > 0)
  if (currentStreak > 0 && meals.length > 0) {
    const milestones = [30, 14, 7, 3];
    const hit = milestones.find(m => currentStreak === m);
    if (hit) {
      const streakMessages: Record<number, string> = {
        3:  `${name}, 3 days in a row 🔥 You\'re building momentum!`,
        7:  `One full week streak, ${name}! That\'s real dedication 🏆`,
        14: `Two weeks strong, ${name}! You\'re on fire 🔥🔥`,
        30: `A MONTH of streaks, ${name}?! You\'re unstoppable! 🔥🔥🔥`,
      };
      return {
        greeting,
        message: streakMessages[hit],
        messageType: 'celebration',
      };
    }
  }

  if (!meals || meals.length === 0) {
    return {
      greeting,
      message: t(lang, 'coach.welcome'),
      messageType: 'welcome',
    };
  }

  if (targets) {
    const calPct =
      targets.calories_target > 0
        ? totals.calories / targets.calories_target
        : 0;
    const proteinRemaining = Math.round(
      Math.max(0, targets.protein_target - totals.protein),
    );
    const mealCount = meals.length;

    if (calPct >= 1) {
      return {
        greeting,
        message: t(lang, 'coach.celebration'),
        messageType: 'celebration',
      };
    }

    if (calPct >= 0.75) {
      const remainder =
        proteinRemaining > 0
          ? t(lang, 'coach.proteinToGo', { grams: proteinRemaining })
          : t(lang, 'coach.bitMore');
      return {
        greeting,
        message: t(lang, 'coach.almostThere', { remainder }),
        messageType: 'progress',
      };
    }

    if (calPct >= 0.5) {
      return {
        greeting,
        message: t(
          lang,
          mealCount > 1 ? 'coach.goodProgressPlural' : 'coach.goodProgress',
          { count: mealCount },
        ),
        messageType: 'encouragement',
      };
    }

    if (mealCount >= 2) {
      return {
        greeting,
        message: t(lang, 'coach.greatStart', { count: mealCount }),
        messageType: 'encouragement',
      };
    }

    return {
      greeting,
      message: t(lang, 'coach.offToGoodStart'),
      messageType: 'encouragement',
    };
  }

  return {
    greeting,
    message: t(lang, 'coach.startLogging'),
    messageType: 'welcome',
  };
}
