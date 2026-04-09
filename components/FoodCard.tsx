import React from 'react';
import {
  View, Text, StyleSheet, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import type { Food, Recipe, RestaurantFood } from '../types';

type FoodCardItem =
  | { source: 'food';       data: Food }
  | { source: 'recipe';     data: Recipe }
  | { source: 'restaurant'; data: RestaurantFood };

interface FoodCardProps {
  item:      FoodCardItem;
  onPress?:  () => void;
  onAdd?:    () => void;
  compact?:  boolean;
}

function MacroPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.pillValue, { color }]}>{Math.round(value)}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

export default function FoodCard({ item, onPress, onAdd, compact = false }: FoodCardProps) {
  let name = '';
  let calories = 0;
  let protein  = 0;
  let carbs    = 0;
  let fat      = 0;
  let badge    = '';
  let badgeColor = Colors.primary;

  if (item.source === 'food') {
    const f = item.data as Food;
    name     = f.name;
    calories = f.calories_per_100g;
    protein  = f.protein_per_100g;
    carbs    = f.carbs_per_100g;
    fat      = f.fat_per_100g;
    badge    = f.is_raw ? 'per 100g raw' : 'per 100g';
    badgeColor = Colors.textMuted;
  } else if (item.source === 'recipe') {
    const r = item.data as Recipe;
    name     = r.name;
    calories = r.macros_per_100g?.calories ?? 0;
    protein  = r.macros_per_100g?.protein  ?? 0;
    carbs    = r.macros_per_100g?.carbs    ?? 0;
    fat      = r.macros_per_100g?.fat      ?? 0;
    badge    = `🇵🇭 ${r.country}`;
    badgeColor = Colors.accent;
  } else {
    const rf = item.data as RestaurantFood;
    name     = rf.name;
    calories = rf.calories;
    protein  = rf.protein;
    carbs    = rf.carbs;
    fat      = rf.fat;
    badge    = rf.restaurant_name;
    badgeColor = Colors.warning;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.top}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={[styles.badge, { borderColor: `${badgeColor}50` }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
        </View>
        <Text style={styles.calories}>{Math.round(calories)} <Text style={styles.kcal}>kcal</Text></Text>
      </View>

      {!compact && (
        <View style={styles.macros}>
          <MacroPill value={protein} label="P" color={Colors.protein} />
          <MacroPill value={carbs}   label="C" color={Colors.carbs} />
          <MacroPill value={fat}     label="F" color={Colors.fat} />
        </View>
      )}

      {onAdd && (
        <Pressable style={styles.addBtn} onPress={onAdd} hitSlop={8}>
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameRow: {
    flex: 1,
    marginRight: 8,
    gap: 4,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  calories: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.calories,
  },
  kcal: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    color: Colors.textMuted,
  },
  macros: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pillValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  pillLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  addBtn: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.sm,
  },
});
