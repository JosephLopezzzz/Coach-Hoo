import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
  Image, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

const TOTAL_STEPS = 6;

const ALLERGEN_OPTIONS = [
  { key: 'peanuts',   label: 'Peanuts',     icon: '🥜' },
  { key: 'shellfish', label: 'Shellfish',   icon: '🦐' },
  { key: 'dairy',     label: 'Dairy',       icon: '🐄' },
  { key: 'gluten',    label: 'Gluten/Wheat',icon: '🌾' },
  { key: 'eggs',      label: 'Eggs',        icon: '🥚' },
  { key: 'fish',      label: 'Fish',        icon: '🐟' },
  { key: 'tree nuts', label: 'Tree Nuts',   icon: '🌰' },
  { key: 'soy',       label: 'Soy',         icon: '🫘' },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    sex: '' as 'male' | 'female' | '',
    height_cm: '',
    weight_kg: '',
    heightUnit: 'cm' as 'cm' | 'in',
    weightUnit: 'kg' as 'kg' | 'lbs',
    goal: 'maintain' as 'lose' | 'maintain' | 'gain',
    health_condition: 'none',
    health_condition_custom: '',
    allergies: [] as string[],
    custom_allergy: '',
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const nextStep = () => {
    if (step === 1 && !formData.full_name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (step === 2 && (!formData.age || !formData.sex)) {
      Alert.alert('Required', 'Please enter your age and sex.');
      return;
    }
    if (step === 3 && (!formData.height_cm || !formData.weight_kg)) {
      Alert.alert('Required', 'Please enter your height and weight.');
      return;
    }

    if (step < TOTAL_STEPS) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setStep(step + 1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    } else {
      handleFinish();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setStep(step - 1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }
  };

  const toggleAllergen = (key: string) => {
    setFormData(prev => {
      const already = prev.allergies.includes(key);
      return {
        ...prev,
        allergies: already ? prev.allergies.filter(a => a !== key) : [...prev.allergies, key],
      };
    });
  };

  const addCustomAllergy = () => {
    const val = formData.custom_allergy.trim().toLowerCase();
    if (!val) return;
    if (formData.allergies.includes(val)) {
      setFormData(prev => ({ ...prev, custom_allergy: '' }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      allergies: [...prev.allergies, val],
      custom_allergy: '',
    }));
  };

  const handleFinish = async () => {
    try {
      // Merge custom allergy text if pending
      const finalAllergies = formData.custom_allergy.trim()
        ? [...formData.allergies, formData.custom_allergy.trim().toLowerCase()]
        : formData.allergies;

      const finalHeight = formData.heightUnit === 'in' ? parseFloat(formData.height_cm) * 2.54 : parseFloat(formData.height_cm);
      const finalWeight = formData.weightUnit === 'lbs' ? parseFloat(formData.weight_kg) * 0.45359237 : parseFloat(formData.weight_kg);

      await completeOnboarding({
        ...formData,
        age: parseInt(formData.age),
        height_cm: finalHeight,
        weight_kg: finalWeight,
        sex: formData.sex as 'male' | 'female',
        allergies: finalAllergies,
        health_condition_custom: formData.health_condition === 'others' ? formData.health_condition_custom : '',
      });
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    }
  };

  const stepTitle = [
    "Let's get started!",
    "Tell us about yourself",
    "Your measurements",
    "What is your goal?",
    "Health check",
    "Food allergies",
  ][step - 1];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header / Mascot */}
        <View style={styles.header}>
          <View style={styles.mascotWrapper}>
            <Image 
              source={require('../../assets/mascot/idle.png')} 
              style={styles.mascot}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeText}>{stepTitle}</Text>
          <View style={styles.progressContainer}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <View 
                key={s} 
                style={[styles.progressDot, s <= step && styles.progressDotActive, s === step && styles.progressDotCurrent]} 
              />
            ))}
          </View>
        </View>

        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          {/* ─── Step 1: Name ───────────────────────────────────────────── */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.label}>What should we call you?</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your nickname"
                  placeholderTextColor={Colors.textMuted}
                  value={formData.full_name}
                  onChangeText={(t) => setFormData({ ...formData, full_name: t })}
                  autoFocus
                />
              </View>
              <Text style={styles.subLabel}>This will be used for your personalized experience.</Text>
            </View>
          )}

          {/* ─── Step 2: Age & Sex ─────────────────────────────────────── */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.label}>Age & Sex</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  placeholderTextColor={Colors.textMuted}
                  value={formData.age}
                  onChangeText={(t) => setFormData({ ...formData, age: t.replace(/[^0-9]/g, '') })}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.sexContainer}>
                <Pressable 
                  style={[
                    styles.sexBtn, 
                    formData.sex === 'male' && { backgroundColor: `${Colors.accent}20`, borderColor: Colors.accent }
                  ]}
                  onPress={() => setFormData({ ...formData, sex: 'male' })}
                >
                  <Ionicons name="male" size={24} color={formData.sex === 'male' ? Colors.accent : Colors.textMuted} />
                  <Text style={[styles.sexText, formData.sex === 'male' && { color: Colors.accent }]}>Male</Text>
                </Pressable>
                <Pressable 
                  style={[
                    styles.sexBtn, 
                    formData.sex === 'female' && { backgroundColor: `${Colors.protein}20`, borderColor: Colors.protein }
                  ]}
                  onPress={() => setFormData({ ...formData, sex: 'female' })}
                >
                  <Ionicons name="female" size={24} color={formData.sex === 'female' ? Colors.protein : Colors.textMuted} />
                  <Text style={[styles.sexText, formData.sex === 'female' && { color: Colors.protein }]}>Female</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ─── Step 3: Height & Weight ───────────────────────────────── */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.label}>Height & Weight</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputPrefix}>H</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Height"
                  placeholderTextColor={Colors.textMuted}
                  value={formData.height_cm}
                  onChangeText={(t) => setFormData({ ...formData, height_cm: t.replace(/[^0-9.]/g, '') })}
                  keyboardType="decimal-pad"
                />
                <Pressable 
                  style={styles.inlineUnitToggle}
                  onPress={() => setFormData(prev => ({ ...prev, heightUnit: prev.heightUnit === 'cm' ? 'in' : 'cm' }))}
                >
                  <Text style={styles.inlineUnitText}>{formData.heightUnit}</Text>
                  <Ionicons name="swap-vertical" size={12} color={Colors.primary} />
                </Pressable>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputPrefix}>W</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Weight"
                  placeholderTextColor={Colors.textMuted}
                  value={formData.weight_kg}
                  onChangeText={(t) => setFormData({ ...formData, weight_kg: t.replace(/[^0-9.]/g, '') })}
                  keyboardType="decimal-pad"
                />
                <Pressable 
                  style={styles.inlineUnitToggle}
                  onPress={() => setFormData(prev => ({ ...prev, weightUnit: prev.weightUnit === 'kg' ? 'lbs' : 'kg' }))}
                >
                  <Text style={styles.inlineUnitText}>{formData.weightUnit}</Text>
                  <Ionicons name="swap-vertical" size={12} color={Colors.primary} />
                </Pressable>
              </View>
            </View>
          )}

          {/* ─── Step 4: Goal ─────────────────────────────────────────── */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.label}>What is your goal?</Text>
              {(['lose', 'maintain', 'gain'] as const).map((g) => (
                <Pressable 
                  key={g}
                  style={[styles.goalBtn, formData.goal === g && styles.goalBtnActive]}
                  onPress={() => setFormData({ ...formData, goal: g })}
                >
                  <Ionicons 
                    name={g === 'lose' ? 'trending-down' : g === 'gain' ? 'trending-up' : 'remove'} 
                    size={20} 
                    color={formData.goal === g ? Colors.primary : Colors.textMuted} 
                  />
                  <Text style={[styles.goalText, formData.goal === g && styles.goalTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)} Weight
                  </Text>
                  {formData.goal === g && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                </Pressable>
              ))}
            </View>
          )}

          {/* ─── Step 5: Health Conditions ────────────────────────────── */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.label}>Any health conditions?</Text>
              <Text style={styles.subLabel}>This helps Coach Hoo give safer dietary advice.</Text>
              {(['none', 'diabetes', 'hypertension', 'kidney_disease', 'others'] as const).map((h) => (
                <Pressable 
                  key={h}
                  style={[styles.goalBtn, formData.health_condition === h && styles.goalBtnActive]}
                  onPress={() => setFormData({ ...formData, health_condition: h })}
                >
                  <Ionicons 
                    name={h === 'none' ? 'heart-outline' : 'medical-outline'} 
                    size={20} 
                    color={formData.health_condition === h ? Colors.primary : Colors.textMuted} 
                  />
                  <Text style={[styles.goalText, formData.health_condition === h && styles.goalTextActive]}>
                    {h === 'others' ? 'Other condition' : h.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                  {formData.health_condition === h && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                </Pressable>
              ))}

              {/* Custom condition text input — revealed when "Other condition" selected */}
              {formData.health_condition === 'others' && (
                <View style={styles.customConditionWrapper}>
                  <Ionicons name="create-outline" size={18} color={Colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.customConditionInput}
                    placeholder="Describe your condition (e.g. Gout, PCOS)"
                    placeholderTextColor={Colors.textMuted}
                    value={formData.health_condition_custom}
                    onChangeText={(t) => setFormData({ ...formData, health_condition_custom: t })}
                    multiline
                  />
                </View>
              )}
            </View>
          )}

          {/* ─── Step 6: Allergies ────────────────────────────────────── */}
          {step === 6 && (
            <View style={styles.stepContainer}>
              <Text style={styles.label}>Any food allergies?</Text>
              <Text style={styles.subLabel}>Coach Hoo will filter out allergens from meal suggestions.</Text>

              {/* None button */}
              <Pressable
                style={[styles.goalBtn, formData.allergies.length === 0 && styles.goalBtnActive]}
                onPress={() => setFormData(prev => ({ ...prev, allergies: [], custom_allergy: '' }))}
              >
                <Ionicons name="checkmark-done-outline" size={20} color={formData.allergies.length === 0 ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.goalText, formData.allergies.length === 0 && styles.goalTextActive]}>
                  None — I have no food allergies
                </Text>
                {formData.allergies.length === 0 && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
              </Pressable>

              {/* Allergen chips grid */}
              <View style={styles.allergenGrid}>
                {ALLERGEN_OPTIONS.map((a) => {
                  const selected = formData.allergies.includes(a.key);
                  return (
                    <Pressable
                      key={a.key}
                      style={[styles.allergenChip, selected && styles.allergenChipActive]}
                      onPress={() => toggleAllergen(a.key)}
                    >
                      <Text style={styles.allergenEmoji}>{a.icon}</Text>
                      <Text style={[styles.allergenLabel, selected && styles.allergenLabelActive]}>{a.label}</Text>
                      {selected && <Ionicons name="close-circle" size={14} color={Colors.primary} style={{ marginLeft: 2 }} />}
                    </Pressable>
                  );
                })}
              </View>

              {/* Custom allergen free-text */}
              <Text style={styles.subLabel}>Don't see yours? Add it below:</Text>
              <View style={styles.customAllergyRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Ionicons name="add-circle-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Sesame, Latex"
                    placeholderTextColor={Colors.textMuted}
                    value={formData.custom_allergy}
                    onChangeText={(t) => setFormData(prev => ({ ...prev, custom_allergy: t }))}
                    onSubmitEditing={addCustomAllergy}
                    returnKeyType="done"
                  />
                </View>
                <Pressable style={styles.addAllergyBtn} onPress={addCustomAllergy}>
                  <Text style={styles.addAllergyBtnText}>Add</Text>
                </Pressable>
              </View>

              {/* Show custom-added allergies */}
              {formData.allergies.filter(a => !ALLERGEN_OPTIONS.find(o => o.key === a)).length > 0 && (
                <View style={styles.customTagsRow}>
                  {formData.allergies.filter(a => !ALLERGEN_OPTIONS.find(o => o.key === a)).map(tag => (
                    <Pressable key={tag} style={styles.customTag} onPress={() => toggleAllergen(tag)}>
                      <Text style={styles.customTagText}>{tag}</Text>
                      <Ionicons name="close" size={12} color={Colors.primary} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </Animated.View>

        {/* Navigation */}
        <View style={styles.footer}>
          {step > 1 && (
            <Pressable style={styles.backBtn} onPress={prevStep}>
              <Text style={styles.backBtnText}>Back</Text>
            </Pressable>
          )}
          <Pressable style={styles.nextBtn} onPress={nextStep}>
            <Text style={styles.nextBtnText}>{step === TOTAL_STEPS ? "Let's Go!" : "Continue"}</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.textInverse} style={{ marginLeft: 8 }} />
          </Pressable>
        </View>


      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, padding: Spacing.xl, paddingTop: Spacing.xxl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.md },
  mascotWrapper: {
    width: 240,
    height: 200,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -10,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  mascot: { width: 240, height: 240 },
  welcomeText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  progressContainer: { flexDirection: 'row', gap: 8, marginTop: Spacing.lg },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.bgElevated },
  progressDotActive: { backgroundColor: Colors.primary },
  progressDotCurrent: { width: 24 },
  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  stepContainer: { gap: Spacing.lg },
  label: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  subLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: -Spacing.sm },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgInput, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 56 },
  inputIcon: { marginRight: 12 },
  inputPrefix: { color: Colors.primary, fontWeight: FontWeight.bold, marginRight: 12, fontSize: FontSize.lg },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  row: { flexDirection: 'row' },
  inlineUnitToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryGlow, paddingHorizontal: 6, paddingVertical: 4, borderRadius: Radius.sm, gap: 2, marginLeft: 4 },
  inlineUnitText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary, textTransform: 'uppercase' },
  sexContainer: { flexDirection: 'row', gap: Spacing.md },
  sexBtn: { flex: 1, height: 80, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: Colors.bgInput },
  sexText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textMuted },
  goalBtn: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgInput, gap: Spacing.md },
  goalBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  goalText: { flex: 1, fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  goalTextActive: { color: Colors.textPrimary, fontWeight: FontWeight.bold },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: Spacing.md, gap: Spacing.md },
  backBtn: { height: 56, justifyContent: 'center', paddingHorizontal: Spacing.lg },
  backBtnText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  nextBtn: { height: 56, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.bold },

  // Step 5 — custom condition
  customConditionWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 56,
  },
  customConditionInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingTop: 2,
  },

  // Step 6 — allergens
  allergenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
    gap: 4,
  },
  allergenChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  allergenEmoji: { fontSize: 16 },
  allergenLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  allergenLabelActive: { color: Colors.textPrimary, fontWeight: FontWeight.bold },
  customAllergyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  addAllergyBtn: {
    height: 56,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAllergyBtnText: { color: Colors.textInverse, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  customTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  customTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  customTagText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
});
