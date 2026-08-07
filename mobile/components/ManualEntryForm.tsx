import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  Pressable, ScrollView, Switch,
} from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { COOKING_METHODS, FOOD_TYPES } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getCookingMethodLabel, labelForOptionKey } from '../constants/i18n';
import { findTextAllergens } from '../services/allergenService';
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
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const [foodType,      setFoodType]      = useState('chicken');
  const [cookingMethod, setCookingMethod] = useState('raw');
  const [grams,         setGrams]         = useState('100');
  const [hasBones,      setHasBones]      = useState(false);
  const [boneWeight,    setBoneWeight]    = useState('');
  const [showMacros,    setShowMacros]    = useState(false);
  const [macros,        setMacros]        = useState({ cal: '', p: '', c: '', f: '' });
  const [error,         setError]         = useState('');
  const [liveAllergens, setLiveAllergens] = useState<string[]>([]);

  const handleFoodTypeChange = (text: string) => {
    setFoodType(text);
    setLiveAllergens(findTextAllergens(user, text));
  };

  const cookingOptions = React.useMemo(
    () => COOKING_METHODS.map((m) => ({ key: m.key, label: getCookingMethodLabel(lang, m.key) })),
    [lang],
  );

  const handleSubmit = () => {
    const quantity = parseFloat(grams);
    if (!foodType.trim()) { setError(t('form.errFoodType')); return; }
    if (isNaN(quantity) || quantity <= 0) { setError(t('form.errWeight')); return; }
    setError('');

    const payload: any = {
      type:       'manual',
      food_type:  foodType.trim(),
      method:     cookingMethod,
      quantity_g: quantity,
      with_bones: hasBones,
      bone_weight_g: hasBones ? (parseFloat(boneWeight) || 0) : undefined,
    };

    if (showMacros) {
      payload.manual_macros = {
        calories: parseFloat(macros.cal) || 0,
        protein:  parseFloat(macros.p)   || 0,
        carbs:    parseFloat(macros.c)   || 0,
        fat:      parseFloat(macros.f)   || 0,
      };
    }

    onSubmit(payload);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{t('form.foodType')}</Text>
      <FoodTypeChips value={foodType} onChange={handleFoodTypeChange} />

      {/* Custom text override */}
      <TextInput
        style={styles.input}
        placeholder={t('form.foodPlaceholder')}
        placeholderTextColor={Colors.textMuted}
        value={foodType}
        onChangeText={handleFoodTypeChange}
      />

      <Text style={styles.sectionLabel}>{t('form.cookingMethod')}</Text>
      <ChipList
        options={cookingOptions}
        value={cookingMethod as any}
        onChange={setCookingMethod as any}
        color={Colors.primary}
      />

      <Text style={styles.sectionLabel}>{t('form.amountGrams')}</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder={t('ph.exampleGrams')}
        placeholderTextColor={Colors.textMuted}
        value={grams}
        onChangeText={setGrams}
      />

      {/* Quick gram buttons */}
      <View style={styles.quickGrams}>
        {['100', '150', '200', '250'].map((g) => (
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

      <View style={styles.bonesContainer}>
        <View style={styles.bonesRow}>
          <View>
            <Text style={styles.sectionLabel}>{t('form.hasBones')}</Text>
            <Text style={styles.bonesHint}>{t('form.bonesHint')}</Text>
          </View>
          <Switch
            value={hasBones}
            onValueChange={setHasBones}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.textPrimary}
          />
        </View>
        {hasBones && (
          <View style={styles.boneWeightInputRow}>
            <Text style={styles.boneWeightLabel}>{t('form.boneWeight')}</Text>
            <TextInput
              style={styles.boneInput}
              keyboardType="decimal-pad"
              placeholder={t('ph.exampleBones')}
              placeholderTextColor={Colors.textMuted}
              value={boneWeight}
              onChangeText={setBoneWeight}
            />
          </View>
        )}
      </View>

      <View style={styles.macrosToggleRow}>
        <Text style={styles.sectionLabel}>{t('form.manualMacros')}</Text>
        <Switch
          value={showMacros}
          onValueChange={setShowMacros}
          trackColor={{ false: Colors.border, true: Colors.accent }}
          thumbColor={Colors.textPrimary}
        />
      </View>

      {showMacros && (
        <View style={styles.manualMacrosGrid}>
          {[
            { key: 'cal', label: t('macro.calories'), color: Colors.calories },
            { key: 'p',   label: t('macro.protein'),  color: Colors.protein },
            { key: 'c',   label: t('macro.carbs'),    color: Colors.carbs },
            { key: 'f',   label: t('macro.fat'),      color: Colors.fat },
          ].map((m) => (
            <View key={m.key} style={styles.macroInputBox}>
              <Text style={[styles.macroInputLabel, { color: m.color }]}>{m.label}</Text>
              <TextInput
                style={styles.macroInput}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                value={(macros as any)[m.key]}
                onChangeText={(v) => setMacros({ ...macros, [m.key]: v })}
              />
            </View>
          ))}
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {liveAllergens.length > 0 && (
        <View style={styles.allergenWarning}>
          <Text style={styles.allergenWarningText}>
            ⚠️ {t('form.liveAllergen', { allergens: liveAllergens.map((a) => labelForOptionKey(lang, a)).join(', ') })}
          </Text>
        </View>
      )}

      <Pressable style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>{t('form.addToMeal')}</Text>
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
    color: Colors.textInverse,
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
  bonesContainer: {
    backgroundColor: Colors.bgElevated,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: 4,
    gap: 8,
  },
  bonesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bonesHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  boneWeightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  boneWeightLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  boneInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    width: 100,
    textAlign: 'right',
  },
  macrosToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  manualMacrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  macroInputBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.bgInput,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  macroInputLabel: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  macroInput: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    height: 32,
    padding: 0,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
  },
  allergenWarning: {
    backgroundColor: `${Colors.error}12`,
    borderWidth: 1,
    borderColor: `${Colors.error}45`,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  allergenWarningText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    flex: 1,
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
