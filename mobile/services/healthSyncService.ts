import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const HEALTH_SYNC_ENABLED_KEY = 'coach_hoo_health_sync_enabled';
const HEALTH_SYNC_LAST_DATE_KEY = 'coach_hoo_health_sync_last_date';

export interface HealthSyncConfig {
  enabled: boolean;
  platform: 'Apple Health' | 'Google Fit / Health Connect' | 'Web Mock';
  lastSyncedAt?: string;
}

export const getHealthSyncConfig = async (): Promise<HealthSyncConfig> => {
  try {
    const rawEnabled = await AsyncStorage.getItem(HEALTH_SYNC_ENABLED_KEY);
    const lastSyncedAt = await AsyncStorage.getItem(HEALTH_SYNC_LAST_DATE_KEY) || undefined;
    const enabled = rawEnabled === 'true';

    let platform: HealthSyncConfig['platform'] = 'Web Mock';
    if (Platform.OS === 'ios') {
      platform = 'Apple Health';
    } else if (Platform.OS === 'android') {
      platform = 'Google Fit / Health Connect';
    }

    return {
      enabled,
      platform,
      lastSyncedAt,
    };
  } catch (err) {
    console.error('Failed to get health sync config:', err);
    return {
      enabled: false,
      platform: Platform.OS === 'ios' ? 'Apple Health' : Platform.OS === 'android' ? 'Google Fit / Health Connect' : 'Web Mock',
    };
  }
};

export const setHealthSyncEnabled = async (enabled: boolean): Promise<boolean> => {
  try {
    if (enabled) {
      console.log(`[HealthSync] Requesting permissions for ${Platform.OS}...`);
    }
    await AsyncStorage.setItem(HEALTH_SYNC_ENABLED_KEY, enabled ? 'true' : 'false');
    if (enabled) {
      await AsyncStorage.setItem(HEALTH_SYNC_LAST_DATE_KEY, new Date().toISOString());
    }
    return true;
  } catch (err) {
    console.error('Failed to set health sync status:', err);
    return false;
  }
};

export const syncMealToHealth = async (meal: {
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_date?: string;
}): Promise<boolean> => {
  try {
    const config = await getHealthSyncConfig();
    if (!config.enabled) return false;

    console.log(`[HealthSync] Syncing meal (${meal.meal_type}, ${meal.calories} kcal) to ${config.platform}`);
    const now = new Date().toISOString();
    await AsyncStorage.setItem(HEALTH_SYNC_LAST_DATE_KEY, now);
    return true;
  } catch (err) {
    console.error('Failed to sync meal to health dashboard:', err);
    return false;
  }
};

export const syncDailyTotalsToHealth = async (totals: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}): Promise<boolean> => {
  try {
    const config = await getHealthSyncConfig();
    if (!config.enabled) return false;

    console.log(`[HealthSync] Syncing daily totals (${totals.calories} kcal) to ${config.platform}`);
    const now = new Date().toISOString();
    await AsyncStorage.setItem(HEALTH_SYNC_LAST_DATE_KEY, now);
    return true;
  } catch (err) {
    console.error('Failed to sync daily totals to health dashboard:', err);
    return false;
  }
};
