import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMeals } from '../../context/MealContext';
import ManualEntryForm from '../../components/ManualEntryForm';
import { Colors, FontSize, FontWeight, Spacing, Radius, MEAL_TYPES } from '../../constants/theme';
import type { LogItem } from '../../types';
import { calculateApi } from '../../services/api';

export default function LogMealScreen() {
  const { logMeal } = useMeals();
  const [mealType, setMealType] = useState<string>('breakfast');
  const [items,    setItems]    = useState<LogItem[]>([]);
  const [preview,  setPreview]  = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState<'manual' | 'preview'>('manual');

  const addItem = async (item: LogItem) => {
    const newItems = [...items, item];
    setItems(newItems);
    // Preview macros
    try {
      const { data } = await calculateApi.macros(newItems);
      setPreview({
        calories: data.total_calories,
        protein:  data.total_protein,
        carbs:    data.total_carbs,
        fat:      data.total_fat,
      });
    } catch (err) {
      console.warn('[Preview]', err);
    }
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (items.length <= 1) setPreview(null);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      Alert.alert('No items', 'Add at least one food item before logging.');
      return;
    }
    setLoading(true);
    try {
      await logMeal(mealType, items);
      Alert.alert('Meal logged! 🎉', `${mealType} logged with ${items.length} item(s)`, [
        { text: 'OK', onPress: () => { setItems([]); setPreview(null); } },
      ]);
    } catch (err: any) {
      console.error('[LogMeal] Submit failed:', err.response?.data ?? err.message);
      const errorMsg = err.response?.data?.error ?? err.message ?? 'Could not log meal.';
      Alert.alert('Logging Failed', `${errorMsg}\n\nMake sure the food names are recognizable or try adding fewer items.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Meal</Text>

        {/* Meal type selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealTypeScroll}>
          {MEAL_TYPES.map((mt) => (
            <Pressable
              key={mt.key}
              style={[styles.mealTypeBtn, mealType === mt.key && { backgroundColor: `${mt.color}20`, borderColor: mt.color }]}
              onPress={() => setMealType(mt.key)}
            >
              <Ionicons name={mt.icon as any} size={16} color={mealType === mt.key ? mt.color : Colors.textMuted} />
              <Text style={[styles.mealTypeText, mealType === mt.key && { color: mt.color }]}>
                {mt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Pending items list */}
        {items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items to Log ({items.length})</Text>
            {items.map((item, idx) => {
              const label = item.type === 'manual'
                ? `${(item as any).food_type} · ${(item as any).method ?? 'raw'} · ${item.quantity_g}g${(item as any).with_bones ? ' · 🦴' : ''}`
                : `${item.type} · ${item.quantity_g}g`;
              return (
                <View key={idx} style={styles.pendingItem}>
                  <Text style={styles.pendingLabel} numberOfLines={1}>{label}</Text>
                  <Pressable onPress={() => removeItem(idx)} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </Pressable>
                </View>
              );
            })}

            {/* Preview macros */}
            {preview && (
              <View style={styles.previewRow}>
                {[
                  { label: 'kcal', value: preview.calories, color: Colors.calories },
                  { label: 'P',    value: preview.protein,  color: Colors.protein },
                  { label: 'C',    value: preview.carbs,    color: Colors.carbs },
                  { label: 'F',    value: preview.fat,      color: Colors.fat },
                ].map((m) => (
                  <View key={m.label} style={[styles.previewPill, { backgroundColor: `${m.color}15` }]}>
                    <Text style={[styles.previewValue, { color: m.color }]}>{Math.round(m.value)}</Text>
                    <Text style={styles.previewLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Manual entry form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Manual Entry</Text>
          <ManualEntryForm onSubmit={addItem} />
        </View>

        {/* Submit button */}
        <Pressable
          style={[styles.submitBtn, items.length === 0 && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || items.length === 0}
        >
          {loading
            ? <ActivityIndicator color={Colors.textInverse} />
            : <>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textInverse} />
                <Text style={styles.submitText}>Log {mealType} ({items.length} items)</Text>
              </>
          }
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  mealTypeScroll: { flexGrow: 0 },
  mealTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    backgroundColor: Colors.bgElevated,
  },
  mealTypeText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  body: { flex: 1 },
  bodyContent: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pendingLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, marginRight: 8 },
  previewRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  previewPill: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.md,
  },
  previewValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  previewLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  submitBtnDisabled: { backgroundColor: Colors.bgElevated },
  submitText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
