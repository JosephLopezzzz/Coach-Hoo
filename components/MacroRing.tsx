import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, FontSize, FontWeight } from '../constants/theme';

interface MacroRingProps {
  calories:       number;
  caloriesTarget: number;
  protein:        number;
  proteinTarget:  number;
  carbs:          number;
  carbsTarget:    number;
  fat:            number;
  fatTarget:      number;
  size?:          number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function RingSegment({
  progress, color, size, strokeWidth, offset,
}: {
  progress: number; color: string; size: number; strokeWidth: number; offset: number;
}) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: Math.min(progress, 1),
      duration: 900,
      delay: offset * 150,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const radius      = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const strokeDashoffset = animVal.interpolate({
    inputRange:  [0, 1],
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
  calories, caloriesTarget,
  protein,  proteinTarget,
  carbs,    carbsTarget,
  fat,      fatTarget,
  size = 220,
}: MacroRingProps) {
  const strokeWidth = 12;
  const gap         = strokeWidth + 4;

  // 3 rings: protein (outer), carbs (mid), fat (inner)
  const rings = [
    { macro: 'Protein', consumed: protein,  target: proteinTarget, color: Colors.protein, ring: 0 },
    { macro: 'Carbs',   consumed: carbs,    target: carbsTarget,   color: Colors.carbs,   ring: 1 },
    { macro: 'Fat',     consumed: fat,      target: fatTarget,     color: Colors.fat,      ring: 2 },
  ];

  const calPct = caloriesTarget > 0
    ? Math.round((calories / caloriesTarget) * 100)
    : 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track circles */}
        {rings.map(({ ring }) => {
          const r = (size - strokeWidth) / 2 - ring * gap;
          return (
            <Circle
              key={`track-${ring}`}
              cx={size / 2} cy={size / 2} r={r}
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

      {/* Center content */}
      <View style={styles.center}>
        <Text style={styles.calValue}>{Math.round(calories)}</Text>
        <Text style={styles.calLabel}>kcal</Text>
        <Text style={styles.calPct}>{calPct}%</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {rings.map(({ macro, consumed, target, color }) => (
          <View key={macro} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendMacro}>{macro}</Text>
            <Text style={styles.legendVal}>
              {Math.round(consumed)}<Text style={styles.legendTarget}>/{target}g</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    lineHeight: 38,
  },
  calLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  calPct: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    alignItems: 'center',
    gap: 3,
  },
  legendDot: {
    width: 8, height: 8,
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
