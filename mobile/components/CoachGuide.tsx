import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import CoachMessage from './CoachMessage';
import { Spacing, Radius } from '../constants/theme';

const MIN_MASCOT = 120;
const MAX_MASCOT = 145;
const SCREEN_WIDTH_FACTOR = 0.33;

interface CoachGuideProps {
  message: string;
  visible: boolean;
}

function CoachGuide({ message, visible }: CoachGuideProps) {
  const { width } = useWindowDimensions();

  const mascotSize = useMemo(
    () => Math.min(Math.max(width * SCREEN_WIDTH_FACTOR, MIN_MASCOT), MAX_MASCOT),
    [width],
  );

  const tailTop = useMemo(() => Math.round(mascotSize * 0.37), [mascotSize]);

  return (
    <View style={styles.container}>
      <View style={[styles.mascotFrame, { width: mascotSize, height: mascotSize }]}>
        <Image
          source={require('../assets/mascot/idle.gif')}
          style={{ width: mascotSize, height: mascotSize }}
          contentFit="contain"
          priority="low"
          cachePolicy="memory-disk"
        />
      </View>
      <CoachMessage message={message} visible={visible} tailTop={tailTop} />
    </View>
  );
}

export default React.memo(CoachGuide);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EEDECB',
    gap: 12,
  },
  mascotFrame: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});