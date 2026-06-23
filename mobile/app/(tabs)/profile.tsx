import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
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
  const { user, resetUser, updateUser } = useAuth();
  const [resetting, setResetting] = useState(false);

  const handleReset = () => {
    Alert.alert('Reset Progress', 'This will delete all your data and progress. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset Everything',
        style: 'destructive',
        onPress: async () => {
          setResetting(true);
          await resetUser();
        },
      },
    ]);
  };

  const handlePickImage = async () => {
    const launchPicker = async () => {
      try {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert('Permission Denied', 'Coach Hoo needs access to your photos to change your profile picture.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          await updateUser({ avatar_uri: result.assets[0].uri });
        }
      } catch (e) {
        console.error('Failed to pick image:', e);
        Alert.alert('Error', 'Failed to pick image from library.');
      }
    };

    if (user?.avatar_uri) {
      Alert.alert('Profile Picture', 'What would you like to do?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove Photo', style: 'destructive', onPress: async () => await updateUser({ avatar_uri: undefined }) },
        { text: 'Choose New Photo', onPress: launchPicker },
      ]);
    } else {
      launchPicker();
    }
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Avatar / header */}
      <View style={styles.avatarSection}>
        <Pressable style={styles.avatarWrapper} onPress={handlePickImage}>
          <View style={styles.avatarGlow} />
          {user.avatar_uri ? (
            <Image
              source={{ uri: user.avatar_uri }}
              style={[styles.avatarImage, { borderRadius: Radius.lg }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatarImage, { alignItems: 'center', justifyContent: 'center', borderRadius: Radius.lg, backgroundColor: Colors.bgElevated }]}>
               <Ionicons 
                 name="person" 
                 size={150} 
                 color={Colors.primary} 
               />
            </View>
          )}
          {/* Camera badge — always visible so user knows photo is changeable */}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={15} color="#fff" />
          </View>
        </Pressable>
        <Text style={styles.userName}>{user.full_name ?? 'Pip Health User'}</Text>
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
        <StatRow label="Age"      value={user.age ? `${user.age} years` : '—'} />
        <StatRow label="Sex"      value={user.sex ? (user.sex === 'male' ? '♂ Male' : '♀ Female') : '—'} />
        <StatRow label="Height"   value={user.height_cm ? `${user.height_cm} cm` : '—'} />
        <StatRow label="Weight"   value={user.weight_kg ? `${user.weight_kg} kg` : '—'} />
        <StatRow label="Activity" value={ACTIVITY_LABELS[user.activity_level ?? 2]} />
        <StatRow label="Country"  value={user.country ?? 'Philippines'} />
      </View>

      {/* Health Info card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Health Info</Text>

        {/* Condition */}
        <View style={styles.healthRow}>
          <Text style={styles.healthLabel}>Condition</Text>
          <View style={styles.conditionBadge}>
            <Ionicons name="medical-outline" size={14} color={Colors.warning} />
            <Text style={styles.conditionText}>
              {!user.health_condition || user.health_condition === 'none'
                ? 'None'
                : user.health_condition === 'others'
                  ? (user.health_condition_custom || 'Other condition')
                  : user.health_condition.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Text>
          </View>
        </View>

        {/* Allergies */}
        <View style={[styles.healthRow, { alignItems: 'flex-start', marginTop: 8 }]}>
          <Text style={styles.healthLabel}>Allergies</Text>
          {(!user.allergies || user.allergies.length === 0) ? (
            <Text style={styles.statValue}>None</Text>
          ) : (
            <View style={styles.allergyChipsWrap}>
              {user.allergies.map((a: string) => (
                <View key={a} style={styles.allergyChip}>
                  <Text style={styles.allergyChipText}>{a}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
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

      {/* Reset */}
      <Pressable style={styles.logoutBtn} onPress={handleReset} disabled={resetting}>
        {resetting
          ? <ActivityIndicator color={Colors.error} />
          : <>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={styles.logoutText}>Reset All Progress</Text>
            </>}
      </Pressable>


      <Text style={styles.version}>Pip Health v1.0.0 · Built for 🇵🇭</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingTop: 56, gap: Spacing.md, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  avatarWrapper: {
    width: 200, height: 200,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: 206, height: 206, borderRadius: Radius.lg + 3,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 3, borderColor: Colors.primary,
  },
  avatarImage: { width: 200, height: 200 },
  cameraBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(40,40,40,0.75)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bg,
  },
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

  // Health Info card
  healthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  healthLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  conditionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${Colors.warning}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: `${Colors.warning}40` },
  conditionText: { fontSize: FontSize.sm, color: Colors.warning, fontWeight: FontWeight.semibold },
  allergyChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1, justifyContent: 'flex-end' },
  allergyChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: `${Colors.protein}15`, borderWidth: 1, borderColor: `${Colors.protein}40` },
  allergyChipText: { fontSize: FontSize.xs, color: Colors.protein, fontWeight: FontWeight.semibold, textTransform: 'capitalize' },
});
