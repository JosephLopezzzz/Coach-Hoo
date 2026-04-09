// ─── Core API Types ───────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name?: string;
  age?: number;
  sex?: 'male' | 'female';
  height_cm?: number;
  weight_kg?: number;
  goal?: 'lose' | 'maintain' | 'gain';
  activity_level?: 1 | 2 | 3 | 4 | 5;
  country?: string;
  created_at: string;
  // Joined from daily_targets
  calories_target?: number;
  protein_target?: number;
  carbs_target?: number;
  fat_target?: number;
}

export interface Food {
  id: string;
  name: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  is_raw: boolean;
  source: string;
}

export interface RecipeIngredient {
  id: string;
  food_id: string;
  food_name: string;
  quantity_g: number;
  cooking_method: string;
  is_cooked: boolean;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export interface Recipe {
  id: string;
  name: string;
  country: string;
  total_weight_g: number;
  description?: string;
  meal_types: string[];
  ingredient_count?: number;
  ingredients?: RecipeIngredient[];
  macros_per_total?: MacroResult;
  macros_per_100g?: MacroResult;
}

export interface RestaurantFood {
  id: string;
  name: string;
  restaurant_name: string;
  serving_size_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  country: string;
}

export interface Meal {
  id: string;
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logged_date: string;
  notes?: string;
  created_at: string;
  items: MealItem[];
}

export interface MealItem {
  id: string;
  meal_id: string;
  source_type: 'food' | 'recipe' | 'restaurant' | 'manual';
  source_id?: string;
  food_name?: string;
  quantity_g: number;
  cooking_method: string;
  with_bones: boolean;
  calculated_calories?: number;
  calculated_protein?: number;
  calculated_carbs?: number;
  calculated_fat?: number;
}

export interface MacroResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyTargets {
  calories_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
}

export interface TodayResponse {
  date: string;
  meals: Meal[];
  totals: MacroResult;
  targets: DailyTargets | null;
  remaining: MacroResult | null;
}

export interface Recommendation {
  id: string;
  name: string;
  country: string;
  total_weight_g: number;
  description?: string;
  meal_types: string[];
  macros_per_portion: MacroResult & { portion_g: number };
  remaining_after: MacroResult;
  fit_score: number;
}

// ─── Log Item Input Types ─────────────────────────────────────────────────────
export interface LogFoodItem {
  type: 'food';
  id: string;
  quantity_g: number;
  cooking_method?: string;
  with_bones?: boolean;
}

export interface LogRecipeItem {
  type: 'recipe';
  id: string;
  quantity_g: number;
}

export interface LogRestaurantItem {
  type: 'restaurant';
  id: string;
  quantity_g: number;
}

export interface LogManualItem {
  type: 'manual';
  food_type: string;
  method?: string;
  quantity_g: number;
  with_bones?: boolean;
}

export type LogItem = LogFoodItem | LogRecipeItem | LogRestaurantItem | LogManualItem;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  user: User;
  targets?: DailyTargets | null;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
  age?: number;
  sex?: 'male' | 'female';
  height_cm?: number;
  weight_kg?: number;
  goal?: 'lose' | 'maintain' | 'gain';
  activity_level?: number;
  country?: string;
}
