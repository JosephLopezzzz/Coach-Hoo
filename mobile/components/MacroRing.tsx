import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { FontSize, FontWeight } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

interface MacroRingProps {
  calories: number;
  caloriesTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function RingSegment({
  progress,
  color,
  size,
  strokeWidth,
  offset,
}: {
  progress: number;
  color: string;
  size: number;
  strokeWidth: number;
  offset: number;
}) {
  const initialVal = Math.min(Math.max(progress, 0), 1);
  const animVal = useRef(new Animated.Value(initialVal)).current;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: Math.min(Math.max(progress, 0), 1),
      duration: 300,
      delay: offset * 30,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const strokeDashoffset = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      r={radius}
      fill="transparent"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={circumference}
      strokeDashoffset={strokeDashoffset}
      strokeLinecap="round"
      rotation="-90"
      origin={`${cx}, ${cy}`}
    />
  );
}

export default function MacroRing({
  calories,
  caloriesTarget,
  protein,
  proteinTarget,
  carbs,
  carbsTarget,
  fat,
  fatTarget,
  size = 220,
}: MacroRingProps) {
  const { colors } = useTheme();
  const strokeWidth = 12;
  const gap = strokeWidth + 4;

  const rings = [
    {
      macro: "Protein",
      consumed: protein,
      target: proteinTarget,
      color: colors.protein,
      ring: 0,
    },
    {
      macro: "Carbs",
      consumed: carbs,
      target: carbsTarget,
      color: colors.carbs,
      ring: 1,
    },
    {
      macro: "Fat",
      consumed: fat,
      target: fatTarget,
      color: colors.fat,
      ring: 2,
    },
  ];

  const calPct =
    caloriesTarget > 0 ? Math.round((calories / caloriesTarget) * 100) : 0;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {/* Track circles */}
          {rings.map(({ ring }) => {
            const r = (size - strokeWidth) / 2 - ring * gap;
            return (
              <Circle
                key={`track-${ring}`}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="transparent"
                stroke={colors.bgElevated}
                strokeWidth={strokeWidth}
              />
            );
          })}

          {/* Progress rings */}
          {rings.map(({ consumed, target, color, ring }) => {
            const ringSize = size - ring * gap * 2;
            const progress = target > 0 ? consumed / target : 0;
            return (
              <RingSegment
                key={`ring-${ring}`}
                progress={progress}
                color={color}
                size={ringSize}
                strokeWidth={strokeWidth}
                offset={ring}
              />
            );
          })}
        </Svg>

        {/* Center content showing consumed / limit */}
        <View style={styles.center}>
          <View style={styles.calRow}>
            <Text style={[styles.calValue, { color: colors.textPrimary }]}>{Math.round(calories).toLocaleString()}</Text>
            <Text style={[styles.calTarget, { color: colors.textMuted }]}> / {Math.round(caloriesTarget).toLocaleString()}</Text>
          </View>
          <Text style={[styles.calLabel, { color: colors.textSecondary }]}>kcal</Text>
          <Text style={[styles.calPct, { color: colors.primary }]}>{calPct}%</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {rings.map(({ macro, consumed, target, color }) => (
          <View key={macro} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={[styles.legendMacro, { color: colors.textSecondary }]}>{macro}</Text>
            <Text style={[styles.legendVal, { color: colors.textPrimary }]}>
              {Math.round(consumed)}
              <Text style={[styles.legendTarget, { color: colors.textMuted }]}>/{target}g</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 12,
  },
  container: {
    alignItems: "center",
  },
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  calRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  calValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  calTarget: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  calLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  calPct: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  legend: {
    flexDirection: "row",
    gap: 24,
  },
  legendItem: {
    alignItems: "center",
    gap: 3,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendMacro: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  legendVal: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  legendTarget: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
  },
});

