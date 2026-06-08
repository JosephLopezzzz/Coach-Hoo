import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Core Offline Databases ───────────────────────────────────────────────────

export const FOODS_DB = [
  { id: 'f1', name: 'Chicken Breast', category: 'poultry', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, is_raw: true, source: 'USDA' },
  { id: 'f2', name: 'Chicken Thigh', category: 'poultry', calories_per_100g: 209, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 10.9, is_raw: true, source: 'USDA' },
  { id: 'f3', name: 'Chicken Wings', category: 'poultry', calories_per_100g: 203, protein_per_100g: 30, carbs_per_100g: 0, fat_per_100g: 8.1, is_raw: true, source: 'USDA' },
  { id: 'f4', name: 'Pork Belly', category: 'pork', calories_per_100g: 518, protein_per_100g: 9, carbs_per_100g: 0, fat_per_100g: 53, is_raw: true, source: 'USDA' },
  { id: 'f5', name: 'Ground Beef', category: 'beef', calories_per_100g: 250, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 15, is_raw: true, source: 'USDA' },
  { id: 'f6', name: 'Egg (Whole)', category: 'dairy-eggs', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11, is_raw: false, source: 'USDA' },
  { id: 'f7', name: 'White Rice (Cooked)', category: 'grains', calories_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3, is_raw: false, source: 'USDA' },
  { id: 'f8', name: 'Brown Rice (Cooked)', category: 'grains', calories_per_100g: 111, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9, is_raw: false, source: 'USDA' },
  { id: 'f9', name: 'Tilapia', category: 'fish', calories_per_100g: 96, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 1.7, is_raw: true, source: 'USDA' },
  { id: 'f10', name: 'Bangus (Milkfish)', category: 'fish', calories_per_100g: 148, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 6.7, is_raw: true, source: 'FNRI' },
  { id: 'f11', name: 'Tofu', category: 'soy', calories_per_100g: 76, protein_per_100g: 8, carbs_per_100g: 1.9, fat_per_100g: 4.8, is_raw: false, source: 'USDA' },
  { id: 'f12', name: 'Shrimp', category: 'seafood', calories_per_100g: 85, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 0.5, is_raw: true, source: 'USDA' },
  { id: 'f13', name: 'Squid', category: 'seafood', calories_per_100g: 92, protein_per_100g: 16, carbs_per_100g: 3, fat_per_100g: 1.4, is_raw: true, source: 'USDA' },
  { id: 'f14', name: 'Pork Chop', category: 'pork', calories_per_100g: 231, protein_per_100g: 24, carbs_per_100g: 0, fat_per_100g: 14, is_raw: true, source: 'USDA' },
  { id: 'f15', name: 'Beef Ribeye', category: 'beef', calories_per_100g: 291, protein_per_100g: 24, carbs_per_100g: 0, fat_per_100g: 22, is_raw: true, source: 'USDA' },
  { id: 'f16', name: 'Milk (Whole)', category: 'beverages', calories_per_100g: 61, protein_per_100g: 3.2, carbs_per_100g: 4.8, fat_per_100g: 3.3, is_raw: false, source: 'USDA' },
  { id: 'f17', name: 'Soda (Coke)', category: 'beverages', calories_per_100g: 38, protein_per_100g: 0, carbs_per_100g: 9.8, fat_per_100g: 0, is_raw: false, source: 'USDA' },
  { id: 'f18', name: 'Black Coffee', category: 'beverages', calories_per_100g: 2, protein_per_100g: 0.3, carbs_per_100g: 0, fat_per_100g: 0, is_raw: false, source: 'USDA' },
  { id: 'f19', name: 'Orange Juice', category: 'beverages', calories_per_100g: 45, protein_per_100g: 0.7, carbs_per_100g: 10.4, fat_per_100g: 0.2, is_raw: false, source: 'USDA' },
  { id: 'f20', name: 'Whey Protein Shake', category: 'beverages', calories_per_100g: 80, protein_per_100g: 16, carbs_per_100g: 1.5, fat_per_100g: 1, is_raw: false, source: 'USDA' },
  { id: 'f21', name: 'Broccoli', category: 'vegetables', calories_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4, is_raw: true, source: 'USDA' },
  { id: 'f22', name: 'Spinach', category: 'vegetables', calories_per_100g: 23, protein_per_100g: 2.9, carbs_per_100g: 3.6, fat_per_100g: 0.4, is_raw: true, source: 'USDA' },
  { id: 'f23', name: 'Kangkong', category: 'vegetables', calories_per_100g: 19, protein_per_100g: 2.6, carbs_per_100g: 3.1, fat_per_100g: 0.2, is_raw: true, source: 'FNRI' },
  { id: 'f24', name: 'Potato', category: 'vegetables', calories_per_100g: 87, protein_per_100g: 2, carbs_per_100g: 20, fat_per_100g: 0.1, is_raw: true, source: 'USDA' },
  { id: 'f25', name: 'Cabbage', category: 'vegetables', calories_per_100g: 25, protein_per_100g: 1.3, carbs_per_100g: 6, fat_per_100g: 0.1, is_raw: true, source: 'USDA' },
  { id: 'f26', name: 'Banana', category: 'fruits', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3, is_raw: false, source: 'USDA' },
  { id: 'f27', name: 'Apple', category: 'fruits', calories_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2, is_raw: false, source: 'USDA' },
  { id: 'f28', name: 'Mango', category: 'fruits', calories_per_100g: 60, protein_per_100g: 0.8, carbs_per_100g: 15, fat_per_100g: 0.4, is_raw: false, source: 'USDA' },
  { id: 'f29', name: 'Avocado', category: 'fruits', calories_per_100g: 160, protein_per_100g: 2, carbs_per_100g: 9, fat_per_100g: 15, is_raw: false, source: 'USDA' },
  { id: 'f30', name: 'Calamansi', category: 'fruits', calories_per_100g: 30, protein_per_100g: 0.5, carbs_per_100g: 7, fat_per_100g: 0.1, is_raw: false, source: 'FNRI' },
];

export const RECIPES_DB = [
  { id: 'r1', name: 'Chicken Adobo', country: 'PH', total_weight_g: 500, description: 'Classic Filipino soy-sauce and vinegar stewed chicken', meal_types: ['lunch', 'dinner'], macros_per_100g: { calories: 180, protein: 18, carbs: 3, fat: 11 } },
  { id: 'r2', name: 'Pork Sinigang', country: 'PH', total_weight_g: 600, description: 'Sour tamarind soup with pork ribs and mixed vegetables', meal_types: ['lunch', 'dinner'], macros_per_100g: { calories: 120, protein: 10, carbs: 4, fat: 7 } },
  { id: 'r3', name: 'Chicken Tinola', country: 'PH', total_weight_g: 500, description: 'Ginger-flavored chicken soup with green papaya and chili leaves', meal_types: ['lunch', 'dinner'], macros_per_100g: { calories: 90, protein: 12, carbs: 2, fat: 4 } },
  { id: 'r4', name: 'Beef Kare-Kare', country: 'PH', total_weight_g: 650, description: 'Beef stew in a thick savory peanut sauce with vegetables', meal_types: ['lunch', 'dinner'], macros_per_100g: { calories: 220, protein: 15, carbs: 8, fat: 14 } },
  { id: 'r5', name: 'Chicken Inasal', country: 'PH', total_weight_g: 300, description: 'Ilonggo-style grilled chicken marinated in calamansi, lemongrass, and annatto', meal_types: ['lunch', 'dinner'], macros_per_100g: { calories: 195, protein: 24, carbs: 1, fat: 10 } },
];

export const RESTAURANT_DB = [
  { id: 'rt1', name: 'Jollibee 1pc Chickenjoy', restaurant_name: 'Jollibee', serving_size_g: 120, calories: 360, protein: 22, carbs: 12, fat: 24, country: 'PH' },
  { id: 'rt2', name: 'Jollibee Peach Mango Pie', restaurant_name: 'Jollibee', serving_size_g: 80, calories: 270, protein: 3, carbs: 35, fat: 13, country: 'PH' },
  { id: 'rt3', name: 'Jollibee Jolly Spaghetti', restaurant_name: 'Jollibee', serving_size_g: 220, calories: 400, protein: 12, carbs: 62, fat: 11, country: 'PH' },
  { id: 'rt4', name: "McDonald's French Fries (Medium)", restaurant_name: "McDonald's", serving_size_g: 117, calories: 320, protein: 4, carbs: 43, fat: 15, country: 'US' },
  { id: 'rt5', name: "McDonald's Big Mac", restaurant_name: "McDonald's", serving_size_g: 220, calories: 540, protein: 25, carbs: 46, fat: 28, country: 'US' },
  { id: 'rt6', name: 'KFC 1pc Original Recipe Chicken', restaurant_name: 'KFC', serving_size_g: 125, calories: 320, protein: 19, carbs: 8, fat: 23, country: 'US' },
];

// ─── Local Helpers ────────────────────────────────────────────────────────────

async function getLocalMeals(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem('coach_hoo_logged_meals');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse meals:', err);
    return [];
  }
}

async function saveLocalMeals(meals: any[]) {
  try {
    await AsyncStorage.setItem('coach_hoo_logged_meals', JSON.stringify(meals));
  } catch (err) {
    console.error('Failed to save meals:', err);
  }
}

async function getCustomFoods(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem('coach_hoo_custom_foods');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse custom foods:', err);
    return [];
  }
}

async function saveCustomFood(newFood: any) {
  try {
    const existing = await getCustomFoods();
    existing.push(newFood);
    await AsyncStorage.setItem('coach_hoo_custom_foods', JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save custom food:', err);
  }
}

async function lookupFoodName(type: string, id: string): Promise<string> {
  if (type === 'food') {
    const custom = await getCustomFoods();
    return [...FOODS_DB, ...custom].find(fd => fd.id === id)?.name ?? 'Food Item';
  }
  if (type === 'recipe') {
    return RECIPES_DB.find(rc => rc.id === id)?.name ?? 'Recipe Item';
  }
  if (type === 'restaurant') {
    return RESTAURANT_DB.find(rt => rt.id === id)?.name ?? 'Fast Food Item';
  }
  return 'Food';
}

export function calculateDailyTargets(user: any) {
  const age = parseFloat(user.age) || 25;
  const height = parseFloat(user.height_cm) || 170;
  const weight = parseFloat(user.weight_kg) || 70;
  const sex = user.sex || 'male';
  const goal = user.goal || 'maintain';

  // Mifflin-St Jeor Formula BMR
  let bmr = 0;
  if (sex === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // TDEE - assumes Lightly Active multiplier (1.375)
  const tdee = bmr * 1.375;

  let calories_target = tdee;
  if (goal === 'lose') {
    calories_target = tdee - 500;
  } else if (goal === 'gain') {
    calories_target = tdee + 300;
  }

  // Standard Macros Target Split
  const protein_target = Math.round(weight * 2.0); // 2.0g per kg of bodyweight
  const fat_target = Math.round((calories_target * 0.25) / 9); // 25% of calories
  const carbs_target = Math.round((calories_target - (protein_target * 4) - (fat_target * 9)) / 4);

  return {
    calories_target: Math.round(calories_target),
    protein_target,
    carbs_target,
    fat_target,
  };
}

export async function calculateItemMacros(item: any) {
  let quantity = parseFloat(item.quantity_g) || 0;
  let edibleWeight = quantity;

  // Custom bone weight subtraction
  if (item.bone_weight_g !== undefined && item.bone_weight_g > 0) {
    edibleWeight = Math.max(0, quantity - parseFloat(item.bone_weight_g));
  } else if (item.with_bones) {
    edibleWeight = quantity * 0.7; // default 70% edible weight reduction
  }

  let cal = 0, p = 0, c = 0, f = 0;

  if (item.type === 'manual' || item.food_type) {
    if (item.manual_macros) {
      return item.manual_macros;
    }

    const foodType = (item.food_type || '').toLowerCase();
    const customFoods = await getCustomFoods();
    const allFoods = [...FOODS_DB, ...customFoods];
    let baseFood = allFoods.find(fd => fd.name.toLowerCase().includes(foodType)) || 
                   allFoods.find(fd => foodType.includes(fd.name.toLowerCase()));
    
    if (!baseFood) {
      if (foodType.includes('pork')) {
        baseFood = FOODS_DB.find(fd => fd.id === 'f14')!; // pork chop
      } else if (foodType.includes('beef')) {
        baseFood = FOODS_DB.find(fd => fd.id === 'f5')!; // ground beef
      } else if (foodType.includes('rice')) {
        baseFood = FOODS_DB.find(fd => fd.id === 'f7')!; // white rice
      } else if (foodType.includes('egg')) {
        baseFood = FOODS_DB.find(fd => fd.id === 'f6')!; // egg
      } else if (foodType.includes('fish') || foodType.includes('tilapia') || foodType.includes('bangus') || foodType.includes('seafood') || foodType.includes('shrimp') || foodType.includes('squid')) {
        baseFood = FOODS_DB.find(fd => fd.id === 'f9')!; // tilapia
      } else if (foodType.includes('milk') || foodType.includes('drink') || foodType.includes('juice') || foodType.includes('beverage') || foodType.includes('coffee') || foodType.includes('soda') || foodType.includes('coke') || foodType.includes('shake') || foodType.includes('water') || foodType.includes('tea')) {
        baseFood = FOODS_DB.find(fd => fd.id === 'f16')!; // default to whole milk
      } else if (foodType.includes('vegetable') || foodType.includes('broccoli') || foodType.includes('spinach') || foodType.includes('kangkong') || foodType.includes('cabbage') || foodType.includes('salad') || foodType.includes('potato')) {
        baseFood = FOODS_DB.find(fd => fd.id === 'f21')!; // default to broccoli
      } else if (foodType.includes('fruit') || foodType.includes('banana') || foodType.includes('apple') || foodType.includes('mango') || foodType.includes('avocado') || foodType.includes('orange') || foodType.includes('calamansi')) {
        baseFood = FOODS_DB.find(fd => fd.id === 'f26')!; // default to banana
      } else {
        baseFood = FOODS_DB.find(fd => fd.id === 'f1')!; // default to chicken breast
      }
    }

    const multiplier = edibleWeight / 100;
    cal = baseFood.calories_per_100g * multiplier;
    p = baseFood.protein_per_100g * multiplier;
    c = baseFood.carbs_per_100g * multiplier;
    f = baseFood.fat_per_100g * multiplier;

    // Cooking adjustments
    const method = (item.method || item.cooking_method || 'raw').toLowerCase();
    if (method === 'fried') {
      f += 5 * multiplier;
      cal += 45 * multiplier;
    } else if (method === 'deep_fried') {
      f += 10 * multiplier;
      cal += 90 * multiplier;
    } else if (method === 'sauteed') {
      f += 3 * multiplier;
      cal += 27 * multiplier;
    }

  } else if (item.type === 'food') {
    const customFoods = await getCustomFoods();
    const baseFood = [...FOODS_DB, ...customFoods].find(fd => fd.id === item.id);
    if (baseFood) {
      const multiplier = edibleWeight / 100;
      cal = baseFood.calories_per_100g * multiplier;
      p = baseFood.protein_per_100g * multiplier;
      c = baseFood.carbs_per_100g * multiplier;
      f = baseFood.fat_per_100g * multiplier;

      const method = (item.cooking_method || 'raw').toLowerCase();
      if (method === 'fried') {
        f += 5 * multiplier;
        cal += 45 * multiplier;
      } else if (method === 'deep_fried') {
        f += 10 * multiplier;
        cal += 90 * multiplier;
      } else if (method === 'sauteed') {
        f += 3 * multiplier;
        cal += 27 * multiplier;
      }
    }
  } else if (item.type === 'recipe') {
    const baseRecipe = RECIPES_DB.find(rc => rc.id === item.id);
    if (baseRecipe) {
      const multiplier = edibleWeight / 100;
      cal = (baseRecipe.macros_per_100g?.calories ?? 0) * multiplier;
      p = (baseRecipe.macros_per_100g?.protein ?? 0) * multiplier;
      c = (baseRecipe.macros_per_100g?.carbs ?? 0) * multiplier;
      f = (baseRecipe.macros_per_100g?.fat ?? 0) * multiplier;
    }
  } else if (item.type === 'restaurant') {
    const baseRest = RESTAURANT_DB.find(rt => rt.id === item.id);
    if (baseRest) {
      const multiplier = quantity / baseRest.serving_size_g;
      cal = baseRest.calories * multiplier;
      p = baseRest.protein * multiplier;
      c = baseRest.carbs * multiplier;
      f = baseRest.fat * multiplier;
    }
  }

  return { calories: cal, protein: p, carbs: c, fat: f };
}

// ─── API Mock Exports ─────────────────────────────────────────────────────────

export const authApi = {
  register: async (payload: any) => {
    return { data: { token: 'mock-token', user: payload } };
  },
  login: async (email: string) => {
    return { data: { token: 'mock-token', user: { email } } };
  },
  me: async () => {
    const raw = await SecureStore.getItemAsync('coach_hoo_user_data');
    return { data: raw ? JSON.parse(raw) : null };
  },
  update: async (payload: any) => {
    const raw = await SecureStore.getItemAsync('coach_hoo_user_data');
    const user = raw ? JSON.parse(raw) : {};
    const next = { ...user, ...payload };
    await SecureStore.setItemAsync('coach_hoo_user_data', JSON.stringify(next));
    return { data: next };
  },
};

export const foodsApi = {
  search: async (q: string, category?: string) => {
    const qc = (q || '').toLowerCase().trim();
    const customFoods = await getCustomFoods();
    let results = [...FOODS_DB, ...customFoods];
    if (qc) {
      results = results.filter(f => f.name.toLowerCase().includes(qc));
    }
    if (category) {
      results = results.filter(f => f.category === category);
    }
    return { data: { results } };
  },
  getById: async (id: string) => {
    const customFoods = await getCustomFoods();
    const food = [...FOODS_DB, ...customFoods].find(f => f.id === id);
    return { data: food };
  },
  categories: async () => {
    const customFoods = await getCustomFoods();
    const cats = Array.from(new Set([...FOODS_DB, ...customFoods].map(f => f.category)));
    return { data: cats };
  },
  create: async (payload: any) => {
    const newFood = { id: 'f_user_' + Math.random().toString(36).substring(7), ...payload };
    await saveCustomFood(newFood);  // Persisted to AsyncStorage!
    return { data: newFood };
  },
  listCustomFoods: async () => {
    const custom = await getCustomFoods();
    return { data: custom };
  },
  deleteCustomFood: async (id: string) => {
    try {
      const existing = await getCustomFoods();
      const updated = existing.filter(f => f.id !== id);
      await AsyncStorage.setItem('coach_hoo_custom_foods', JSON.stringify(updated));
      return { data: { success: true } };
    } catch (err) {
      console.error('Failed to delete custom food:', err);
      return { data: { success: false } };
    }
  },
};

export const recipesApi = {
  list: async (country?: string, meal_type?: string) => {
    let list = RECIPES_DB;
    if (country) list = list.filter(r => r.country === country);
    if (meal_type) list = list.filter(r => r.meal_types.includes(meal_type));
    return { data: list };
  },
  search: async (q: string) => {
    const qc = (q || '').toLowerCase().trim();
    let results = RECIPES_DB;
    if (qc) {
      results = results.filter(r => r.name.toLowerCase().includes(qc) || r.description?.toLowerCase().includes(qc));
    }
    return { data: { recipes: results } };
  },
  getById: async (id: string) => {
    const recipe = RECIPES_DB.find(r => r.id === id);
    return { data: recipe };
  },
};

export const mealsApi = {
  log: async (payload: { meal_type: string; items: any[]; notes?: string; logged_date?: string }) => {
    let stored = await getLocalMeals();
    
    const processedItems = await Promise.all(payload.items.map(async (item) => {
      const macros = await calculateItemMacros(item);
      return {
        id: 'mi_' + Math.random().toString(36).substring(7),
        source_type: item.type,
        source_id: item.id,
        food_name: item.food_type || (await lookupFoodName(item.type, item.id)),
        quantity_g: parseFloat(item.quantity_g),
        cooking_method: item.method || item.cooking_method || 'raw',
        with_bones: !!item.with_bones,
        bone_weight_g: item.bone_weight_g !== undefined ? parseFloat(item.bone_weight_g) : undefined,
        calculated_calories: macros.calories,
        calculated_protein: macros.protein,
        calculated_carbs: macros.carbs,
        calculated_fat: macros.fat,
      };
    }));

    const newMeal = {
      id: 'm_' + Math.random().toString(36).substring(7),
      user_id: 'local_user',
      meal_type: payload.meal_type,
      logged_date: payload.logged_date || new Date().toISOString().split('T')[0],
      notes: payload.notes || '',
      created_at: new Date().toISOString(),
      items: processedItems,
    };

    stored.push(newMeal);
    await saveLocalMeals(stored);

    return { data: newMeal };
  },

  today: async (date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const meals = await getLocalMeals();
    const filteredMeals = meals.filter(m => m.logged_date === targetDate);

    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    filteredMeals.forEach(meal => {
      meal.items.forEach((item: any) => {
        totals.calories += item.calculated_calories || 0;
        totals.protein += item.calculated_protein || 0;
        totals.carbs += item.calculated_carbs || 0;
        totals.fat += item.calculated_fat || 0;
      });
    });

    let targets = null;
    try {
      const userData = await SecureStore.getItemAsync('coach_hoo_user_data');
      if (userData) {
        const user = JSON.parse(userData);
        targets = calculateDailyTargets(user);
      }
    } catch (_) {}

    let remaining = null;
    if (targets) {
      remaining = {
        calories: Math.max(0, targets.calories_target - totals.calories),
        protein: Math.max(0, targets.protein_target - totals.protein),
        carbs: Math.max(0, targets.carbs_target - totals.carbs),
        fat: Math.max(0, targets.fat_target - totals.fat),
      };
    }

    return {
      data: {
        date: targetDate,
        meals: filteredMeals,
        totals,
        targets,
        remaining,
      }
    };
  },

  delete: async (id: string) => {
    let stored = await getLocalMeals();
    stored = stored.filter(m => m.id !== id);
    await saveLocalMeals(stored);
    return { data: { success: true } };
  },
};

export const calculateApi = {
  macros: async (items: any[]) => {
    let total_calories = 0;
    let total_protein = 0;
    let total_carbs = 0;
    let total_fat = 0;

    for (const item of items) {
      const macros = await calculateItemMacros(item);
      total_calories += macros.calories;
      total_protein += macros.protein;
      total_carbs += macros.carbs;
      total_fat += macros.fat;
    }

    return {
      data: {
        total_calories,
        total_protein,
        total_carbs,
        total_fat,
      }
    };
  },
};

export const recommendApi = {
  meals: async (meal_type?: string, quantity?: number) => {
    // Return a subset of RECIPES_DB as recommendations
    let list = RECIPES_DB;
    if (meal_type) {
      list = list.filter(r => r.meal_types.includes(meal_type));
    }
    const limit = quantity || 3;
    const recommendations = list.slice(0, limit).map((r, index) => {
      const portion_g = 150;
      const factor = portion_g / 100;
      return {
        id: r.id,
        name: r.name,
        country: r.country,
        total_weight_g: r.total_weight_g,
        description: r.description,
        meal_types: r.meal_types,
        macros_per_portion: {
          portion_g,
          calories: r.macros_per_100g.calories * factor,
          protein: r.macros_per_100g.protein * factor,
          carbs: r.macros_per_100g.carbs * factor,
          fat: r.macros_per_100g.fat * factor,
        },
        remaining_after: { calories: 500, protein: 40, carbs: 50, fat: 15 },
        fit_score: 95 - index * 5,
      };
    });
    return { data: recommendations };
  },

  restaurant: async (restaurant?: string) => {
    const qc = (restaurant || '').toLowerCase().trim();
    let items = RESTAURANT_DB;
    if (qc) {
      items = items.filter(rt => rt.restaurant_name.toLowerCase().includes(qc) || rt.name.toLowerCase().includes(qc));
    }
    return { data: { items } };
  },
};

const api = {
  get: async (url: string, config?: any) => {
    console.log('[Mock GET]', url, config);
    return { data: {} };
  },
  post: async (url: string, data?: any) => {
    console.log('[Mock POST]', url, data);
    return { data: {} };
  },
};

export default api;
