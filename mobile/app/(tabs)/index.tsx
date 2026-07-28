import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image,
  RefreshControl, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useMeals } from '../../context/MealContext';
import { useAuth } from '../../context/AuthContext';
import MealSection from '../../components/MealSection';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getMotivationalMessage(totals: { calories: number; protein: number; carbs: number; fat: number }, targets: { calories_target: number; protein_target: number; carbs_target: number; fat_target: number } | null) {
  if (!targets) return 'Start logging your meals to see your progress!';
  const calPct = targets.calories_target > 0 ? totals.calories / targets.calories_target : 0;
  if (calPct >= 1) return "You've hit your calorie target! Great work today!";
  if (calPct >= 0.75) return 'Almost there! Just a bit more to hit your goals.';
  if (calPct >= 0.5) return "You're making great progress! Keep it up!";
  return "Let's start fueling your body right! Every meal counts.";
}

function getProteinRemaining(totals: { protein: number }, targets: { protein_target: number } | null) {
  if (!targets) return null;
  return Math.round(Math.max(0, targets.protein_target - totals.protein));
}

function CalorieRing({
  consumed,
  target,
  size = 200,
}: {
  consumed: number;
  target: number;
  size?: number;
}) {
  const animVal = useRef(new Animated.Value(0)).current;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: pct,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  const strokeDashoffset = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="transparent"
          stroke={Colors.bgElevated}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          fill="transparent"
          stroke={Colors.calories}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringCals}>{Math.round(consumed)}</Text>
        <Text style={styles.ringLabel}>kcal</Text>
        <Text style={styles.ringPct}>{Math.round(pct * 100)}%</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { meals, totals, targets, remaining, isLoading, loadToday, deleteMeal } = useMeals();

  const caloriesTarget = targets?.calories_target ?? 2000;
  const proteinTarget  = targets?.protein_target ?? 150;
  const carbsTarget    = targets?.carbs_target ?? 200;
  const fatTarget      = targets?.fat_target ?? 65;

  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });

  const proteinRemaining = getProteinRemaining(totals, targets);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => loadToday()} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getGreeting()} 👋</Text>
          <Text style={styles.name}>{user?.full_name?.split(' ')[0] ?? 'there'}</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <Pressable style={styles.fab} onPress={() => router.push('/(tabs)/log')}>
          <Ionicons name="add" size={24} color={Colors.textInverse} />
        </Pressable>
      </View>

      {/* Calorie Ring */}
      <View style={styles.ringCard}>
        <CalorieRing consumed={totals.calories} target={caloriesTarget} />
        <Text style={styles.motivationalMsg}>
          {getMotivationalMessage(totals, targets)}
        </Text>
      </View>

      {/* Slim macro trio bars */}
      <View style={styles.macroTrio}>
        <View style={styles.slimMacroRow}>
          <View style={[styles.slimTrack, { backgroundColor: Colors.bgElevated }]}>
            <View
              style={[
                styles.slimFill,
                {
                  width: `${Math.min((totals.protein / Math.max(proteinTarget, 1)) * 100, 100)}%`,
                  backgroundColor: Colors.protein,
                },
              ]}
            />
          </View>
          <Text style={styles.slimLabel}>
            Protein <Text style={styles.slimVal}>{Math.round(totals.protein)}/{proteinTarget}g</Text>
          </Text>
        </View>
        <View style={styles.slimMacroRow}>
          <View style={[styles.slimTrack, { backgroundColor: Colors.bgElevated }]}>
            <View
              style={[
                styles.slimFill,
                {
                  width: `${Math.min((totals.carbs / Math.max(carbsTarget, 1)) * 100, 100)}%`,
                  backgroundColor: Colors.carbs,
                },
              ]}
            />
          </View>
          <Text style={styles.slimLabel}>
            Carbs <Text style={styles.slimVal}>{Math.round(totals.carbs)}/{carbsTarget}g</Text>
          </Text>
        </View>
        <View style={styles.slimMacroRow}>
          <View style={[styles.slimTrack, { backgroundColor: Colors.bgElevated }]}>
            <View
              style={[
                styles.slimFill,
                {
                  width: `${Math.min((totals.fat / Math.max(fatTarget, 1)) * 100, 100)}%`,
                  backgroundColor: Colors.fat,
                },
              ]}
            />
          </View>
          <Text style={styles.slimLabel}>
            Fat <Text style={styles.slimVal}>{Math.round(totals.fat)}/{fatTarget}g</Text>
          </Text>
        </View>
      </View>

      {/* Mascot tip bubble */}
      {proteinRemaining !== null && proteinRemaining > 0 ? (
        <View style={styles.tipBubble}>
          <Image source={require('../../assets/mascot/idle.png')} style={styles.tipAvatar} />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipText}>
              🐔 Only <Text style={styles.tipHighlight}>{proteinRemaining}g protein</Text> left!
            </Text>
          </View>
        </View>
      ) : proteinRemaining !== null && proteinRemaining === 0 ? (
        <View style={styles.tipBubble}>
          <Image source={require('../../assets/mascot/flex.png')} style={styles.tipAvatar} />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipText}>
              🐔 Protein goal crushed! Coach Hoo is flexing! 💪
            </Text>
          </View>
        </View>
      ) : null}

      {/* Today's meals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <Pressable onPress={() => router.push('/(tabs)/log')} style={styles.addMealBtn}>
            <Ionicons name="add" size={16} color={Colors.primary} />
            <Text style={styles.addMealText}>Add</Text>
          </Pressable>
        </View>

        {meals.length === 0 ? (
          <View style={styles.emptyMeals}>
            <Image
              source={require('../../assets/mascot/idle.png')}
              style={styles.emptyMascot}
            />
            <Text style={styles.emptyTitle}>
              {new Date().getHours() < 12 ? 'Good morning!' : new Date().getHours() < 18 ? 'Good afternoon!' : 'Good evening!'}
            </Text>
            <Text style={styles.emptySubText}>
              Coach Hoo hasn't seen any meals yet today. Time to log your first one!
            </Text>
            <Pressable
              style={styles.emptyCta}
              onPress={() => router.push('/(tabs)/log')}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.textInverse} />
              <Text style={styles.emptyCtaText}>Log a Meal</Text>
            </Pressable>
          </View>
        ) : (
          meals.map((meal) => (
            <MealSection key={meal.id} meal={meal} onDelete={deleteMeal} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingTop: 56, gap: Spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  greeting: { fontSize: FontSize.md, color: Colors.textSecondary },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  date:  { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  fab: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  ringCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCals: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    lineHeight: 48,
  },
  ringLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  ringPct: {
    fontSize: FontSize.sm,
    color: Colors.calories,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  motivationalMsg: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  macroTrio: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  slimMacroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slimTrack: {
    height: 4,
    flex: 1,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  slimFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  slimLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    width: 90,
    textAlign: 'right',
  },
  slimVal: {
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  tipBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tipAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  tipHighlight: {
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addMealText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  emptyMeals: {
    alignItems: 'center', gap: 10, paddingVertical: Spacing.xl,
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
  },
  emptyMascot: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  emptySubText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 20,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  emptyCtaText: {
    fontSize: FontSize.sm,
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
  },
});
