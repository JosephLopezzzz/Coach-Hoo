import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { mealsApi } from '../../services/api';
import { useMeals } from '../../context/MealContext';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

type Timeframe = 7 | 14 | 30;

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { targets } = useMeals();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [timeframe, setTimeframe] = useState<Timeframe>(7);
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<{
    date: string;
    dayLabel: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[]>([]);

  const targetCalories = targets?.calories_target || 2000;

  const loadHistory = useCallback(async (days: Timeframe) => {
    setLoading(true);
    try {
      const res = await mealsApi.history(days);
      setHistoryData(res.data || []);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(timeframe);
  }, [timeframe, loadHistory]);

  const statsSummary = useMemo(() => {
    if (!historyData.length) {
      return {
        avgCalories: 0,
        adherenceRate: 0,
        peakCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
        proteinPct: 0,
        carbsPct: 0,
        fatPct: 0,
      };
    }

    const totalCals = historyData.reduce((acc, curr) => acc + curr.calories, 0);
    const avgCalories = Math.round(totalCals / historyData.length);

    const metGoalCount = historyData.filter(d => d.calories > 0 && d.calories <= targetCalories + 150 && d.calories >= targetCalories - 300).length;
    const adherenceRate = Math.round((metGoalCount / historyData.length) * 100);

    const peakCalories = Math.max(...historyData.map(d => d.calories), 0);

    const totalP = historyData.reduce((acc, curr) => acc + curr.protein, 0);
    const totalC = historyData.reduce((acc, curr) => acc + curr.carbs, 0);
    const totalF = historyData.reduce((acc, curr) => acc + curr.fat, 0);
    const count = historyData.length;

    const avgProtein = Math.round(totalP / count);
    const avgCarbs = Math.round(totalC / count);
    const avgFat = Math.round(totalF / count);

    const pCals = avgProtein * 4;
    const cCals = avgCarbs * 4;
    const fCals = avgFat * 9;
    const macroSum = pCals + cCals + fCals || 1;

    const proteinPct = Math.round((pCals / macroSum) * 100);
    const carbsPct = Math.round((cCals / macroSum) * 100);
    const fatPct = Math.round((fCals / macroSum) * 100);

    return {
      avgCalories,
      adherenceRate,
      peakCalories,
      avgProtein,
      avgCarbs,
      avgFat,
      proteinPct,
      carbsPct,
      fatPct,
    };
  }, [historyData, targetCalories]);

  const chartConfig = {
    backgroundGradientFrom: colors.bgCard,
    backgroundGradientTo: colors.bgCard,
    color: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '30, 41, 59'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDark ? '148, 163, 184' : '100, 116, 139'}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.65,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  const calorieData = useMemo(() => {
    if (!historyData.length) {
      return {
        labels: ['--'],
        datasets: [{ data: [0], color: (opacity = 1) => colors.calories, strokeWidth: 2 }],
      };
    }

    // Step labels for clarity based on timeframe
    const labels = historyData.map((d, index) => {
      if (timeframe === 7) return d.dayLabel;
      if (timeframe === 14) return index % 2 === 0 ? d.date.substring(5) : '';
      return index % 5 === 0 ? d.date.substring(5) : '';
    });

    const data = historyData.map((d) => d.calories);

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => colors.primary,
          strokeWidth: 3,
        },
      ],
    };
  }, [historyData, timeframe, colors.primary, colors.calories]);

  const macroData = useMemo(() => {
    return {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [
        {
          data: [statsSummary.avgProtein, statsSummary.avgCarbs, statsSummary.avgFat],
          colors: [
            (opacity = 1) => colors.protein,
            (opacity = 1) => colors.carbs,
            (opacity = 1) => colors.fat,
          ],
        },
      ],
    };
  }, [statsSummary, colors.protein, colors.carbs, colors.fat]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Progress & Analytics</Text>
          <View style={styles.timeframeChips}>
            {([7, 14, 30] as Timeframe[]).map((tf) => {
              const active = timeframe === tf;
              return (
                <Pressable
                  key={tf}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setTimeframe(tf)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{tf}D</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => loadHistory(timeframe)}
            tintColor={colors.primary}
          />
        }
      >
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Ionicons name="flame-outline" size={18} color={colors.calories} />
              <Text style={styles.kpiLabel}>Avg Calories</Text>
            </View>
            <Text style={styles.kpiValue}>{statsSummary.avgCalories}</Text>
            <Text style={styles.kpiSub}>kcal / day</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.success || '#10b981'} />
              <Text style={styles.kpiLabel}>Goal Adherence</Text>
            </View>
            <Text style={styles.kpiValue}>{statsSummary.adherenceRate}%</Text>
            <Text style={styles.kpiSub}>Target: {targetCalories} kcal</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Ionicons name="trending-up-outline" size={18} color={colors.warning || '#f59e0b'} />
              <Text style={styles.kpiLabel}>Peak Intake</Text>
            </View>
            <Text style={styles.kpiValue}>{statsSummary.peakCalories}</Text>
            <Text style={styles.kpiSub}>highest day kcal</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Ionicons name="pie-chart-outline" size={18} color={colors.protein} />
              <Text style={styles.kpiLabel}>Macro Split</Text>
            </View>
            <Text style={styles.kpiValue}>{statsSummary.proteinPct}% P</Text>
            <Text style={styles.kpiSub}>{statsSummary.carbsPct}% C · {statsSummary.fatPct}% F</Text>
          </View>
        </View>

        {/* Calorie Trend Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Calorie Intake Trend</Text>
              <Text style={styles.cardSubtitle}>Past {timeframe} days daily calories</Text>
            </View>
            <View style={styles.targetBadge}>
              <Text style={styles.targetBadgeText}>Target {targetCalories} kcal</Text>
            </View>
          </View>
          <LineChart
            data={calorieData}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
          />
        </View>

        {/* Average Macro Breakdown Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Average Macro Distribution</Text>
              <Text style={styles.cardSubtitle}>Daily average grams for past {timeframe} days</Text>
            </View>
          </View>

          <BarChart
            data={macroData}
            width={screenWidth - 48}
            height={220}
            yAxisLabel=""
            yAxisSuffix="g"
            chartConfig={chartConfig}
            style={styles.chart}
            withCustomBarColorFromData
            flatColor
          />

          {/* Macro Breakdown Pills */}
          <View style={styles.macroPillsRow}>
            <View style={[styles.macroPill, { borderColor: `${colors.protein}40` }]}>
              <View style={[styles.dot, { backgroundColor: colors.protein }]} />
              <Text style={styles.macroPillLabel}>Protein:</Text>
              <Text style={styles.macroPillVal}>{statsSummary.avgProtein}g ({statsSummary.proteinPct}%)</Text>
            </View>
            <View style={[styles.macroPill, { borderColor: `${colors.carbs}40` }]}>
              <View style={[styles.dot, { backgroundColor: colors.carbs }]} />
              <Text style={styles.macroPillLabel}>Carbs:</Text>
              <Text style={styles.macroPillVal}>{statsSummary.avgCarbs}g ({statsSummary.carbsPct}%)</Text>
            </View>
            <View style={[styles.macroPill, { borderColor: `${colors.fat}40` }]}>
              <View style={[styles.dot, { backgroundColor: colors.fat }]} />
              <Text style={styles.macroPillLabel}>Fat:</Text>
              <Text style={styles.macroPillVal}>{statsSummary.avgFat}g ({statsSummary.fatPct}%)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: colors.textPrimary,
  },
  timeframeChips: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: colors.bg,
    padding: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 110,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  kpiLabel: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  kpiValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: colors.textPrimary,
  },
  kpiSub: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    marginBottom: Spacing.xs,
  },
  targetBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  targetBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: colors.primary,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
  },
  macroPillsRow: {
    flexDirection: 'column',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  macroPillLabel: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    fontWeight: FontWeight.medium,
    marginRight: 4,
  },
  macroPillVal: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: colors.textPrimary,
  },
});
