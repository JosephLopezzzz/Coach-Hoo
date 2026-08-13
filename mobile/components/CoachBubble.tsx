import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import TypewriterText from './TypewriterText';
import type { TypewriterTextHandle } from './TypewriterText';
import { FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

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
  const [isTyping, setIsTyping] = useState(typewriter);

  useEffect(() => {
    setIsTyping(typewriter);
  }, [message, typewriter]);

  const handleComplete = () => {
    setIsTyping(false);
    onTypeComplete?.();
  };

  return (
    <Pressable
      style={[styles.container, isTyping && { minHeight: 600 }]}
      onPress={() => isTyping && typewriterRef.current?.skip()}
      accessible={false}
    >
      <View style={styles.mascotStage}>
        <View style={styles.backdropAngle} />
        <Image
          source={require('../assets/mascot/idle.gif')}
          style={styles.mascot}
          contentFit="contain"
          priority="low"
          cachePolicy="memory-disk"
        />
      </View>
      <View style={styles.textWrap}>
        {typewriter ? (
          <TypewriterText
            ref={typewriterRef}
            text={message}
            speed={typewriterSpeed}
            style={styles.questionText}
            onComplete={handleComplete}
          />
        ) : (
          <Text style={styles.questionText}>{message}</Text>
        )}
        {isTyping && (
          <Text style={styles.tapToSkipText}>Tap anywhere to skip</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    marginBottom: Spacing.md,
  },
  mascotStage: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  backdropAngle: {
    position: 'absolute',
    top: 0,
    left: -20,
    right: -20,
    bottom: 20,
    backgroundColor: '#EBECEE',
    borderBottomRightRadius: 40,
    transform: [{ rotate: '-3deg' }],
  },
  mascot: {
    width: 125,
    height: 125,
    zIndex: 2,
  },
  textWrap: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  questionText: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: '#111827',
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  tapToSkipText: {
    fontSize: FontSize.sm,
    color: '#9CA3AF',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
