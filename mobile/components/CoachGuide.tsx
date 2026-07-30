import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import CoachMessage from './CoachMessage';
import { Spacing, Radius } from '../constants/theme';

interface CoachGuideProps {
  message: string;
  visible: boolean;
}

function CoachGuide({ message, visible }: CoachGuideProps) {
  return (
    <View style={styles.container}>
      <View style={styles.mascotFrame}>
        <Image
          source={require('../assets/mascot/idle.gif')}
          style={styles.mascot}
          contentFit="contain"
          priority="low"
          cachePolicy="memory-disk"
        />
      </View>
      <CoachMessage message={message} visible={visible} />
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
    gap: 10,
  },
  mascotFrame: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascot: {
    width: 88,
    height: 88,
  },
});