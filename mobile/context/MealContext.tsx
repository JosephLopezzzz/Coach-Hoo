import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import { mealsApi } from '../services/api';
import type { Meal, MacroResult, DailyTargets, LogItem } from '../types';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useToast } from './ToastContext';
import { getMealTypeLabel } from '../constants/i18n';
import { syncMealToHealth } from '../services/healthSyncService';
import { initNetworkSyncListener, processSyncQueue } from '../services/syncService';
import { initDb } from '../services/db';

interface MealContextType {
  meals:      Meal[];
  totals:     MacroResult;
  targets:    DailyTargets | null;
  remaining:  MacroResult | null;
  isLoading:  boolean;
  loadToday:  (date?: string) => Promise<void>;
  logMeal: (meal_type: string, items: LogItem[], notes?: string) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
}

const DEFAULT_TOTALS: MacroResult = { calories: 0, protein: 0, carbs: 0, fat: 0 };

const MealContext = createContext<MealContextType | null>(null);

export function MealProvider({ children }: { children: React.ReactNode }) {
  const { isOnboarded } = useAuth();
  const { lang, t } = useLanguage();
  const { showToast } = useToast();
  const [meals,     setMeals]     = useState<Meal[]>([]);
  const [totals,    setTotals]    = useState<MacroResult>(DEFAULT_TOTALS);
  const [targets,   setTargets]   = useState<DailyTargets | null>(null);
  const [remaining, setRemaining] = useState<MacroResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize SQLite database and sync queue processing
  useEffect(() => {
    initDb().then(() => {
      processSyncQueue();
    });
    const unsubscribe = initNetworkSyncListener(() => {
      loadToday();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const loadToday = useCallback(async (date?: string) => {
    if (!isOnboarded) return;
    setIsLoading(true);
    try {
      const { data } = await mealsApi.today(date);
      setMeals(data.meals);
      setTotals(data.totals);
      setTargets(data.targets);
      setRemaining(data.remaining);
    } catch (err) {
      console.error('[MealContext] loadToday failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isOnboarded]);

  // Load today's data whenever onboarding state changes
  useEffect(() => {
    if (isOnboarded) loadToday();
  }, [isOnboarded]);

  const logMeal = useCallback(async (
    meal_type: string,
    items: LogItem[],
    notes?: string,
  ) => {
    const res = await mealsApi.log({ meal_type, items, notes });
    await loadToday(); // refresh after log

    // Attempt Native Health Sync
    if (res?.data) {
      let calories = 0, protein = 0, carbs = 0, fat = 0;
      (res.data.items || []).forEach((it: any) => {
        calories += it.calculated_calories || 0;
        protein += it.calculated_protein || 0;
        carbs += it.calculated_carbs || 0;
        fat += it.calculated_fat || 0;
      });
      syncMealToHealth({ meal_type, calories, protein, carbs, fat, logged_date: res.data.logged_date });
    }

    // Trigger meal logged notification toast for all logging events
    const mealLabel = getMealTypeLabel(lang, meal_type);
    const count = items.length;
    const toastSubtitle = t(
      count === 1 ? 'log.successBody' : 'log.successBodyPlural',
      { mealType: mealLabel, count },
    );
    showToast({
      type: 'success',
      title: t('log.successTitle') || 'Meal logged!',
      subtitle: `🎉 ${toastSubtitle}`,
    });
  }, [loadToday, lang, t, showToast]);

  const deleteMeal = useCallback(async (id: string) => {
    await mealsApi.delete(id);
    await loadToday();
  }, [loadToday]);


  return (
    <MealContext.Provider value={{
      meals, totals, targets, remaining, isLoading,
      loadToday, logMeal, deleteMeal,
    }}>
      {children}
    </MealContext.Provider>
  );
}

export function useMeals() {
  const ctx = useContext(MealContext);
  if (!ctx) throw new Error('useMeals must be used within MealProvider');
  return ctx;
}
