import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMeals } from '../../context/MealContext';
import { useLanguage } from '../../context/LanguageContext';
import { getMealTypeLabel, getCookingMethodLabel } from '../../constants/i18n';
import ManualEntryForm from '../../components/ManualEntryForm';
import Toast from '../../components/Toast';
import type { ToastData } from '../../components/Toast';
import { Colors, FontSize, FontWeight, Spacing, Radius, MEAL_TYPES } from '../../constants/theme';
import type { LogItem } from '../../types';
import { calculateApi } from '../../services/api';

export default function LogMealScreen() {
  const { logMeal } = useMeals();
  const { lang, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [mealType, setMealType] = useState<string>('breakfast');
  const [items,    setItems]    = useState<LogItem[]>([]);
  const [preview,  setPreview]  = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState<'manual' | 'preview'>('manual');
  const [toast,    setToast]    = useState<ToastData | null>(null);

  const addItem = async (item: LogItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const newItems = [...items, item];
    setItems(newItems);
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
      setToast({
        id: 'no-items',
        type: 'error',
        title: t('log.noItemsTitle'),
        subtitle: t('log.noItemsBody'),
      });
      return;
    }
    setLoading(true);
    try {
      await logMeal(mealType, items);
      const mealLabel = getMealTypeLabel(lang, mealType);
      const toastSubtitle = t(
        items.length === 1 ? 'log.successBody' : 'log.successBodyPlural',
        { mealType: mealLabel, count: items.length },
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setToast({ id: 'success', type: 'success', title: t('log.successTitle'), subtitle: `🎉 ${toastSubtitle}` });
      setItems([]);
      setPreview(null);
    } catch (err: any) {
      console.error('[LogMeal] Submit failed:', err.response?.data ?? err.message);
      const errorMsg = err.response?.data?.error ?? err.message ?? t('log.failedBody');
      setToast({ id: 'error', type: 'error', title: t('log.failedTitle'), subtitle: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={styles.title}>{t('log.title')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealTypeScroll}>
          {MEAL_TYPES.map((mt) => (
            <Pressable
              key={mt.key}
              style={[styles.mealTypeBtn, mealType === mt.key && { backgroundColor: `${mt.color}20`, borderColor: mt.color }]}
              onPress={() => setMealType(mt.key)}
            >
              <Ionicons name={mt.icon as any} size={16} color={mealType === mt.key ? mt.color : Colors.textMuted} />
              <Text style={[styles.mealTypeText, mealType === mt.key && { color: mt.color }]}>
                {getMealTypeLabel(lang, mt.key)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('log.itemsToLog', { count: items.length })}</Text>
            {items.map((item, idx) => {
              const label = item.type === 'manual'
                ? `${(item as any).food_type} · ${getCookingMethodLabel(lang, (item as any).method ?? 'raw')} · ${item.quantity_g}g${(item as any).bone_weight_g && (item as any).bone_weight_g > 0 ? ` · 🦴 ${(item as any).bone_weight_g}g` : ((item as any).with_bones ? ' · 🦴' : '')}`
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
            {preview && (
              <View style={styles.previewRow}>
                {[
                  { label: t('macro.kcal'), value: preview.calories, color: Colors.calories },
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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('log.manualEntry')}</Text>
          <ManualEntryForm onSubmit={addItem} />
        </View>

        <Pressable
          style={[styles.submitBtn, items.length === 0 && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || items.length === 0}
        >
          {loading
            ? <ActivityIndicator color={Colors.textInverse} />
            : <>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textInverse} />
                <Text style={styles.submitText}>
                  {t('log.submit', { mealType: getMealTypeLabel(lang, mealType), count: items.length })}
                </Text>
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
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgCard,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  mealTypeScroll: {
    flexDirection: 'row',
  },
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
    backgroundColor: Colors.bgInput,
  },
  mealTypeText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    marginBottom: 6,
  },
  pendingLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginRight: 8,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  previewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  previewValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  previewLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 14,
    marginTop: Spacing.xs,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
});
