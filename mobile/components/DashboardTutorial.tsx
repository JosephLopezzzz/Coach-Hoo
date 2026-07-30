import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Confetti from './Confetti';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

const TUTORIAL_KEY = 'coach_hoo_tutorial_complete';

export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  rx: number;
  ry: number;
}

export interface TutorialTargetRefs {
  fabRef: React.RefObject<View | null>;
  trackerRef: React.RefObject<View | null>;
  coachRef: React.RefObject<View | null>;
}

function SpotlightCutout({
  rect,
  screenW,
  screenH,
}: {
  rect: SpotlightRect;
  screenW: number;
  screenH: number;
}) {
  const holeBottom = rect.top + rect.height;
  const holeRight = rect.left + rect.width;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.curtain, { top: 0, left: 0, right: 0, height: rect.top }]} />
      <View style={[styles.curtain, { bottom: 0, left: 0, right: 0, height: screenH - holeBottom }]} />
      <View style={[styles.curtain, { top: rect.top, left: 0, width: rect.left, height: rect.height }]} />
      <View style={[styles.curtain, { top: rect.top, right: 0, width: screenW - holeRight, height: rect.height }]} />
      <View
        style={{
          position: 'absolute',
          top: rect.top - 2,
          left: rect.left - 2,
          width: rect.width + 4,
          height: rect.height + 4,
          borderRadius: rect.rx + 2,
          borderWidth: 2.5,
          borderColor: Colors.primary,
        }}
      />
    </View>
  );
}

interface DashboardTutorialProps {
  visible: boolean;
  onComplete: () => void;
  targetRefs: TutorialTargetRefs;
  userName?: string;
  scrollViewRef?: React.RefObject<ScrollView | null>;
}

export default function DashboardTutorial({
  visible,
  onComplete,
  targetRefs,
  userName,
  scrollViewRef,
}: DashboardTutorialProps) {
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { width: screenW, height: screenH } = Dimensions.get('window');

  const name = userName?.split(' ')[0] ?? 'there';

  const steps = [
    {
      title: 'Welcome to Coach Hoo!',
      message: `Hi ${name}! I'm your guide through this app. Let me show you around so you can start tracking your nutrition with confidence.`,
      getRef: () => null as React.RefObject<View> | null,
      measureFirst: false,
    },
    {
      title: 'Log Your Meals',
      message: 'Tap the + button to record what you eat. Tell me the food and I\'ll calculate the macros for you.',
      getRef: () => targetRefs.fabRef,
      measureFirst: true,
    },
    {
      title: 'Track Your Progress',
      message: 'Your calorie tracker and macro bars show how close you are to your daily targets. The fuller they are, the better!',
      getRef: () => targetRefs.trackerRef,
      measureFirst: true,
    },
    {
      title: 'Coach Hoo Responds',
      message: 'I read your activity and give you tailored feedback, encouragement, and tips to keep you on track.',
      getRef: () => targetRefs.coachRef,
      measureFirst: true,
    },
    {
      title: "You're Ready!",
      message: `Log your first entry and I'll guide you from there.`,
      getRef: () => null as React.RefObject<View> | null,
      measureFirst: false,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  const measureTarget = useCallback(
    (ref: React.RefObject<View | null> | null): Promise<SpotlightRect | null> => {
      return new Promise((resolve) => {
        if (!ref?.current) {
          resolve(null);
          return;
        }
        ref.current.measureInWindow((x: number, y: number, w: number, h: number) => {
          if (w === 0 && h === 0) {
            resolve(null);
            return;
          }
          resolve({ top: y, left: x, width: w, height: h, rx: 16, ry: 16 });
        });
      });
    },
    [],
  );

  const goTo = useCallback(
    async (next: number) => {
      setStep(next);
      setSpotlight(null);

      const ref = steps[next]?.getRef?.();
      if (steps[next]?.measureFirst && ref) {
        const rect = await measureTarget(ref);
        if (rect) {
          setSpotlight(rect);
        } else {
          setTimeout(async () => {
            const retry = await measureTarget(ref);
            if (retry) setSpotlight(retry);
          }, 300);
        }
      }
    },
    [measureTarget],
  );

  // Reset
  useEffect(() => {
    if (!visible) {
      setStep(0);
      setSpotlight(null);
      setShowConfetti(false);
      slideAnim.setValue(-100);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  // Animate step transitions
  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step, visible]);

  // Launch confetti on last step
  useEffect(() => {
    if (isLast && visible) {
      const t = setTimeout(() => setShowConfetti(true), 500);
      return () => clearTimeout(t);
    } else {
      setShowConfetti(false);
    }
  }, [isLast, visible]);

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
    } catch {}
    onComplete();
  };

  const handleSkip = () => handleComplete();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.root}>
        {/* Spotlight overlay or full dim */}
        {spotlight ? (
          <SpotlightCutout rect={spotlight} screenW={screenW} screenH={screenH} />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(47,62,70,0.65)' },
            ]}
            pointerEvents="none"
          />
        )}

        <Confetti active={showConfetti} />

        {/* Coach card at bottom */}
        <Animated.View
          style={[
            styles.coachCard,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={styles.coachRow}>
            <View style={styles.mascotFrame}>
              <Image
                source={require('../assets/mascot/streak.png')}
                style={styles.mascot}
                contentFit="contain"
              />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.title}>{current.title}</Text>
              <Text style={styles.message}>{current.message}</Text>
            </View>
          </View>

          <View style={styles.dotsRow}>
            {steps.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.controls}>
            <Pressable onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <View style={styles.navGroup}>
              {!isFirst && (
                <Pressable
                  style={styles.navBtn}
                  onPress={() => goTo(step - 1)}
                >
                  <Text style={styles.navBtnText}>Back</Text>
                </Pressable>
              )}
              {isLast ? (
                <Pressable
                  style={[styles.navBtn, styles.doneBtn]}
                  onPress={handleComplete}
                >
                  <Text style={styles.doneBtnText}>Done</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.navBtn, styles.nextBtn]}
                  onPress={() => goTo(step + 1)}
                >
                  <Text style={styles.nextBtnText}>Next</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export async function isTutorialComplete(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(TUTORIAL_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function resetTutorial(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TUTORIAL_KEY);
  } catch {}
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  curtain: {
    position: 'absolute',
    backgroundColor: 'rgba(47,62,70,0.65)',
  },
  coachCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + 16,
    gap: Spacing.md,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  coachRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  mascotFrame: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascot: {
    width: 54,
    height: 54,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  navGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  navBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  navBtnText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
});