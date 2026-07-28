import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import CoachMessage from './CoachMessage';
import { Spacing, Radius } from '../constants/theme';

interface CoachGuideProps {
  message: string;
  visible: boolean;
}

export default function CoachGuide({ message, visible }: CoachGuideProps) {
  return (
    <View style={styles.container}>
      <View style={styles.mascotFrame}>
        <Image
          source={require('../assets/mascot/idle.gif')}
          style={styles.mascot}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>
      <CoachMessage message={message} visible={visible} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EEDECB',
    gap: 8,
  },
  mascotFrame: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF6EE',
    borderWidth: 2,
    borderColor: '#E8A254',
  },
  mascot: {
    width: 68,
    height: 68,
  },
});