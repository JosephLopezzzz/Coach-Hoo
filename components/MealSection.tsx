import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import type { Meal, MealItem } from '../types';
import { MEAL_TYPES } from '../constants/theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface MealSectionProps {
  meal:       Meal;
  onDelete?:  (id: string) => void;
}

function ItemRow({ item }: { item: MealItem }) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.food_name ?? item.source_type}
        </Text>
        <Text style={styles.itemMeta}>
          {item.quantity_g}g
          {item.cooking_method && item.cooking_method !== 'raw' ? ` · ${item.cooking_method}` : ''}
          {item.with_bones ? ' · with bones' : ''}
        </Text>
      </View>
      <Text style={styles.itemCal}>{Math.round(item.calculated_calories ?? 0)} kcal</Text>
    </View>
  );
}

export default function MealSection({ meal, onDelete }: MealSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const mealMeta = MEAL_TYPES.find((m) => m.key === meal.meal_type) ?? MEAL_TYPES[0];
  const totalCal = meal.items.reduce((s, i) => s + (i.calculated_calories ?? 0), 0);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => !p);
  };

  return (
    <View style={[styles.container, { borderLeftColor: mealMeta.color }]}>
      <Pressable style={styles.header} onPress={toggle}>
        <View style={styles.headerLeft}>
          <Ionicons name={mealMeta.icon as any} size={18} color={mealMeta.color} />
          <Text style={[styles.mealType, { color: mealMeta.color }]}>{mealMeta.label}</Text>
          <Text style={styles.itemCount}>{meal.items.length} items</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.totalCal}>{Math.round(totalCal)} kcal</Text>
          {onDelete && (
            <Pressable onPress={() => onDelete(meal.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.textMuted}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.items}>
          {meal.items.length === 0 ? (
            <Text style={styles.emptyText}>No items logged</Text>
          ) : (
            meal.items.map((item) => <ItemRow key={item.id} item={item} />)
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealType: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  itemCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalCal: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.calories,
  },
  items: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  itemMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemCal: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
