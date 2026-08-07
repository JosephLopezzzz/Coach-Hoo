import AsyncStorage from '@react-native-async-storage/async-storage';
import { FOODS_DB, RECIPES_DB } from './foodDb';

export type UserLike = {
  allergies?: string[];
  allergy_other?: string;
  intolerances?: string;
};

/**
 * Allergen key → food-name signals (English + Filipino). Keys match the
 * ALLERGEN_GROUP_SPEC in constants/i18n.ts.
 */
export const ALLERGEN_SIGNALS: Record<string, string[]> = {
  milk:    ['milk', 'gatas', 'keso', 'cheese', 'butter', 'whey', 'dairy', 'yogurt'],
  egg:     ['egg', 'itlog'],
  peanut:  ['peanut', 'mani', 'groundnut'],
  tree_nuts: ['almond', 'cashew', 'walnut', 'pecan', 'hazelnut', 'pistachio', 'tree nut', 'mixed nut'],
  soy:     ['soy', 'soya', 'tofu', 'tokwa', 'tamari', 'edamame'],
  wheat:   ['wheat', 'trigo', 'bread', 'flour', 'harina', 'pasta', 'gluten'],
  sesame:  ['sesame', 'linga', 'tahini'],
  fish:    ['fish', 'isda', 'tilapia', 'bangus', 'tuna', 'salmon', 'sardine', 'lapu-lapu'],
  crustacean: ['shrimp', 'hipon', 'prawn', 'crab', 'alimango', 'lobster', 'tuktok'],
  mollusks: ['squid', 'pusit', 'oyster', 'talaba', 'mussel', 'tahong', 'clam', 'halaan', 'scallop'],
  corn:    ['corn', 'mais', 'maize', 'popcorn'],
  coconut: ['coconut', 'niyog', 'gata', 'copra'],
  mustard: ['mustard', 'mustasa'],
  celery:  ['celery', 'kintsay'],
  lupin:   ['lupin'],
  sulfites: ['sulfite', 'sulphite', 'sulfur dioxide'],
  kiwi:    ['kiwi', 'kuwaba'],
  banana:  ['banana', 'saging', 'lakatan', 'saba'],
  avocado: ['avocado', 'abukado', 'abokado'],
  strawberry: ['strawberry', 'presas'],
};

const ALLERGEN_KEYS = Object.keys(ALLERGEN_SIGNALS);

/**
 * Return the allergen KEYS (and free-text triggers) from the user profile that
 * appear inside any of the given keyword strings (food names / ingredient names /
 * typed text). Only keys that the user is actually allergic to are returned.
 */
export function findAllergenMatches(
  user: UserLike | null | undefined,
  keywords: string[],
): string[] {
  const matched = new Set<string>();
  const keys: string[] = user?.allergies ?? [];

  // 1. Structured allergen keys present in the user profile
  keys.forEach((key) => {
    const signals = ALLERGEN_SIGNALS[key] ?? [key];
    const hit = (keywords ?? []).some((kw) => {
      const lower = kw.toLowerCase();
      return signals.some((s) => lower.includes(s));
    });
    if (hit) matched.add(key);
  });

  // 2. Free-text allergy_other / intolerances
  const freeText = `${user?.allergy_other ?? ''} ${user?.intolerances ?? ''}`.toLowerCase();
  const tokens = freeText.split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean);
  if (tokens.length) {
    (keywords ?? []).forEach((kw) => {
      const k = kw.toLowerCase();
      const hit = tokens.find((token) => token && (k.includes(token) || token.includes(k)));
      if (hit) matched.add(hit);
    });
  }

  return Array.from(matched);
}

async function getCustomFoods(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem('coach_hoo_custom_foods');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function getCustomFastFoods(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem('coach_hoo_custom_fast_foods');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Look up the display label for a LogItem so allergen matching can run against text.
 * Returns lowercase keywords to test. Handles manual / food / recipe / restaurant.
 */
export async function resolveLogItemKeywords(item: any): Promise<string[]> {
  if (!item) return [];

  if (item.type === 'manual' || item.food_type) {
    return [String(item.food_type || '').toLowerCase()];
  }

  if (item.type === 'recipe') {
    const recipe = RECIPES_DB.find((r) => r.id === item.id);
    if (recipe) {
      return [recipe.name.toLowerCase(), ...(recipe.ingredients ?? []).map((ing) => ing.name.toLowerCase())];
    }
    return [];
  }

  if (item.type === 'restaurant') {
    const custom = await getCustomFastFoods();
    const rest = custom.find((rt: any) => rt.id === item.id);
    return [String(rest?.name || '').toLowerCase(), String(rest?.restaurant_name || '').toLowerCase()];
  }

  // food (or fallback)
  if (item.type === 'food') {
    const custom = await getCustomFoods();
    const food = [...FOODS_DB, ...custom].find((f) => f.id === item.id);
    return [String(food?.name || '').toLowerCase()];
  }

  return [];
}

/**
 * Convenience: check a list of LogItems against a user, return allergen matches per index.
 */
export async function checkLogItemsForAllergens(
  user: UserLike | null | undefined,
  items: any[],
): Promise<boolean[]> {
  const results: boolean[] = [];
  for (const item of items ?? []) {
    const keywords = await resolveLogItemKeywords(item);
    results.push(findAllergenMatches(user, keywords).length > 0);
  }
  return results;
}

/** Convenience for single manual text input (live typing validation). */
export function findTextAllergens(user: UserLike | null | undefined, text: string): string[] {
  return findAllergenMatches(user, [text]);
}