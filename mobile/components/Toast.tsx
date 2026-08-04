import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

export interface ToastData {
  id: string;
  type: 'success' | 'error';
  title: string;
  subtitle?: string;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({ toast, onDismiss, duration = 3000 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    if (toast.type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 90,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -140,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }, duration);

    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const bgColor = isSuccess ? '#52A084' : '#E05252';
  const iconName = isSuccess ? 'checkmark' : 'alert';
  const iconColor = isSuccess ? '#52A084' : '#E05252';

  const topOffset = Math.max(insets.top + 8, 44);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topOffset,
          backgroundColor: bgColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{toast.title}</Text>
        {toast.subtitle ? <Text style={styles.subtitle}>{toast.subtitle}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
  },
});
