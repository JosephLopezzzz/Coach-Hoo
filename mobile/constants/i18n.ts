import { STRINGS, type StringKey } from './strings';
import type { Language } from '../services/coachMessageService';

export type { StringKey };
export type TParams = Record<string, string | number>;

/** Fills {name}-style placeholders. Unmatched placeholders are left in place. */
function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in params ? String(params[key]) : match,
  );
}

/**
 * Look up a translated string. Falls back to English when a Filipino entry is
 * empty, and to the key itself if the key is somehow missing at runtime.
 */
export function t(lang: Language, key: StringKey, params?: TParams): string {
  const pair = STRINGS[key];
  if (!pair) return key;
  const value = (lang === 'filipino' ? pair[1] : pair[0]) || pair[0];
  return interpolate(value, params);
}

export type TFunction = (key: StringKey, params?: TParams) => string;

/** Pre-bind a language so components can call t('some.key') directly. */
export function createT(lang: Language): TFunction {
  return (key, params) => t(lang, key, params);
}

// ─── Language-aware option lists ─────────────────────────────────────────────
// The onboarding selects use grouped {category, items} shapes. These build them
// from the string table so both the group headers and the item labels translate.

export interface SelectItem {
  key: string;
  label: string;
}
export interface SelectGroup {
  category: string;
  items: SelectItem[];
}

type GroupSpec = { category: StringKey; items: { key: string; label: StringKey }[] };

const HEALTH_GROUP_SPEC: GroupSpec[] = [
  {
    category: 'cat.metabolic',
    items: [
      { key: 'type1_diabetes', label: 'cond.type1_diabetes' },
      { key: 'type2_diabetes', label: 'cond.type2_diabetes' },
      { key: 'prediabetes', label: 'cond.prediabetes' },
      { key: 'pcos', label: 'cond.pcos' },
      { key: 'hypothyroidism', label: 'cond.hypothyroidism' },
      { key: 'hyperthyroidism', label: 'cond.hyperthyroidism' },
    ],
  },
  {
    category: 'cat.heart',
    items: [
      { key: 'high_blood_pressure', label: 'cond.high_blood_pressure' },
      { key: 'high_cholesterol', label: 'cond.high_cholesterol' },
      { key: 'heart_disease', label: 'cond.heart_disease' },
      { key: 'heart_failure', label: 'cond.heart_failure' },
    ],
  },
  {
    category: 'cat.digestive',
    items: [
      { key: 'celiac', label: 'cond.celiac' },
      { key: 'ibs', label: 'cond.ibs' },
      { key: 'ibd', label: 'cond.ibd' },
      { key: 'gerd', label: 'cond.gerd' },
      { key: 'chronic_constipation', label: 'cond.chronic_constipation' },
    ],
  },
  {
    category: 'cat.kidneyLiver',
    items: [
      { key: 'ckd', label: 'cond.ckd' },
      { key: 'kidney_stones', label: 'cond.kidney_stones' },
      { key: 'fatty_liver', label: 'cond.fatty_liver' },
      { key: 'liver_disease', label: 'cond.liver_disease' },
    ],
  },
  {
    category: 'cat.boneBlood',
    items: [
      { key: 'iron_deficiency', label: 'cond.iron_deficiency' },
      { key: 'osteoporosis', label: 'cond.osteoporosis' },
    ],
  },
  {
    category: 'cat.otherDiet',
    items: [
      { key: 'gout', label: 'cond.gout' },
      { key: 'pregnancy', label: 'cond.pregnancy' },
      { key: 'breastfeeding', label: 'cond.breastfeeding' },
      { key: 'eating_disorder', label: 'cond.eating_disorder' },
    ],
  },
];

const ALLERGEN_GROUP_SPEC: GroupSpec[] = [
  {
    category: 'cat.commonAllergens',
    items: [
      { key: 'milk', label: 'allergen.milk' },
      { key: 'egg', label: 'allergen.egg' },
      { key: 'peanut', label: 'allergen.peanut' },
      { key: 'tree_nuts', label: 'allergen.tree_nuts' },
      { key: 'soy', label: 'allergen.soy' },
      { key: 'wheat', label: 'allergen.wheat' },
      { key: 'sesame', label: 'allergen.sesame' },
      { key: 'fish', label: 'allergen.fish' },
    ],
  },
  {
    category: 'cat.shellfish',
    items: [
      { key: 'crustacean', label: 'allergen.crustacean' },
      { key: 'mollusks', label: 'allergen.mollusks' },
    ],
  },
  {
    category: 'cat.otherAllergens',
    items: [
      { key: 'corn', label: 'allergen.corn' },
      { key: 'coconut', label: 'allergen.coconut' },
      { key: 'mustard', label: 'allergen.mustard' },
      { key: 'celery', label: 'allergen.celery' },
      { key: 'lupin', label: 'allergen.lupin' },
      { key: 'sulfites', label: 'allergen.sulfites' },
    ],
  },
  {
    category: 'cat.fruits',
    items: [
      { key: 'kiwi', label: 'allergen.kiwi' },
      { key: 'banana', label: 'allergen.banana' },
      { key: 'avocado', label: 'allergen.avocado' },
      { key: 'strawberry', label: 'allergen.strawberry' },
    ],
  },
];

function buildGroups(lang: Language, spec: GroupSpec[]): SelectGroup[] {
  return spec.map((group) => ({
    category: t(lang, group.category),
    items: group.items.map((item) => ({ key: item.key, label: t(lang, item.label) })),
  }));
}

export function getHealthConditionGroups(lang: Language): SelectGroup[] {
  return buildGroups(lang, HEALTH_GROUP_SPEC);
}

export function getAllergenGroups(lang: Language): SelectGroup[] {
  return buildGroups(lang, ALLERGEN_GROUP_SPEC);
}

/** 'none' / 'other' / 'prefer_not_say' rows shared by both select screens. */
export function getMetaOptions(lang: Language): SelectItem[] {
  return [
    { key: 'none', label: t(lang, 'common.none') },
    { key: 'other', label: t(lang, 'common.other') },
    { key: 'prefer_not_say', label: t(lang, 'common.preferNotToSay') },
  ];
}

/**
 * Resolve a stored condition/allergen key back to a label. Keys are persisted,
 * so a profile saved in English still renders in Filipino after a switch.
 */
export function labelForOptionKey(lang: Language, key: string): string {
  for (const spec of [...HEALTH_GROUP_SPEC, ...ALLERGEN_GROUP_SPEC]) {
    const found = spec.items.find((item) => item.key === key);
    if (found) return t(lang, found.label);
  }
  const meta = getMetaOptions(lang).find((option) => option.key === key);
  return meta ? meta.label : key;
}

// ─── Enum label helpers ──────────────────────────────────────────────────────

const MEAL_KEYS: Record<string, StringKey> = {
  breakfast: 'meal.breakfast',
  lunch: 'meal.lunch',
  dinner: 'meal.dinner',
  snack: 'meal.snack',
};

export function getMealTypeLabel(lang: Language, mealType: string): string {
  const key = MEAL_KEYS[mealType.toLowerCase()];
  return key ? t(lang, key) : mealType;
}

const COOKING_KEYS: Record<string, StringKey> = {
  raw: 'cooking.raw',
  boiled: 'cooking.boiled',
  steamed: 'cooking.steamed',
  grilled: 'cooking.grilled',
  baked: 'cooking.baked',
  fried: 'cooking.fried',
  deep_fried: 'cooking.deep_fried',
  sauteed: 'cooking.sauteed',
  stewed: 'cooking.stewed',
  roasted: 'cooking.roasted',
};

export function getCookingMethodLabel(lang: Language, method: string): string {
  const key = COOKING_KEYS[method.toLowerCase()];
  return key ? t(lang, key) : method;
}

const GOAL_KEYS: Record<string, StringKey> = {
  lose: 'goal.lose',
  maintain: 'goal.maintain',
  gain: 'goal.gain',
  build_habits: 'goal.build_habits',
};

export function getGoalLabel(lang: Language, goal: string): string {
  const key = GOAL_KEYS[goal];
  return key ? t(lang, key) : goal;
}

const ACTIVITY_KEYS: Record<number, StringKey> = {
  1: 'activity.1',
  2: 'activity.2',
  3: 'activity.3',
  4: 'activity.4',
  5: 'activity.5',
};

export function getActivityLabel(lang: Language, level: number): string {
  return t(lang, ACTIVITY_KEYS[level] ?? 'activity.2');
}
