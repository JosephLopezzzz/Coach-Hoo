import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

const STEPS = ['Account', 'Body', 'Goals', 'Country'] as const;

const GOALS = [
  { key: 'lose',     label: '🔥 Lose Weight',    desc: '−500 kcal/day' },
  { key: 'maintain', label: '⚖️ Maintain',         desc: 'At TDEE' },
  { key: 'gain',     label: '💪 Gain Muscle',     desc: '+500 kcal/day' },
];

const ACTIVITY = [
  { level: 1, label: 'Sedentary',    desc: 'Little/no exercise' },
  { level: 2, label: 'Light',        desc: '1–3 days/week' },
  { level: 3, label: 'Moderate',     desc: '3–5 days/week' },
  { level: 4, label: 'Very Active',  desc: '6–7 days/week' },
  { level: 5, label: 'Super Active', desc: 'Physical job + training' },
];

const COUNTRIES = ['Philippines', 'USA', 'Japan', 'South Korea', 'India', 'Other'];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Account
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Body
  const [age,      setAge]      = useState('');
  const [sex,      setSex]      = useState<'male' | 'female'>('male');
  const [height,   setHeight]   = useState('');
  const [weight,   setWeight]   = useState('');

  // Step 3: Goals
  const [goal,          setGoal]          = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [activityLevel, setActivityLevel] = useState(2);

  // Step 4: Country
  const [country, setCountry] = useState('Philippines');

  const nextStep = () => {
    if (step === 0) {
      if (!email || !password || !fullName) { Alert.alert('Fill in all account fields'); return; }
      if (password.length < 6) { Alert.alert('Password must be at least 6 characters'); return; }
    }
    if (step === 1) {
      if (!age || !height || !weight) { Alert.alert('Fill in all body measurements'); return; }
    }
    setStep((s) => s + 1);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        full_name:       fullName,
        age:             parseInt(age, 10),
        sex,
        height_cm:       parseFloat(height),
        weight_kg:       parseFloat(weight),
        goal,
        activity_level:  activityLevel,
        country,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Registration failed', err.response?.data?.error ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressSegment,
              { backgroundColor: i <= step ? Colors.primary : Colors.border },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <View style={styles.headerRow}>
          {step > 0 && (
            <Pressable onPress={() => setStep((s) => s - 1)} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </Pressable>
          )}
          <Text style={styles.stepLabel}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</Text>
        </View>

        {/* ── STEP 0: ACCOUNT ───────────────────────────────────────────── */}
        {step === 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>

            <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={Colors.textMuted}
              value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={Colors.textMuted}
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password (min 6 chars)" placeholderTextColor={Colors.textMuted}
              value={password} onChangeText={setPassword} secureTextEntry />

            <Pressable style={styles.primaryBtn} onPress={nextStep}>
              <Text style={styles.primaryBtnText}>Next →</Text>
            </Pressable>
          </View>
        )}

        {/* ── STEP 1: BODY STATS ────────────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Body Stats</Text>

            {/* Sex toggle */}
            <Text style={styles.fieldLabel}>Biological Sex</Text>
            <View style={styles.toggleRow}>
              {(['male', 'female'] as const).map((s) => (
                <Pressable
                  key={s}
                  style={[styles.toggle, sex === s && styles.toggleActive]}
                  onPress={() => setSex(s)}
                >
                  <Text style={[styles.toggleText, sex === s && styles.toggleTextActive]}>
                    {s === 'male' ? '♂ Male' : '♀ Female'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput style={styles.input} placeholder="e.g. 25" placeholderTextColor={Colors.textMuted}
              value={age} onChangeText={setAge} keyboardType="number-pad" />

            <Text style={styles.fieldLabel}>Height (cm)</Text>
            <TextInput style={styles.input} placeholder="e.g. 170" placeholderTextColor={Colors.textMuted}
              value={height} onChangeText={setHeight} keyboardType="decimal-pad" />

            <Text style={styles.fieldLabel}>Weight (kg)</Text>
            <TextInput style={styles.input} placeholder="e.g. 70" placeholderTextColor={Colors.textMuted}
              value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />

            <Pressable style={styles.primaryBtn} onPress={nextStep}>
              <Text style={styles.primaryBtnText}>Next →</Text>
            </Pressable>
          </View>
        )}

        {/* ── STEP 2: GOALS ─────────────────────────────────────────────── */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Goal</Text>

            {GOALS.map((g) => (
              <Pressable
                key={g.key}
                style={[styles.optionCard, goal === g.key && styles.optionCardActive]}
                onPress={() => setGoal(g.key as any)}
              >
                <Text style={styles.optionLabel}>{g.label}</Text>
                <Text style={styles.optionDesc}>{g.desc}</Text>
              </Pressable>
            ))}

            <Text style={[styles.cardTitle, { marginTop: Spacing.lg }]}>Activity Level</Text>
            {ACTIVITY.map((a) => (
              <Pressable
                key={a.level}
                style={[styles.optionCard, activityLevel === a.level && styles.optionCardActive]}
                onPress={() => setActivityLevel(a.level)}
              >
                <Text style={styles.optionLabel}>{a.label}</Text>
                <Text style={styles.optionDesc}>{a.desc}</Text>
              </Pressable>
            ))}

            <Pressable style={styles.primaryBtn} onPress={nextStep}>
              <Text style={styles.primaryBtnText}>Next →</Text>
            </Pressable>
          </View>
        )}

        {/* ── STEP 3: COUNTRY ───────────────────────────────────────────── */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Country</Text>
            <Text style={styles.cardSubtitle}>
              We'll recommend local foods and recipes 🍽️
            </Text>

            {COUNTRIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.optionCard, country === c && styles.optionCardActive]}
                onPress={() => setCountry(c)}
              >
                <Text style={styles.optionLabel}>
                  {c === 'Philippines' ? '🇵🇭' : c === 'USA' ? '🇺🇸' : c === 'Japan' ? '🇯🇵' : c === 'South Korea' ? '🇰🇷' : c === 'India' ? '🇮🇳' : '🌍'} {c}
                </Text>
              </Pressable>
            ))}

            <Pressable style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
              {loading
                ? <ActivityIndicator color={Colors.textInverse} />
                : <Text style={styles.primaryBtnText}>Create My Plan 🚀</Text>}
            </Pressable>
          </View>
        )}

        <Pressable style={styles.loginLink} onPress={() => router.back()}>
          <Text style={styles.loginLinkText}>Already have an account? Log in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: Spacing.md,
  },
  progressSegment: {
    flex: 1, height: 4, borderRadius: Radius.full,
  },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  stepLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: -8,
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
  toggleRow: { flexDirection: 'row', gap: Spacing.sm },
  toggle: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
  },
  toggleActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  toggleText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  toggleTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  optionCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  optionLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  optionDesc:  { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  primaryBtnText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  loginLink: { alignItems: 'center', paddingVertical: Spacing.md },
  loginLinkText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
