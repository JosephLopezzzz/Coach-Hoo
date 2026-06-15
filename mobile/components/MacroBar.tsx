import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

interface MacroBarProps {
  label:     string;
  consumed:  number;
  target:    number;
  color:     string;
  unit?:     string;
}

export default function MacroBar({
  label, consumed, target, color, unit = 'g',
}: MacroBarProps) {
  const animWidth = useRef(new Animated.Value(0)).current;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;

  useEffect(() => {
    Animated.spring(animWidth, {
      toValue: pct,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const width = animWidth.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isOver = consumed > target && target > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={[styles.value, isOver && { color: Colors.error }]}>
          <Text style={styles.consumed}>{Math.round(consumed)}</Text>
          <Text style={styles.target}>/{target}{unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width,
              backgroundColor: isOver ? Colors.error : color,
            },
          ]}
        />
      </View>
      <Text style={styles.remaining}>
        {isOver
          ? `${Math.round(consumed - target)}${unit} over`
          : `${Math.round(target - consumed)}${unit} left`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8, height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: FontSize.sm,
  },
  consumed: {
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  target: {
    fontWeight: FontWeight.regular,
    color: Colors.textMuted,
  },
  track: {
    height: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  remaining: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 3,
    textAlign: 'right',
  },
});
