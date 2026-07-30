import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

interface CoachMessageProps {
  message: string;
  visible: boolean;
}

export default function CoachMessage({ message, visible }: CoachMessageProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, message]);

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.tail} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flex: 1,
    backgroundColor: '#FFF5E6',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginLeft: 4,
  },
  tail: {
    position: 'absolute',
    left: -7,
    top: 42,
    width: 12,
    height: 12,
    backgroundColor: '#FFF5E6',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.primary,
    transform: [{ rotate: '45deg' }],
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    lineHeight: 22,
  },
});