import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

const TUTORIAL_KEY = 'coach_hoo_tutorial_complete';

const STEPS = [
  {
    title: 'Welcome to Coach Hoo!',
    message: "I'm your personal nutrition coach. I'll help you track meals, hit your goals, and stay motivated — one peck at a time!",
    spotlight: null as SpotlightRect | null,
  },
  {
    title: 'Log Your Meals',
    message: 'Tap the + button to record what you eat. Tell me the food and portion, and I\'ll calculate the macros for you.',
    spotlight: { top: 56, left: 0, width: 80, height: 44, rx: 22, ry: 22 },
  },
  {
    title: 'Track Your Progress',
    message: 'Your calorie ring and macro bars show how close you are to your daily targets. The fuller they are, the better!',
    spotlight: { top: 260, left: 24, width: 300, height: 160, rx: 16, ry: 16 },
  },
  {
    title: 'Coach Hoo Responds',
    message: 'I read your activity and give you tailored feedback — encouragement, reminders, and tips to keep you on track.',
    spotlight: { top: 440, left: 24, width: 300, height: 90, rx: 16, ry: 16 },
  },
  {
    title: 'Ready to Start!',
    message: "You're all set. Log your first meal and I'll be right here cheering you on. Let's do this!",
    spotlight: null as SpotlightRect | null,
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  rx: number;
  ry: number;
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
  const topBand = rect.top;
  const bottomBand = screenH - rect.top - rect.height;
  const leftBand = rect.left;
  const rightBand = screenW - rect.left - rect.width;

  return (
    <>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(47,62,70,0.65)' }]} pointerEvents="none" />
      {/* Top band */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: topBand,
          backgroundColor: 'rgba(47,62,70,0.65)',
        }}
        pointerEvents="none"
      />
      {/* Bottom band */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: bottomBand,
          backgroundColor: 'rgba(47,62,70,0.65)',
        }}
        pointerEvents="none"
      />
      {/* Left band */}
      <View
        style={{
          position: 'absolute',
          top: topBand,
          left: 0,
          width: leftBand,
          height: rect.height,
          backgroundColor: 'rgba(47,62,70,0.65)',
        }}
        pointerEvents="none"
      />
      {/* Right band */}
      <View
        style={{
          position: 'absolute',
          top: topBand,
          right: 0,
          width: rightBand,
          height: rect.height,
          backgroundColor: 'rgba(47,62,70,0.65)',
        }}
        pointerEvents="none"
      />
    </>
  );
}

interface DashboardTutorialProps {
  visible: boolean;
  onComplete: () => void;
}

export default function DashboardTutorial({
  visible,
  onComplete,
}: DashboardTutorialProps) {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { width: screenW, height: screenH } = Dimensions.get('window');

  useEffect(() => {
    if (!visible) setStep(0);
  }, [visible]);

  const goTo = (next: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setStep(next);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
    } catch {}
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.root}>
        {/* Spotlight overlay */}
        {current.spotlight ? (
          <SpotlightCutout
            rect={current.spotlight}
            screenW={screenW}
            screenH={screenH}
          />
        ) : (
          <View style={StyleSheet.absoluteFill} pointerEvents="none" />
        )}

        {/* Coach card at bottom */}
        <Animated.View
          style={[styles.coachCard, { opacity: fadeAnim }]}
        >
          <View style={styles.coachRow}>
            <View style={styles.tutorialMascotFrame}>
              <Image
                source={require('../assets/mascot/idle.gif')}
                style={styles.tutorialMascot}
                contentFit="contain"
              />
            </View>
            <View style={styles.tutorialTextWrap}>
              <Text style={styles.tutorialTitle}>{current.title}</Text>
              <Text style={styles.tutorialMessage}>{current.message}</Text>
            </View>
          </View>

          {/* Steps indicator */}
          <View style={styles.dotsRow}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === step && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <Pressable onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>

            <View style={styles.navGroup}>
              {!isFirst && (
                <Pressable style={styles.navBtn} onPress={() => goTo(step - 1)}>
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
    backgroundColor: 'rgba(47,62,70,0.65)',
    justifyContent: 'flex-end',
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
  tutorialMascotFrame: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Colors.bg,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialMascot: {
    width: 56,
    height: 56,
  },
  tutorialTextWrap: {
    flex: 1,
    gap: 4,
  },
  tutorialTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  tutorialMessage: {
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