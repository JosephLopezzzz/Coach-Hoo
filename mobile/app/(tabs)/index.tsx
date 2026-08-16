import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, Animated,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useMeals } from '../../context/MealContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import MealSection from '../../components/MealSection';
import CoachGuide from '../../components/CoachGuide';
import DashboardTutorial, {
  isTutorialComplete,
} from '../../components/DashboardTutorial';
import { useCoachMessage } from '../../hooks/useCoachMessage';
import { Colors as StaticColors, FontSize, FontWeight, Spacing, Radius, MEAL_TYPES, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

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
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const animVal = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: pct,
      duration: 300,
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
          stroke={colors.bgElevated}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          fill="transparent"
          stroke={colors.calories}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <View style={styles.ringCalsRow}>
          <Text style={styles.ringCals}>{Math.round(consumed).toLocaleString()}</Text>
          <Text style={styles.ringTarget}> / {Math.round(target).toLocaleString()}</Text>
        </View>
        <Text style={styles.ringLabel}>kcal</Text>
        <Text style={styles.ringPct}>{Math.round((target > 0 ? consumed / target : 0) * 100)}%</Text>
      </View>
    </View>
  );
}


export default function DashboardScreen() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { meals, totals, targets, remaining, isLoading, loadToday, deleteMeal } = useMeals();
  const [showTutorial, setShowTutorial] = useState(false);
  const [confirmationMsg, setConfirmationMsg] = useState<string | null>(null);
  const prevMealCount = useRef(meals.length);

  const fabRef = useRef<View>(null);
  const trackerRef = useRef<View>(null);
  const coachRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);

  const coach = useCoachMessage(
    user?.full_name,
    meals,
    totals,
    targets,
    lang,
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

  // Confirmation on meal save. The timer is cleared on unmount (and before a
  // replacement is scheduled) so a fast second log can't leave a stale setState.
  useEffect(() => {
    const grew = meals.length > prevMealCount.current && prevMealCount.current > 0;
    prevMealCount.current = meals.length;
    if (!grew) return;

    setConfirmationMsg(t('dash.logged'));
    const timer = setTimeout(() => setConfirmationMsg(null), CONFIRMATION_DURATION);
    return () => clearTimeout(timer);
  }, [meals.length, t]);

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

  const today = new Date().toLocaleDateString(lang === 'filipino' ? 'fil-PH' : 'en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.root}>
      {/* Absolute Background Gradient (hide in dark mode or make very subtle) */}
      {!isDark && (
        <ExpoImage
          source={require('../../assets/dashboard_bg.jpeg')}
          style={styles.bgImage}
          contentFit="cover"
        />
      )}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => loadToday()}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Transparent Header Section */}
        <View style={[styles.headerWrapper, { paddingTop: insets.top + Spacing.lg }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.date}>{today}</Text>
              <Text style={styles.greeting}>{coach.greeting}</Text>
            </View>
          </View>

          {/* Coach Guide — mascot + speech bubble */}
          <View ref={coachRef}>
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
          </View>
        </View>

        {/* Layered White Content Card */}
        <View style={styles.contentCard}>
          {/* Calorie Ring + Macro bars */}
          <View ref={trackerRef}>
            <View style={styles.ringCard}>
              <CalorieRing consumed={totals.calories} target={caloriesTarget} />
            </View>

            {/* Slim macro trio bars */}
            <View style={styles.macroTrio}>
              <View style={styles.slimMacroRow}>
                <View style={[styles.slimTrack, { backgroundColor: colors.bgElevated }]}>
                  <View
                    style={[
                      styles.slimFill,
                      {
                        width: `${Math.min((totals.protein / Math.max(proteinTarget, 1)) * 100, 100)}%`,
                        backgroundColor: colors.protein,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.slimLabel}>
                  {t('macro.protein')}{' '}
                  <Text style={styles.slimVal}>
                    {Math.round(totals.protein)}/{proteinTarget}g
                  </Text>
                </Text>
              </View>
              <View style={styles.slimMacroRow}>
                <View style={[styles.slimTrack, { backgroundColor: colors.bgElevated }]}>
                  <View
                    style={[
                      styles.slimFill,
                      {
                        width: `${Math.min((totals.carbs / Math.max(carbsTarget, 1)) * 100, 100)}%`,
                        backgroundColor: colors.carbs,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.slimLabel}>
                  {t('macro.carbs')}{' '}
                  <Text style={styles.slimVal}>
                    {Math.round(totals.carbs)}/{carbsTarget}g
                  </Text>
                </Text>
              </View>
              <View style={styles.slimMacroRow}>
                <View style={[styles.slimTrack, { backgroundColor: colors.bgElevated }]}>
                  <View
                    style={[
                      styles.slimFill,
                      {
                        width: `${Math.min((totals.fat / Math.max(fatTarget, 1)) * 100, 100)}%`,
                        backgroundColor: colors.fat,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.slimLabel}>
                  {t('macro.fat')}{' '}
                  <Text style={styles.slimVal}>
                    {Math.round(totals.fat)}/{fatTarget}g
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Today's meals */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('dash.todaysMeals')}</Text>
              <View ref={fabRef}>
                <Pressable
                  onPress={() => router.push('/(tabs)/log')}
                  style={styles.addMealBtn}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={styles.addMealText}>{t('dash.add')}</Text>
                </Pressable>
              </View>
            </View>

            {meals.length === 0 ? (
              <View style={styles.emptyMeals}>
                <ExpoImage
                  source={require('../../assets/mascot/idle.gif')}
                  style={styles.emptyMascot}
                  contentFit="contain"
                  priority="low"
                />
                <Text style={styles.emptyTitle}>
                  {new Date().getHours() < 12
                    ? t('dash.goodMorning')
                    : new Date().getHours() < 18
                      ? t('dash.goodAfternoon')
                      : t('dash.goodEvening')}
                </Text>
                <Text style={styles.emptySubText}>{t('dash.emptyMeals')}</Text>
                <Pressable
                  style={styles.emptyCta}
                  onPress={() => router.push('/(tabs)/log')}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color={colors.textInverse}
                  />
                  <Text style={styles.emptyCtaText}>{t('dash.logAMeal')}</Text>
                </Pressable>
              </View>
            ) : (
              meals.map((meal) => (
                <MealSection key={meal.id} meal={meal} onDelete={deleteMeal} />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Tutorial overlay */}
      <DashboardTutorial
        visible={showTutorial}
        onComplete={() => setShowTutorial(false)}
        targetRefs={{ fabRef, trackerRef, coachRef }}
        scrollViewRef={scrollRef}
        userName={user?.full_name}
      />
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 480, // Covers upper portion, creating the sky/gradient look
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  contentCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  date: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: colors.textPrimary,
  },
  ringCard: {
    backgroundColor: 'transparent',
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCalsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ringCals: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: colors.textPrimary,
  },
  ringTarget: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: colors.textMuted,
  },
  ringLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  ringPct: {
    fontSize: FontSize.xs,
    color: colors.calories,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },

  macroTrio: {
    backgroundColor: colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textSecondary,
    fontWeight: FontWeight.medium,
    width: 90,
    textAlign: 'right',
  },
  slimVal: {
    fontWeight: FontWeight.bold,
    color: colors.textPrimary,
  },
  section: {
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: colors.textPrimary,
  },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addMealText: {
    fontSize: FontSize.sm,
    color: colors.primary,
    fontWeight: FontWeight.semibold,
  },
  emptyMeals: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacing.xl,
    backgroundColor: colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyMascot: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: colors.textPrimary,
  },
  emptySubText: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 20,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  emptyCtaText: {
    fontSize: FontSize.sm,
    color: colors.textInverse,
    fontWeight: FontWeight.semibold,
  },
});
