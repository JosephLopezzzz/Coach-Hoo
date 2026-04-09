import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

const ACTIVITY_LABELS: Record<number, string> = {
  1: 'Sedentary', 2: 'Lightly Active', 3: 'Moderately Active',
  4: 'Very Active', 5: 'Super Active',
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function MacroTarget({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.macroTarget, { borderColor: `${color}30` }]}>
      <Text style={[styles.macroValue, { color }]}>{Math.round(value)}</Text>
      <Text style={styles.macroUnit}>{label === 'Calories' ? 'kcal' : 'g'}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
        },
      },
    ]);
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Avatar / header */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {user.full_name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user.full_name ?? 'Coach Hoo User'}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={[styles.goalBadge, { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary }]}>
          <Text style={styles.goalBadgeText}>
            {user.goal === 'lose' ? '🔥 Lose Weight' : user.goal === 'gain' ? '💪 Gain Muscle' : '⚖️ Maintain'}
          </Text>
        </View>
      </View>

      {/* Daily targets */}
      {user.calories_target && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Targets</Text>
          <View style={styles.macroTargetsRow}>
            <MacroTarget label="Calories" value={user.calories_target} color={Colors.calories} />
            <MacroTarget label="Protein"  value={user.protein_target ?? 0}  color={Colors.protein} />
            <MacroTarget label="Carbs"    value={user.carbs_target   ?? 0}  color={Colors.carbs} />
            <MacroTarget label="Fat"      value={user.fat_target     ?? 0}  color={Colors.fat} />
          </View>
        </View>
      )}

      {/* Body stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Body Stats</Text>
        <StatRow label="Age"            value={user.age ? `${user.age} years` : '—'} />
        <StatRow label="Sex"            value={user.sex ? (user.sex === 'male' ? '♂ Male' : '♀ Female') : '—'} />
        <StatRow label="Height"         value={user.height_cm ? `${user.height_cm} cm` : '—'} />
        <StatRow label="Weight"         value={user.weight_kg ? `${user.weight_kg} kg` : '—'} />
        <StatRow label="Activity"       value={ACTIVITY_LABELS[user.activity_level ?? 2]} />
        <StatRow label="Country"        value={user.country ?? 'Philippines'} />
      </View>

      {/* BMI snapshot */}
      {user.height_cm && user.weight_kg && (
        <View style={styles.bmiCard}>
          {(() => {
            const bmi = user.weight_kg / ((user.height_cm / 100) ** 2);
            const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
            const col = bmi < 18.5 ? Colors.info : bmi < 25 ? Colors.success : Colors.warning;
            return (
              <>
                <Text style={styles.bmiLabel}>BMI</Text>
                <Text style={[styles.bmiValue, { color: col }]}>{bmi.toFixed(1)}</Text>
                <Text style={[styles.bmiCat, { color: col }]}>{cat}</Text>
              </>
            );
          })()}
        </View>
      )}

      {/* Logout */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
        {loggingOut
          ? <ActivityIndicator color={Colors.error} />
          : <>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text style={styles.logoutText}>Log Out</Text>
            </>}
      </Pressable>

      <Text style={styles.version}>Coach Hoo v1.0.0 · Built for 🇵🇭</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingTop: 56, gap: Spacing.md, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 3, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: FontSize.hero, fontWeight: FontWeight.bold, color: Colors.primary },
  userName:  { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  userEmail: { fontSize: FontSize.sm,  color: Colors.textMuted },
  goalBadge: {
    flexDirection: 'row', borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: Radius.full,
  },
  goalBadgeText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  macroTargetsRow: { flexDirection: 'row', gap: 8 },
  macroTarget: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1 },
  macroValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  macroUnit:  { fontSize: FontSize.xs, color: Colors.textMuted },
  macroLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  statLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  statValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  bmiCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', gap: 4,
  },
  bmiLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  bmiValue: { fontSize: FontSize.hero, fontWeight: FontWeight.extrabold },
  bmiCat:   { fontSize: FontSize.md,  fontWeight: FontWeight.semibold },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: Spacing.md, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: `${Colors.error}40`, backgroundColor: `${Colors.error}10`,
  },
  logoutText: { fontSize: FontSize.md, color: Colors.error, fontWeight: FontWeight.semibold },
  version:    { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
});
