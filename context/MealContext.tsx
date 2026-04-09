import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import { mealsApi } from '../services/api';
import type { Meal, MacroResult, DailyTargets, LogItem } from '../types';
import { useAuth } from './AuthContext';

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
  const { isAuthenticated } = useAuth();
  const [meals,     setMeals]     = useState<Meal[]>([]);
  const [totals,    setTotals]    = useState<MacroResult>(DEFAULT_TOTALS);
  const [targets,   setTargets]   = useState<DailyTargets | null>(null);
  const [remaining, setRemaining] = useState<MacroResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadToday = useCallback(async (date?: string) => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated]);

  // Load today's data whenever auth state changes
  useEffect(() => {
    if (isAuthenticated) loadToday();
  }, [isAuthenticated]);

  const logMeal = useCallback(async (
    meal_type: string,
    items: LogItem[],
    notes?: string,
  ) => {
    await mealsApi.log({ meal_type, items, notes });
    await loadToday(); // refresh after log
  }, [loadToday]);

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
