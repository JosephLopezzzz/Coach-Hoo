import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DB_NAME = 'coach_hoo.db';
const LEGACY_MEALS_KEY = 'coach_hoo_logged_meals';

let db: SQLite.SQLiteDatabase | null = null;

if (Platform.OS !== 'web') {
  try {
    db = SQLite.openDatabaseSync(DB_NAME);
  } catch (e) {
    console.error('Failed to open SQLite db:', e);
  }
}

export const initDb = async () => {
  if (!db) return; // Web fallback

  try {
    // Create meals table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS meals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        logged_date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // Create meal_items table with foreign key
    db.execSync(`
      CREATE TABLE IF NOT EXISTS meal_items (
        id TEXT PRIMARY KEY,
        meal_id TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        food_name TEXT NOT NULL,
        quantity_g REAL NOT NULL,
        cooking_method TEXT NOT NULL,
        with_bones INTEGER NOT NULL,
        bone_weight_g REAL,
        calculated_calories REAL NOT NULL,
        calculated_protein REAL NOT NULL,
        calculated_carbs REAL NOT NULL,
        calculated_fat REAL NOT NULL,
        FOREIGN KEY (meal_id) REFERENCES meals (id) ON DELETE CASCADE
      );
    `);

    // Create sync_queue table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    await migrateLegacyData();
  } catch (e) {
    console.error('Failed to init DB:', e);
  }
};

const migrateLegacyData = async () => {
  if (!db) return;

  try {
    const raw = await AsyncStorage.getItem(LEGACY_MEALS_KEY);
    if (!raw) return; 

    const meals = JSON.parse(raw);
    if (!Array.isArray(meals) || meals.length === 0) return;

    console.log(`Migrating ${meals.length} legacy meals to SQLite...`);

    db.withTransactionSync(() => {
      for (const meal of meals) {
        db!.runSync(
          `INSERT OR IGNORE INTO meals (id, user_id, meal_type, logged_date, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            meal.id,
            meal.user_id,
            meal.meal_type,
            meal.logged_date,
            meal.notes || '',
            meal.created_at,
          ]
        );

        for (const item of meal.items || []) {
          db!.runSync(
            `INSERT OR IGNORE INTO meal_items 
             (id, meal_id, source_type, source_id, food_name, quantity_g, cooking_method, with_bones, bone_weight_g, calculated_calories, calculated_protein, calculated_carbs, calculated_fat)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.id,
              meal.id,
              item.source_type,
              item.source_id,
              item.food_name,
              item.quantity_g,
              item.cooking_method,
              item.with_bones ? 1 : 0,
              item.bone_weight_g || null,
              item.calculated_calories,
              item.calculated_protein,
              item.calculated_carbs,
              item.calculated_fat,
            ]
          );
        }
      }
    });

    console.log('Migration successful. Clearing legacy AsyncStorage key.');
    await AsyncStorage.removeItem(LEGACY_MEALS_KEY);
  } catch (e) {
    console.error('Failed to migrate legacy data to SQLite:', e);
  }
};

export const getDb = () => db;
