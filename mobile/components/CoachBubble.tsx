import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import TypewriterText from './TypewriterText';
import type { TypewriterTextHandle } from './TypewriterText';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

interface CoachBubbleProps {
  message: string;
  typewriter?: boolean;
  typewriterSpeed?: number;
  onTypeComplete?: () => void;
}

export default function CoachBubble({
  message,
  typewriter = true,
  typewriterSpeed = 20,
  onTypeComplete,
}: CoachBubbleProps) {
  const typewriterRef = useRef<TypewriterTextHandle>(null);

  return (
    <View style={styles.row}>
      <View style={styles.mascotFrame}>
        <Image
          source={require('../assets/mascot/idle.gif')}
          style={styles.mascot}
          contentFit="contain"
          priority="low"
          cachePolicy="memory-disk"
        />
      </View>
      <Pressable onPress={() => typewriterRef.current?.skip()} style={styles.bubble}>
        <View style={styles.tail} />
        {typewriter ? (
          <TypewriterText
            ref={typewriterRef}
            text={message}
            speed={typewriterSpeed}
            style={styles.message}
            onComplete={onTypeComplete}
          />
        ) : (
          <Text style={styles.message}>{message}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: Spacing.md,
  },
  mascotFrame: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascot: {
    width: 72,
    height: 72,
  },
  bubble: {
    flex: 1,
    backgroundColor: '#FFF5E6',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  tail: {
    position: 'absolute',
    left: -7,
    top: 28,
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
