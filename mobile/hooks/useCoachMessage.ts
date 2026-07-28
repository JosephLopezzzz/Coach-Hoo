import type { Meal, MacroResult, DailyTargets } from '../types';

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

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export function useCoachMessage(
  userName: string | undefined,
  meals: Meal[],
  totals: MacroResult,
  targets: DailyTargets | null,
): CoachMessageResult {
  const name = userName?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const isLate = hour >= 22 || hour < 5;
  const timeOfDay = getTimeOfDay();
  const greeting = `Good ${timeOfDay}, ${name}!`;

  if (isLate) {
    return {
      greeting,
      message: "It's getting late! Great work today. Time to rest and recover.",
      messageType: 'late-night',
    };
  }

  if (!meals || meals.length === 0) {
    return {
      greeting,
      message:
        "Welcome to Coach Hoo! Tap the + to log your first meal — I'll help track your progress!",
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
        message: 'Nailed it! All macros hit today. Coach Hoo is proud of you!',
        messageType: 'celebration',
      };
    }

    if (calPct >= 0.75) {
      const remainder =
        proteinRemaining > 0
          ? `${proteinRemaining}g protein to go`
          : 'just a bit more to hit your goals';
      return {
        greeting,
        message: `Almost there! ${remainder}. You've got this!`,
        messageType: 'progress',
      };
    }

    if (calPct >= 0.5) {
      return {
        greeting,
        message: `Good progress! ${mealCount} meal${mealCount > 1 ? 's' : ''} logged. Keep it going!`,
        messageType: 'encouragement',
      };
    }

    if (mealCount >= 2) {
      return {
        greeting,
        message: `Great start! You've logged ${mealCount} meals. Try for a balanced dinner to round things out.`,
        messageType: 'encouragement',
      };
    }

    return {
      greeting,
      message: "You're off to a good start! What's next on your menu today?",
      messageType: 'encouragement',
    };
  }

  return {
    greeting,
    message: 'Start logging your meals to see your progress!',
    messageType: 'welcome',
  };
}