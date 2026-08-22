import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Storage keys ─────────────────────────────────────────────────────────────
const HEALTH_SYNC_ENABLED_KEY = 'coach_hoo_health_sync_enabled';
const HEALTH_SYNC_LAST_DATE_KEY = 'coach_hoo_health_sync_last_date';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthSyncConfig {
  enabled: boolean;
  platform: 'Health Connect' | 'Apple Health' | 'Unsupported';
  lastSyncedAt?: string;
  permissionsGranted: boolean;
}

export interface HealthReadData {
  steps: number | null;       // today's step count
  weight: number | null;      // latest weight in kg
}

interface MealPayload {
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_date?: string;
}

interface TotalsPayload {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ─── Lazy import for Health Connect (Android only) ────────────────────────────
// We lazy-import so that iOS/web builds don't crash at import time.
let _hcModule: typeof import('react-native-health-connect') | null = null;

async function getHC() {
  if (Platform.OS !== 'android') return null;
  if (!_hcModule) {
    try {
      _hcModule = await import('react-native-health-connect');
    } catch (e) {
      console.warn('[HealthSync] Failed to import react-native-health-connect:', e);
      return null;
    }
  }
  return _hcModule;
}

// ─── Initialization ───────────────────────────────────────────────────────────

let _initialized = false;

export async function initHealthConnect(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (_initialized) return true;

  const hc = await getHC();
  if (!hc) return false;

  try {
    const result = await hc.initialize();
    _initialized = !!result;
    console.log('[HealthSync] Initialized Health Connect:', _initialized);
    return _initialized;
  } catch (e) {
    console.error('[HealthSync] init error:', e);
    return false;
  }
}

// ─── Permissions ──────────────────────────────────────────────────────────────

const REQUIRED_PERMISSIONS = [
  { accessType: 'write' as const, recordType: 'Nutrition' as const },
  { accessType: 'read' as const, recordType: 'Nutrition' as const },
  { accessType: 'read' as const, recordType: 'Steps' as const },
  { accessType: 'read' as const, recordType: 'Weight' as const },
];

export async function requestHealthPermissions(): Promise<boolean> {
  const hc = await getHC();
  if (!hc) return false;

  if (!_initialized) {
    const ok = await initHealthConnect();
    if (!ok) return false;
  }

  try {
    const granted = await hc.requestPermission(REQUIRED_PERMISSIONS);
    const hasAll = granted.length >= REQUIRED_PERMISSIONS.length;
    console.log('[HealthSync] Permissions granted:', granted.length, '/', REQUIRED_PERMISSIONS.length);
    return hasAll;
  } catch (e) {
    console.error('[HealthSync] Permission error:', e);
    return false;
  }
}

// ─── Config (read/write toggle state) ─────────────────────────────────────────

export async function getHealthSyncConfig(): Promise<HealthSyncConfig> {
  try {
    const rawEnabled = await AsyncStorage.getItem(HEALTH_SYNC_ENABLED_KEY);
    const lastSyncedAt = (await AsyncStorage.getItem(HEALTH_SYNC_LAST_DATE_KEY)) || undefined;
    const enabled = rawEnabled === 'true';

    let platform: HealthSyncConfig['platform'] = 'Unsupported';
    if (Platform.OS === 'android') platform = 'Health Connect';
    else if (Platform.OS === 'ios') platform = 'Apple Health';

    // Check permissions on Android
    let permissionsGranted = false;
    if (Platform.OS === 'android' && enabled) {
      permissionsGranted = await checkPermissionsGranted();
    }

    return { enabled, platform, lastSyncedAt, permissionsGranted };
  } catch (err) {
    console.error('[HealthSync] getConfig error:', err);
    return {
      enabled: false,
      platform: Platform.OS === 'android' ? 'Health Connect' : Platform.OS === 'ios' ? 'Apple Health' : 'Unsupported',
      permissionsGranted: false,
    };
  }
}

async function checkPermissionsGranted(): Promise<boolean> {
  // We can't truly query "are permissions granted?" with HC's API without trying.
  // We use a lightweight probe: try to read 0 steps for today.
  const hc = await getHC();
  if (!hc || !_initialized) return false;

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    await hc.readRecords('Steps', {
      timeRangeFilter: { operator: 'between', startTime: startOfDay, endTime: now.toISOString() },
    });
    return true;
  } catch {
    return false;
  }
}

export async function setHealthSyncEnabled(enabled: boolean): Promise<boolean> {
  try {
    if (enabled && Platform.OS === 'android') {
      // Initialize and request permissions on first enable
      const initOk = await initHealthConnect();
      if (!initOk) {
        console.warn('[HealthSync] Health Connect not available on this device');
        return false;
      }
      const permsOk = await requestHealthPermissions();
      if (!permsOk) {
        console.warn('[HealthSync] Permissions not granted');
        return false;
      }
    }

    await AsyncStorage.setItem(HEALTH_SYNC_ENABLED_KEY, enabled ? 'true' : 'false');
    if (enabled) {
      await AsyncStorage.setItem(HEALTH_SYNC_LAST_DATE_KEY, new Date().toISOString());
    }
    return true;
  } catch (err) {
    console.error('[HealthSync] setEnabled error:', err);
    return false;
  }
}

// ─── Write: Sync a single meal ────────────────────────────────────────────────

function mapMealType(type: string): number {
  // Health Connect meal type enum: 0=unknown, 1=breakfast, 2=lunch, 3=dinner, 4=snack
  switch (type.toLowerCase()) {
    case 'breakfast': return 1;
    case 'lunch':     return 2;
    case 'dinner':    return 3;
    case 'snack':     return 4;
    default:          return 0;
  }
}

export async function syncMealToHealth(meal: MealPayload): Promise<boolean> {
  try {
    const config = await getHealthSyncConfig();
    if (!config.enabled) return false;

    if (Platform.OS === 'android') {
      return await syncMealToHealthConnect(meal);
    }

    // iOS / web — no-op for now
    console.log(`[HealthSync] (stub) Would sync meal to ${config.platform}:`, meal.meal_type, meal.calories, 'kcal');
    return false;
  } catch (err) {
    console.error('[HealthSync] syncMeal error:', err);
    return false;
  }
}

async function syncMealToHealthConnect(meal: MealPayload): Promise<boolean> {
  const hc = await getHC();
  if (!hc) return false;

  if (!_initialized) {
    const ok = await initHealthConnect();
    if (!ok) return false;
  }

  try {
    const now = new Date();
    // Assume meal was consumed over the past hour
    const startTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const endTime = now.toISOString();

    await hc.insertRecords([
      {
        recordType: 'Nutrition',
        startTime,
        endTime,
        energy: { value: meal.calories, unit: 'calories' },
        protein: { value: meal.protein, unit: 'grams' },
        totalCarbohydrate: { value: meal.carbs, unit: 'grams' },
        totalFat: { value: meal.fat, unit: 'grams' },
        mealType: mapMealType(meal.meal_type),
      } as any,
    ]);

    await AsyncStorage.setItem(HEALTH_SYNC_LAST_DATE_KEY, now.toISOString());
    console.log(`[HealthSync] ✅ Synced ${meal.meal_type} (${meal.calories} kcal) to Health Connect`);
    return true;
  } catch (e) {
    console.error('[HealthSync] insertRecords error:', e);
    return false;
  }
}

// ─── Write: Sync daily totals ─────────────────────────────────────────────────

export async function syncDailyTotalsToHealth(totals: TotalsPayload): Promise<boolean> {
  try {
    const config = await getHealthSyncConfig();
    if (!config.enabled) return false;

    if (Platform.OS === 'android') {
      return await syncDailyTotalsToHealthConnect(totals);
    }

    console.log(`[HealthSync] (stub) Would sync daily totals to ${config.platform}:`, totals.calories, 'kcal');
    return false;
  } catch (err) {
    console.error('[HealthSync] syncDailyTotals error:', err);
    return false;
  }
}

async function syncDailyTotalsToHealthConnect(totals: TotalsPayload): Promise<boolean> {
  const hc = await getHC();
  if (!hc) return false;

  if (!_initialized) {
    const ok = await initHealthConnect();
    if (!ok) return false;
  }

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endTime = now.toISOString();

    await hc.insertRecords([
      {
        recordType: 'Nutrition',
        startTime: startOfDay,
        endTime,
        energy: { value: totals.calories, unit: 'calories' },
        protein: { value: totals.protein, unit: 'grams' },
        totalCarbohydrate: { value: totals.carbs, unit: 'grams' },
        totalFat: { value: totals.fat, unit: 'grams' },
        mealType: 0, // unknown — aggregate
      } as any,
    ]);

    await AsyncStorage.setItem(HEALTH_SYNC_LAST_DATE_KEY, now.toISOString());
    console.log(`[HealthSync] ✅ Synced daily totals (${totals.calories} kcal) to Health Connect`);
    return true;
  } catch (e) {
    console.error('[HealthSync] insertRecords (daily) error:', e);
    return false;
  }
}

// ─── Read: Steps & Weight from Health Connect ─────────────────────────────────

export async function readHealthData(): Promise<HealthReadData> {
  const result: HealthReadData = { steps: null, weight: null };

  if (Platform.OS !== 'android') return result;

  const hc = await getHC();
  if (!hc) return result;

  if (!_initialized) {
    const ok = await initHealthConnect();
    if (!ok) return result;
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endTime = now.toISOString();

  // ── Steps (today) ──────────────────────────────────────────────────────────
  try {
    const stepsRecords = await hc.readRecords('Steps', {
      timeRangeFilter: { operator: 'between', startTime: startOfDay, endTime },
    });
    if (stepsRecords && Array.isArray(stepsRecords)) {
      let totalSteps = 0;
      for (const rec of stepsRecords as any[]) {
        totalSteps += rec.count ?? 0;
      }
      result.steps = totalSteps;
    }
  } catch (e) {
    console.warn('[HealthSync] Failed to read steps:', e);
  }

  // ── Weight (latest in last 30 days) ────────────────────────────────────────
  try {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const weightRecords = await hc.readRecords('Weight', {
      timeRangeFilter: { operator: 'between', startTime: thirtyDaysAgo, endTime },
    });
    if (weightRecords && Array.isArray(weightRecords) && weightRecords.length > 0) {
      // Take the most recent record
      const latest = (weightRecords as any[])[weightRecords.length - 1];
      // Weight is in kilograms by default in Health Connect
      result.weight = latest?.weight?.inKilograms ?? latest?.weight ?? null;
    }
  } catch (e) {
    console.warn('[HealthSync] Failed to read weight:', e);
  }

  console.log(`[HealthSync] Read: steps=${result.steps}, weight=${result.weight}`);
  return result;
}
