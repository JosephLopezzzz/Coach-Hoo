import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  BackHandler,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import CoachBubble from './CoachBubble';
import SearchableSelectList from './SearchableSelectList';
import {
  getWelcomeMessage,
  getAgeMessage,
  getHeightWeightMessage,
  getFeedbackMessage,
  getGoalMessage,
  getGoalLabel,
  getHealthConditionMessage,
  getHealthConditionNoResponse,
  getHealthConditionWhichMessage,
  getHealthConditionSafetyNotice,
  getAllergiesMessage,
  getAllergiesNoResponse,
  getAllergiesSelectMessage,
  getAllergySafetyNotice,
  getFinishMessage,
  getSuggestedGoal,
  getNamePlaceholder,
  getAgePlaceholder,
  getNoLabel,
  getYesLabel,
  getSkipLabel,
  getContinueLabel,
  getGoToDashboardLabel,
  getConfirmLabel,
  ONBOARDING_PROGRESS_KEY,
  LANGUAGE_KEY,
  convertHeight,
  convertWeight,
  validateAge,
  validateHeight,
  validateWeight,
} from '../services/coachMessageService';
import {
  getHealthConditionGroups,
  getAllergenGroups,
  getMetaOptions,
} from '../constants/i18n';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

const STEPS = [
  'language',
  'welcome',
  'age',
  'height_weight',
  'feedback',
  'goal',
  'health',
  'allergies',
  'finish',
] as const;

interface FormData {
  name: string;
  age: string;
  heightValue: string;
  weightValue: string;
  heightUnit: 'cm' | 'in';
  weightUnit: 'kg' | 'lbs';
  goal: string;
  healthAnswer: '' | 'no' | 'yes' | 'skip';
  healthConditions: string[];
  healthConditionOther: string;
  allergiesAnswer: '' | 'no' | 'yes' | 'skip';
  allergies: string[];
  allergyOther: string;
  intolerances: string;
}

const emptyForm: FormData = {
  name: '',
  age: '',
  heightValue: '',
  weightValue: '',
  heightUnit: 'cm',
  weightUnit: 'kg',
  goal: '',
  healthAnswer: '',
  healthConditions: [],
  healthConditionOther: '',
  allergiesAnswer: '',
  allergies: [],
  allergyOther: '',
  intolerances: '',
};

export default function CoachOnboarding() {
  const { completeOnboarding } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [typingDone, setTypingDone] = useState(true);
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const healthGroups = useMemo(() => getHealthConditionGroups(lang), [lang]);
  const allergenGroups = useMemo(() => getAllergenGroups(lang), [lang]);
  const metaOptions = useMemo(() => getMetaOptions(lang), [lang]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(ONBOARDING_PROGRESS_KEY);
        const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLang === 'filipino' || savedLang === 'english') setLang(savedLang);
        if (saved) {
          const parsed = JSON.parse(saved);
          setStep(parsed.step ?? 0);
          setForm({ ...emptyForm, ...parsed.form });
        }
      } catch {}
    })();
  }, []);

  const saveProgress = useCallback(
    async (s: number, f: FormData) => {
      try {
        await AsyncStorage.setItem(
          ONBOARDING_PROGRESS_KEY,
          JSON.stringify({ step: s, form: f }),
        );
      } catch {}
    },
    [],
  );

  const updateForm = useCallback(
    (patch: Partial<FormData>) => {
      setForm((prev) => {
        const next = { ...prev, ...patch };
        saveProgress(step, next);
        return next;
      });
    },
    [step, saveProgress],
  );

  const goToStep = useCallback(
    (next: number) => {
      setTypingDone(false);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setStep(next);
        saveProgress(next, form);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    },
    [form, saveProgress],
  );

  const validateCurrent = (): boolean => {
    const s = STEPS[step];
    if (s === 'welcome' && !form.name.trim()) {
      Alert.alert('', t('validation.name'));
      return false;
    }
    if (s === 'age') {
      const age = parseInt(form.age, 10);
      if (!form.age || !validateAge(age)) {
        Alert.alert('', t('validation.age'));
        return false;
      }
    }
    if (s === 'height_weight') {
      const h = parseFloat(form.heightValue);
      const w = parseFloat(form.weightValue);
      if (!form.heightValue || !validateHeight(convertHeight(h, form.heightUnit))) {
        Alert.alert('', t('validation.height'));
        return false;
      }
      if (!form.weightValue || !validateWeight(convertWeight(w, form.weightUnit))) {
        Alert.alert('', t('validation.weight'));
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!typingDone && step < STEPS.length - 1) return;
    if (!validateCurrent()) return;
    if (step < STEPS.length - 1) {
      goToStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    if (saving) return;
    setSaving(true);
    const heightCm = convertHeight(parseFloat(form.heightValue) || 0, form.heightUnit);
    const weightKg = convertWeight(parseFloat(form.weightValue) || 0, form.weightUnit);
    const age = parseInt(form.age, 10) || undefined;

    const hasHealth = form.healthAnswer === 'yes' && form.healthConditions.length > 0 && !form.healthConditions.includes('none') && !form.healthConditions.includes('prefer_not_say');
    const healthConditions = hasHealth ? form.healthConditions : form.healthAnswer === 'skip' ? undefined : [];
    const hasAllergies = form.allergiesAnswer === 'yes' && form.allergies.length > 0 && !form.allergies.includes('none') && !form.allergies.includes('prefer_not_say');
    const allergyItems = hasAllergies ? form.allergies : form.allergiesAnswer === 'skip' ? undefined : [];

    await completeOnboarding({
      full_name: form.name.trim(),
      age,
      height_cm: heightCm > 0 ? heightCm : undefined,
      weight_kg: weightKg > 0 ? weightKg : undefined,
      goal: form.goal === 'build_habits' ? 'maintain' : (form.goal as any) || 'maintain',
      health_condition: healthConditions ? healthConditions.join(',') : healthConditions,
      health_condition_custom: hasHealth && form.healthConditionOther ? form.healthConditionOther : undefined,
      allergies: allergyItems,
      allergy_other: hasAllergies && form.allergyOther ? form.allergyOther : undefined,
      intolerances: form.intolerances || undefined,
    });

    try {
      await AsyncStorage.removeItem(ONBOARDING_PROGRESS_KEY);
    } catch {}
    router.replace('/(tabs)');
  };

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  useEffect(() => {
    const onBack = () => {
      if (step <= 0) return false;
      if (currentStep === 'language') return false;
      goToStep(step - 1);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [step, currentStep]);

  const suggestedGoal =
    form.heightValue && form.weightValue
      ? getSuggestedGoal(
          convertHeight(parseFloat(form.heightValue) || 0, form.heightUnit),
          convertWeight(parseFloat(form.weightValue) || 0, form.weightUnit),
        )
      : null;

  const goalKeys = ['lose', 'maintain', 'gain', 'build_habits'] as const;

  const handleExitSetup = () => {
    Alert.alert(
      t('onboarding.exitTitle'),
      t('onboarding.exitBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.exit'), style: 'destructive', onPress: () => BackHandler.exitApp() },
      ],
    );
  };

  const visibleSteps = STEPS.filter((s) => s !== 'feedback');
  const dotIndex = visibleSteps.indexOf(currentStep as typeof visibleSteps[number]);
  const showBack = step > 0 && currentStep !== 'feedback';
  const isFirstStep = currentStep === 'language';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        {isFirstStep ? (
          <Pressable onPress={handleExitSetup} style={styles.backBtn} accessibilityLabel={t('onboarding.exitSetup')}>
            <Text style={styles.backText}>{t('common.exit')}</Text>
          </Pressable>
        ) : showBack ? (
          <Pressable onPress={() => goToStep(step - 1)} style={styles.backBtn} accessibilityLabel={t('common.back')}>
            <Text style={styles.backText}>{`← ${t('common.back')}`}</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        {currentStep !== 'language' && currentStep !== 'feedback' && (
          <View style={styles.dotsRow}>
            {visibleSteps.map((_, i) => (
              <View key={i} style={[styles.dot, i <= dotIndex && styles.dotActive]} />
            ))}
          </View>
        )}
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ── Language selection ── */}
          {currentStep === 'language' && (
            <View style={styles.langScreen}>
              <Text style={styles.langTitle}>{t('onboarding.selectLanguage')}</Text>
              <Pressable
                style={[styles.langCard, lang === 'english' && styles.langCardActive]}
                onPress={async () => {
                  await setLang('english');
                  goToStep(step + 1);
                }}
              >
                <Text style={[styles.langCardText, lang === 'english' && styles.langCardTextActive]}>English</Text>
              </Pressable>
              <Pressable
                style={[styles.langCard, lang === 'filipino' && styles.langCardActive]}
                onPress={async () => {
                  await setLang('filipino');
                  goToStep(step + 1);
                }}
              >
                <Text style={[styles.langCardText, lang === 'filipino' && styles.langCardTextActive]}>Filipino</Text>
              </Pressable>
            </View>
          )}

          {/* ── Welcome ── */}
          {currentStep === 'welcome' && (
            <StepContent
              coachMessage={getWelcomeMessage(lang)}
              typingDone={typingDone}
              onTypeDone={() => setTypingDone(true)}
              stepKey="welcome"
            >
              <TextInput
                style={styles.input}
                placeholder={getNamePlaceholder(lang)}
                placeholderTextColor={Colors.textMuted}
                value={form.name}
                onChangeText={(v) => updateForm({ name: v })}
                autoFocus
              />
              <Pressable style={styles.primaryBtn} onPress={handleNext}>
                <Text style={styles.primaryBtnText}>{getConfirmLabel(lang)}</Text>
              </Pressable>
            </StepContent>
          )}

          {/* ── Age ── */}
          {currentStep === 'age' && (
            <StepContent
              coachMessage={getAgeMessage(lang, form.name || t('coach.friend'))}
              typingDone={typingDone}
              onTypeDone={() => setTypingDone(true)}
              stepKey="age"
            >
              <TextInput
                style={styles.input}
                placeholder={getAgePlaceholder(lang)}
                placeholderTextColor={Colors.textMuted}
                value={form.age}
                onChangeText={(v) => updateForm({ age: v.replace(/[^0-9]/g, '') })}
                keyboardType="number-pad"
                autoFocus
                maxLength={3}
              />
              <Pressable style={styles.primaryBtn} onPress={handleNext}>
                <Text style={styles.primaryBtnText}>{getConfirmLabel(lang)}</Text>
              </Pressable>
            </StepContent>
          )}

          {/* ── Height & Weight ── */}
          {currentStep === 'height_weight' && (
            <StepContent
              coachMessage={getHeightWeightMessage(lang)}
              typingDone={typingDone}
              onTypeDone={() => setTypingDone(true)}
              stepKey="height_weight"
            >
              <View style={styles.dualRow}>
                <View style={styles.dualField}>
                  <Text style={styles.fieldLabel}>{t('onboarding.height')}</Text>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      placeholder={`e.g. ${form.heightUnit === 'cm' ? '175' : "5'9\""}`}
                      placeholderTextColor={Colors.textMuted}
                      value={form.heightValue}
                      onChangeText={(v) => updateForm({ heightValue: v.replace(/[^0-9.]/g, '') })}
                      keyboardType="decimal-pad"
                    />
                    <UnitToggle
                      options={['cm', 'in'] as const}
                      selected={form.heightUnit}
                      onSelect={(v) => updateForm({ heightUnit: v })}
                    />
                  </View>
                </View>
                <View style={styles.dualField}>
                  <Text style={styles.fieldLabel}>{t('onboarding.weight')}</Text>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      placeholder={`e.g. ${form.weightUnit === 'kg' ? '70' : '154'}`}
                      placeholderTextColor={Colors.textMuted}
                      value={form.weightValue}
                      onChangeText={(v) => updateForm({ weightValue: v.replace(/[^0-9.]/g, '') })}
                      keyboardType="decimal-pad"
                    />
                    <UnitToggle
                      options={['kg', 'lbs'] as const}
                      selected={form.weightUnit}
                      onSelect={(v) => updateForm({ weightUnit: v })}
                    />
                  </View>
                </View>
              </View>
              <Pressable style={styles.primaryBtn} onPress={handleNext}>
                <Text style={styles.primaryBtnText}>{getContinueLabel(lang)}</Text>
              </Pressable>
            </StepContent>
          )}

          {/* ── Feedback ── */}
          {currentStep === 'feedback' && (
            <StepContent
              coachMessage={getFeedbackMessage(lang, form.name || t('coach.friend'))}
              typingDone={typingDone}
              onTypeDone={() => setTypingDone(true)}
              stepKey="feedback"
            >
              {typingDone && (
                <Pressable style={styles.primaryBtn} onPress={() => goToStep(step + 1)}>
                  <Text style={styles.primaryBtnText}>{getContinueLabel(lang)}</Text>
                </Pressable>
              )}
            </StepContent>
          )}

          {/* ── Goal ── */}
          {currentStep === 'goal' && (
            <StepContent
              coachMessage={getGoalMessage(
                lang,
                suggestedGoal ? getGoalLabel(lang, suggestedGoal) : undefined,
              )}
              typingDone={typingDone}
              onTypeDone={() => setTypingDone(true)}
              stepKey="goal"
            >
              <View style={styles.chipGroup}>
                {goalKeys.map((g) => (
                  <Pressable
                    key={g}
                    style={[styles.chip, form.goal === g && styles.chipActive]}
                    onPress={() => updateForm({ goal: g })}
                  >
                    <Text style={[styles.chipText, form.goal === g && styles.chipTextActive]}>
                      {getGoalLabel(lang, g)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {form.goal && (
                <Pressable style={styles.primaryBtn} onPress={() => goToStep(step + 1)}>
                  <Text style={styles.primaryBtnText}>{getConfirmLabel(lang)}</Text>
                </Pressable>
              )}
            </StepContent>
          )}

          {/* ── Health condition ── */}
          {currentStep === 'health' && (
            <StepContent
              coachMessage={
                form.healthAnswer === 'no' || form.healthAnswer === 'skip'
                  ? getHealthConditionNoResponse(lang)
                  : form.healthAnswer === 'yes'
                    ? getHealthConditionWhichMessage(lang)
                    : getHealthConditionMessage(lang)
              }
              typingDone={typingDone}
              onTypeDone={() => setTypingDone(true)}
              stepKey="health"
            >
              {/* Main answer chips — always shown once typing is done */}
              {typingDone && (
                <View style={styles.chipRow}>
                  {(['no', 'yes', 'skip'] as const).map((a) => (
                    <Pressable
                      key={a}
                      style={[styles.chip, form.healthAnswer === a && styles.chipActive]}
                      onPress={() => {
                        const wasYes = form.healthAnswer === 'yes';
                        const isYes = a === 'yes';
                        const patch: Partial<FormData> = { healthAnswer: a };
                        if (wasYes && !isYes) {
                          patch.healthConditions = [];
                          patch.healthConditionOther = '';
                        }
                        updateForm(patch);
                        setTypingDone(false);
                      }}
                      accessibilityLabel={a === 'no' ? getNoLabel(lang) : a === 'yes' ? getYesLabel(lang) : getSkipLabel(lang)}
                    >
                      <Text style={[styles.chipText, form.healthAnswer === a && styles.chipTextActive]}>
                        {a === 'no' ? getNoLabel(lang) : a === 'yes' ? getYesLabel(lang) : getSkipLabel(lang)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Condition searchable multi-select */}
              {form.healthAnswer === 'yes' && typingDone && (
                <>
                  <SearchableSelectList
                    groups={healthGroups}
                    metaOptions={metaOptions}
                    selectedKeys={form.healthConditions}
                    onSelectionChange={(keys) => updateForm({ healthConditions: keys })}
                    otherKey="other"
                    otherValue={form.healthConditionOther}
                    onOtherChange={(text) => updateForm({ healthConditionOther: text })}
                    noneKey="none"
                    preferNotKey="prefer_not_say"
                    searchPlaceholder={t('onboarding.searchConditions')}
                    safetyMessage={getHealthConditionSafetyNotice(lang)}
                  />
                  {form.healthConditions.length > 0 && (
                    <Pressable style={styles.primaryBtn} onPress={() => goToStep(step + 1)} accessibilityLabel={getConfirmLabel(lang)}>
                      <Text style={styles.primaryBtnText}>{getConfirmLabel(lang)}</Text>
                    </Pressable>
                  )}
                </>
              )}

              {/* No / Skip response — continue */}
              {(form.healthAnswer === 'no' || form.healthAnswer === 'skip') && typingDone && (
                <Pressable style={styles.primaryBtn} onPress={() => goToStep(step + 1)} accessibilityLabel={getContinueLabel(lang)}>
                  <Text style={styles.primaryBtnText}>{getContinueLabel(lang)}</Text>
                </Pressable>
              )}
            </StepContent>
          )}

          {/* ── Allergies ── */}
          {currentStep === 'allergies' && (
            <StepContent
              coachMessage={
                form.allergiesAnswer === 'no' || form.allergiesAnswer === 'skip'
                  ? getAllergiesNoResponse(lang)
                  : form.allergiesAnswer === 'yes'
                    ? getAllergiesSelectMessage(lang)
                    : getAllergiesMessage(lang)
              }
              typingDone={typingDone}
              onTypeDone={() => setTypingDone(true)}
              stepKey="allergies"
            >
              {/* Main answer chips — always shown once typing is done */}
              {typingDone && (
                <View style={styles.chipRow}>
                  {(['no', 'yes', 'skip'] as const).map((a) => (
                    <Pressable
                      key={a}
                      style={[styles.chip, form.allergiesAnswer === a && styles.chipActive]}
                      onPress={() => {
                        const wasYes = form.allergiesAnswer === 'yes';
                        const isYes = a === 'yes';
                        const patch: Partial<FormData> = { allergiesAnswer: a };
                        if (wasYes && !isYes) {
                          patch.allergies = [];
                          patch.allergyOther = '';
                        }
                        updateForm(patch);
                        setTypingDone(false);
                      }}
                      accessibilityLabel={a === 'no' ? getNoLabel(lang) : a === 'yes' ? getYesLabel(lang) : getSkipLabel(lang)}
                    >
                      <Text style={[styles.chipText, form.allergiesAnswer === a && styles.chipTextActive]}>
                        {a === 'no' ? getNoLabel(lang) : a === 'yes' ? getYesLabel(lang) : getSkipLabel(lang)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Allergen searchable multi-select + intolerances + confirm */}
              {form.allergiesAnswer === 'yes' && typingDone && (
                <>
                  <SearchableSelectList
                    groups={allergenGroups}
                    metaOptions={metaOptions}
                    selectedKeys={form.allergies}
                    onSelectionChange={(keys) => updateForm({ allergies: keys })}
                    otherKey="other"
                    otherValue={form.allergyOther}
                    onOtherChange={(text) => updateForm({ allergyOther: text })}
                    noneKey="none"
                    preferNotKey="prefer_not_say"
                    searchPlaceholder={t('onboarding.searchAllergens')}
                    safetyMessage={getAllergySafetyNotice(lang)}
                  />
                  <View style={styles.sectionSpacer} />
                  <Text style={styles.sectionTitle}>{t('onboarding.intolerancesTitle')}</Text>
                  <Text style={styles.sectionHint}>{t('onboarding.intolerancesHint')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('onboarding.intolerancesPlaceholder')}
                    placeholderTextColor={Colors.textMuted}
                    value={form.intolerances}
                    onChangeText={(v) => updateForm({ intolerances: v })}
                    multiline
                    numberOfLines={2}
                    accessibilityLabel={t('onboarding.intolerancesTitle')}
                  />
                  {form.allergies.length > 0 && (
                    <Pressable style={styles.primaryBtn} onPress={() => goToStep(step + 1)} accessibilityLabel={getConfirmLabel(lang)}>
                      <Text style={styles.primaryBtnText}>{getConfirmLabel(lang)}</Text>
                    </Pressable>
                  )}
                </>
              )}

              {/* No / Skip response — continue */}
              {(form.allergiesAnswer === 'no' || form.allergiesAnswer === 'skip') && typingDone && (
                <Pressable style={styles.primaryBtn} onPress={() => goToStep(step + 1)} accessibilityLabel={getContinueLabel(lang)}>
                  <Text style={styles.primaryBtnText}>{getContinueLabel(lang)}</Text>
                </Pressable>
              )}
            </StepContent>
          )}

          {/* ── Finish ── */}
          {currentStep === 'finish' && (
            <StepContent
              coachMessage={getFinishMessage(lang, form.name || t('coach.friend'))}
              typingDone={typingDone}
              onTypeDone={() => setTypingDone(true)}
              stepKey="finish"
            >
              {typingDone && (
                <>
                  <View style={styles.finishMascotWrap}>
                    <Image
                      source={require('../assets/mascot/idle.gif')}
                      style={styles.finishMascot}
                      contentFit="contain"
                    />
                  </View>
                  <Pressable style={styles.primaryBtn} onPress={finishOnboarding}>
                    <Text style={styles.primaryBtnText}>{getGoToDashboardLabel(lang)}</Text>
                  </Pressable>
                </>
              )}
            </StepContent>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function UnitToggle<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: readonly T[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.unitToggle}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          style={[styles.unitOption, selected === opt && styles.unitOptionActive]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.unitText, selected === opt && styles.unitTextActive]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function StepContent({
  coachMessage,
  typingDone,
  onTypeDone,
  stepKey,
  children,
}: {
  coachMessage: string;
  typingDone: boolean;
  onTypeDone: () => void;
  stepKey: string;
  children: React.ReactNode;
}) {
  return (
    <View key={stepKey} style={styles.stepContent}>
      <CoachBubble
        message={coachMessage}
        typewriter
        typewriterSpeed={15}
        onTypeComplete={onTypeDone}
      />
      {typingDone && <View style={styles.inputArea}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  backBtn: { minWidth: 70, minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 20, borderRadius: 4 },

  scroll: {
    padding: Spacing.lg,
    paddingTop: 0,
    paddingBottom: 60,
    flexGrow: 1,
  },
  stepContent: { gap: Spacing.lg },

  inputArea: { gap: Spacing.md },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  inputFlex: { flex: 1 },

  dualRow: { flexDirection: 'row', gap: Spacing.sm },
  dualField: { flex: 1, gap: 6 },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  inputWithUnit: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  unitToggle: {
    flexDirection: 'row',
    borderRadius: Radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitOption: { paddingHorizontal: 10, paddingVertical: 10, backgroundColor: Colors.bgCard },
  unitOptionActive: { backgroundColor: Colors.primary },
  unitText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  unitTextActive: { color: Colors.textInverse },

  sectionSpacer: { height: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chipRow: { flexDirection: 'row', gap: Spacing.sm },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },

  primaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  primaryBtnText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },

  langScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: 80,
  },
  langTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  langCard: {
    width: '80%',
    paddingVertical: 18,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
  },
  langCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  langCardText: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  langCardTextActive: { color: Colors.primary },

  finishMascotWrap: { alignItems: 'center', marginVertical: Spacing.md },
  finishMascot: { width: 140, height: 140 },
});
