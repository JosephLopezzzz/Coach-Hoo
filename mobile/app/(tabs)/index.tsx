import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMeals } from '../../context/MealContext';
import { useAuth } from '../../context/AuthContext';
import MacroBar from '../../components/MacroBar';
import MealSection from '../../components/MealSection';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { meals, totals, targets, remaining, isLoading, loadToday, deleteMeal } = useMeals();

  const caloriesTarget = targets?.calories_target ?? 2000;
  const proteinTarget  = targets?.protein_target  ?? 150;
  const carbsTarget    = targets?.carbs_target    ?? 200;
  const fatTarget      = targets?.fat_target      ?? 65;

  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => loadToday()} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getGreeting()} 👋</Text>
          <Text style={styles.name}>{user?.full_name?.split(' ')[0] ?? 'there'}</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <Pressable style={styles.fab} onPress={() => router.push('/(tabs)/log')}>
          <Ionicons name="add" size={24} color={Colors.textInverse} />
        </Pressable>
      </View>


      {/* Macro bars */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Macros Breakdown</Text>
        <MacroBar label="Protein" consumed={totals.protein} target={proteinTarget} color={Colors.protein} />
        <MacroBar label="Carbs"   consumed={totals.carbs}   target={carbsTarget}   color={Colors.carbs} />
        <MacroBar label="Fat"     consumed={totals.fat}     target={fatTarget}     color={Colors.fat} />
      </View>

      {/* Remaining summary */}
      {remaining && (
        <View style={styles.remainingRow}>
          {[
            { label: 'Calories left', value: `${Math.round(remaining.calories)} kcal`, color: Colors.calories },
            { label: 'Protein left',  value: `${Math.round(remaining.protein)}g`,      color: Colors.protein },
          ].map((r) => (
            <View key={r.label} style={[styles.remainCard, { borderColor: `${r.color}30` }]}>
              <Text style={[styles.remainValue, { color: r.color }]}>{r.value}</Text>
              <Text style={styles.remainLabel}>{r.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Today's meals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <Pressable onPress={() => router.push('/(tabs)/log')} style={styles.addMealBtn}>
            <Ionicons name="add" size={16} color={Colors.primary} />
            <Text style={styles.addMealText}>Add</Text>
          </Pressable>
        </View>

        {meals.length === 0 ? (
          <View style={styles.emptyMeals}>
            <Ionicons name="restaurant-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No meals logged today</Text>
            <Text style={styles.emptySubText}>Tap "Add" to start tracking</Text>
          </View>
        ) : (
          meals.map((meal) => (
            <MealSection key={meal.id} meal={meal} onDelete={deleteMeal} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingTop: 56, gap: Spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  greeting: { fontSize: FontSize.md, color: Colors.textSecondary },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  date:  { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  fab: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  section: {},
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addMealText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  remainingRow: { flexDirection: 'row', gap: Spacing.sm },
  remainCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  remainValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  remainLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  emptyMeals: {
    alignItems: 'center', gap: 8, paddingVertical: Spacing.xl,
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
  },
  emptyText:    { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  emptySubText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
