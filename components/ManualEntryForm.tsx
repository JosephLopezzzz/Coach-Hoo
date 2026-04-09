import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  Pressable, ScrollView, Switch,
} from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { COOKING_METHODS, FOOD_TYPES } from '../constants/theme';
import type { LogManualItem } from '../types';

interface ManualEntryFormProps {
  onSubmit: (item: LogManualItem) => void;
}

type ChipListProps<T extends string> = {
  options:  readonly { key: T; label: string }[];
  value:    T;
  onChange: (val: T) => void;
  color?:   string;
};

function ChipList<T extends string>({ options, value, onChange, color = Colors.primary }: ChipListProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
      {options.map((opt) => {
        const selected = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            style={[styles.chip, selected && { backgroundColor: color, borderColor: color }]}
            onPress={() => onChange(opt.key)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function FoodTypeChips({
  value, onChange,
}: {
  value: string; onChange: (v: string) => void;
}) {
  const options = FOOD_TYPES.map((f) => ({ key: f as string, label: f.replace(/-/g, ' ') }));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
      {options.map((opt) => {
        const selected = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            style={[styles.chip, selected && { backgroundColor: Colors.accent, borderColor: Colors.accent }]}
            onPress={() => onChange(opt.key)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default function ManualEntryForm({ onSubmit }: ManualEntryFormProps) {
  const [foodType,      setFoodType]      = useState('chicken');
  const [cookingMethod, setCookingMethod] = useState('raw');
  const [grams,         setGrams]         = useState('100');
  const [withBones,     setWithBones]     = useState(false);
  const [error,         setError]         = useState('');

  const handleSubmit = () => {
    const quantity = parseFloat(grams);
    if (!foodType.trim()) { setError('Enter a food type'); return; }
    if (isNaN(quantity) || quantity <= 0) { setError('Enter a valid weight (g)'); return; }
    setError('');
    onSubmit({
      type:       'manual',
      food_type:  foodType.trim(),
      method:     cookingMethod,
      quantity_g: quantity,
      with_bones: withBones,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Food Type</Text>
      <FoodTypeChips value={foodType} onChange={setFoodType} />

      {/* Custom text override */}
      <TextInput
        style={styles.input}
        placeholder="Or type a food name..."
        placeholderTextColor={Colors.textMuted}
        value={foodType}
        onChangeText={setFoodType}
      />

      <Text style={styles.sectionLabel}>Cooking Method</Text>
      <ChipList
        options={COOKING_METHODS}
        value={cookingMethod as any}
        onChange={setCookingMethod as any}
        color={Colors.primary}
      />

      <Text style={styles.sectionLabel}>Amount (grams)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="e.g. 150"
        placeholderTextColor={Colors.textMuted}
        value={grams}
        onChangeText={setGrams}
      />

      {/* Quick gram buttons */}
      <View style={styles.quickGrams}>
        {['50', '100', '150', '200', '300'].map((g) => (
          <Pressable
            key={g}
            style={[styles.gramBtn, grams === g && styles.gramBtnActive]}
            onPress={() => setGrams(g)}
          >
            <Text style={[styles.gramBtnText, grams === g && styles.gramBtnTextActive]}>
              {g}g
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.bonesRow}>
        <View>
          <Text style={styles.sectionLabel}>With Bones?</Text>
          <Text style={styles.bonesHint}>Applies 70% edible weight reduction</Text>
        </View>
        <Switch
          value={withBones}
          onValueChange={setWithBones}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={Colors.textPrimary}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Add to Meal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 2,
    marginTop: 4,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    backgroundColor: Colors.bgCard,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  quickGrams: {
    flexDirection: 'row',
    gap: 8,
  },
  gramBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gramBtnActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  gramBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  gramBtnTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  bonesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: 4,
  },
  bonesHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
