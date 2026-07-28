import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, Animated,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useMeals } from '../../context/MealContext';
import { useAuth } from '../../context/AuthContext';
import MealSection from '../../components/MealSection';
import CoachGuide from '../../components/CoachGuide';
import DashboardTutorial, {
  isTutorialComplete,
} from '../../components/DashboardTutorial';
import { useCoachMessage } from '../../hooks/useCoachMessage';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

const CONFIRMATION_DURATION = 3000;

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
  const [showTutorial, setShowTutorial] = useState(false);
  const [confirmationMsg, setConfirmationMsg] = useState<string | null>(null);
  const prevMealCount = useRef(meals.length);

  const coach = useCoachMessage(
    user?.full_name,
    meals,
    totals,
    targets,
  );

  const coachCardAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation
  useEffect(() => {
    Animated.spring(coachCardAnim, {
      toValue: 1,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, []);

  // Confirmation on meal save
  useEffect(() => {
    if (meals.length > prevMealCount.current && prevMealCount.current > 0) {
      setConfirmationMsg('Logged! Keep up the great tracking!');
      setTimeout(() => setConfirmationMsg(null), CONFIRMATION_DURATION);
    }
    prevMealCount.current = meals.length;
  }, [meals.length]);

  // Tutorial check
  useEffect(() => {
    (async () => {
      const done = await isTutorialComplete();
      if (!done) {
        setShowTutorial(true);
      }
    })();
  }, []);

  const displayMessage = confirmationMsg ?? coach.message;

  const caloriesTarget = targets?.calories_target ?? 2000;
  const proteinTarget = targets?.protein_target ?? 150;
  const carbsTarget = targets?.carbs_target ?? 200;
  const fatTarget = targets?.fat_target ?? 65;

  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => loadToday()}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header — date above greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>{today}</Text>
            <Text style={styles.greeting}>{coach.greeting}</Text>
          </View>
          <Pressable style={styles.fab} onPress={() => router.push('/(tabs)/log')}>
            <Ionicons name="add" size={24} color={Colors.textInverse} />
          </Pressable>
        </View>

        {/* Coach Guide — mascot + speech bubble */}
        <Animated.View
          style={{
            opacity: coachCardAnim,
            transform: [
              {
                translateY: coachCardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          }}
        >
          <CoachGuide message={displayMessage} visible />
        </Animated.View>

        {/* Calorie Ring */}
        <View style={styles.ringCard}>
          <CalorieRing consumed={totals.calories} target={caloriesTarget} />
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
              Protein{' '}
              <Text style={styles.slimVal}>
                {Math.round(totals.protein)}/{proteinTarget}g
              </Text>
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
              Carbs{' '}
              <Text style={styles.slimVal}>
                {Math.round(totals.carbs)}/{carbsTarget}g
              </Text>
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
              Fat{' '}
              <Text style={styles.slimVal}>
                {Math.round(totals.fat)}/{fatTarget}g
              </Text>
            </Text>
          </View>
        </View>

        {/* Today's meals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            <Pressable
              onPress={() => router.push('/(tabs)/log')}
              style={styles.addMealBtn}
            >
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addMealText}>Add</Text>
            </Pressable>
          </View>

          {meals.length === 0 ? (
            <View style={styles.emptyMeals}>
              <ExpoImage
                source={require('../../assets/mascot/idle.gif')}
                style={styles.emptyMascot}
                contentFit="contain"
              />
              <Text style={styles.emptyTitle}>
                {new Date().getHours() < 12
                  ? 'Good morning!'
                  : new Date().getHours() < 18
                    ? 'Good afternoon!'
                    : 'Good evening!'}
              </Text>
              <Text style={styles.emptySubText}>
                Coach Hoo hasn't seen any meals yet today. Time to log your first
                one!
              </Text>
              <Pressable
                style={styles.emptyCta}
                onPress={() => router.push('/(tabs)/log')}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={Colors.textInverse}
                />
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

      {/* Tutorial overlay */}
      <DashboardTutorial
        visible={showTutorial}
        onComplete={() => setShowTutorial(false)}
      />
    </>
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
  date: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  addMealText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  emptyMeals: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
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