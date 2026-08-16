import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Colors, FontSize, FontWeight } from "../constants/theme";

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
  const strokeWidth = 12;
  const gap = strokeWidth + 4;

  const rings = [
    {
      macro: "Protein",
      consumed: protein,
      target: proteinTarget,
      color: Colors.protein,
      ring: 0,
    },
    {
      macro: "Carbs",
      consumed: carbs,
      target: carbsTarget,
      color: Colors.carbs,
      ring: 1,
    },
    {
      macro: "Fat",
      consumed: fat,
      target: fatTarget,
      color: Colors.fat,
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
                stroke={Colors.bgElevated}
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
            <Text style={styles.calValue}>{Math.round(calories).toLocaleString()}</Text>
            <Text style={styles.calTarget}> / {Math.round(caloriesTarget).toLocaleString()}</Text>
          </View>
          <Text style={styles.calLabel}>kcal</Text>
          <Text style={styles.calPct}>{calPct}%</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {rings.map(({ macro, consumed, target, color }) => (
          <View key={macro} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendMacro}>{macro}</Text>
            <Text style={styles.legendVal}>
              {Math.round(consumed)}
              <Text style={styles.legendTarget}>/{target}g</Text>
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
    color: Colors.textPrimary,
  },
  calTarget: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
  },
  calLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  calPct: {
    fontSize: FontSize.xs,
    color: Colors.primary,
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
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  legendVal: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  legendTarget: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.regular,
  },
});

