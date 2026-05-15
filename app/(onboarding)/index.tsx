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

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    sex: '' as 'male' | 'female' | '',
    height_cm: '',
    weight_kg: '',
    goal: 'maintain' as 'lose' | 'maintain' | 'gain',
    health_condition: 'none',
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

    if (step < 5) {
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

  const handleFinish = async () => {
    try {
      await completeOnboarding({
        ...formData,
        age: parseInt(formData.age),
        height_cm: parseFloat(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        sex: formData.sex as 'male' | 'female',
      });
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header / Mascot */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/mascot-icon.png')} 
            style={styles.mascot}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>
            {step === 1 ? "Let's get started!" : 
             step === 2 ? "Tell us about yourself" : 
             step === 3 ? "Your measurements" : 
             step === 4 ? "What is your goal?" :
             "Health check"}
          </Text>
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4, 5].map((s) => (
              <View 
                key={s} 
                style={[styles.progressDot, s <= step && styles.progressDotActive, s === step && styles.progressDotCurrent]} 
              />
            ))}
          </View>
        </View>

        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.label}>What should we call you?</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.textMuted}
                  value={formData.full_name}
                  onChangeText={(t) => setFormData({ ...formData, full_name: t })}
                  autoFocus
                />
              </View>
              <Text style={styles.subLabel}>This will be used for your personalized experience.</Text>
            </View>
          )}

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
                    formData.sex === 'male' && { backgroundColor: '#4DA6FF20', borderColor: '#4DA6FF' }
                  ]}
                  onPress={() => setFormData({ ...formData, sex: 'male' })}
                >
                  <Ionicons name="male" size={24} color={formData.sex === 'male' ? '#4DA6FF' : Colors.textMuted} />
                  <Text style={[styles.sexText, formData.sex === 'male' && { color: '#4DA6FF' }]}>Male</Text>
                </Pressable>
                <Pressable 
                  style={[
                    styles.sexBtn, 
                    formData.sex === 'female' && { backgroundColor: '#FF6B9D20', borderColor: '#FF6B9D' }
                  ]}
                  onPress={() => setFormData({ ...formData, sex: 'female' })}
                >
                  <Ionicons name="female" size={24} color={formData.sex === 'female' ? '#FF6B9D' : Colors.textMuted} />
                  <Text style={[styles.sexText, formData.sex === 'female' && { color: '#FF6B9D' }]}>Female</Text>
                </Pressable>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.label}>Height & Weight</Text>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputPrefix}>H</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Height (cm)"
                    placeholderTextColor={Colors.textMuted}
                    value={formData.height_cm}
                    onChangeText={(t) => setFormData({ ...formData, height_cm: t.replace(/[^0-9.]/g, '') })}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.md }]}>
                  <Text style={styles.inputPrefix}>W</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Weight (kg)"
                    placeholderTextColor={Colors.textMuted}
                    value={formData.weight_kg}
                    onChangeText={(t) => setFormData({ ...formData, weight_kg: t.replace(/[^0-9.]/g, '') })}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          )}

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

          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.label}>Any health conditions?</Text>
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
                    {h.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                  {formData.health_condition === h && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                </Pressable>
              ))}
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
            <Text style={styles.nextBtnText}>{step === 5 ? "Let's Go!" : "Continue"}</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.textInverse} style={{ marginLeft: 8 }} />
          </Pressable>
        </View>


      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, padding: Spacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  mascot: { width: 120, height: 120, marginBottom: Spacing.md },
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
  sexContainer: { flexDirection: 'row', gap: Spacing.md },
  sexBtn: { flex: 1, height: 80, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: Colors.bgInput },
  sexText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textMuted },
  goalBtn: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgInput, gap: Spacing.md },
  goalBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  goalText: { flex: 1, fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  goalTextActive: { color: Colors.textPrimary, fontWeight: FontWeight.bold },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: Spacing.xl, gap: Spacing.md },
  backBtn: { height: 56, justifyContent: 'center', paddingHorizontal: Spacing.lg },
  backBtnText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  nextBtn: { height: 56, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
