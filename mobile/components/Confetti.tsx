import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

const CONFETTI_COLORS = [
  Colors.primary,
  Colors.accent,
  Colors.protein,
  Colors.carbs,
  '#E8A254',
  '#FFD166',
  '#EF476F',
  '#118AB2',
];

interface Piece {
  x: number;
  size: number;
  color: string;
  delay: number;
  animX: Animated.Value;
  animY: Animated.Value;
  animR: Animated.Value;
}

export default function Confetti({ active }: { active: boolean }) {
  const { width: screenW, height: screenH } = Dimensions.get('window');
  const piecesRef = useRef<Piece[]>([]);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!active) {
      piecesRef.current = [];
      forceUpdate((n) => n + 1);
      return;
    }

    const count = 40;
    const newPieces: Piece[] = [];

    for (let i = 0; i < count; i++) {
      newPieces.push({
        x: Math.random() * screenW,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 500,
        animX: new Animated.Value(0),
        animY: new Animated.Value(0),
        animR: new Animated.Value(0),
      });
    }

    piecesRef.current = newPieces;
    forceUpdate((n) => n + 1);

    Animated.stagger(
      50,
      newPieces.map((p) =>
        Animated.parallel([
          Animated.timing(p.animY, {
            toValue: screenH + 100,
            duration: 2000 + Math.random() * 1500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(p.animX, {
              toValue: (Math.random() - 0.5) * 200,
              duration: 1000 + Math.random() * 500,
              useNativeDriver: true,
            }),
            Animated.timing(p.animX, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(p.animR, {
            toValue: Math.random() * 720 - 360,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    const timer = setTimeout(() => {
      piecesRef.current = [];
      forceUpdate((n) => n + 1);
    }, 3500);

    return () => clearTimeout(timer);
  }, [active]);

  if (!active || piecesRef.current.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {piecesRef.current.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.piece,
            {
              left: p.x,
              width: p.size,
              height: p.size * 1.6,
              backgroundColor: p.color,
              borderRadius: p.size / 4,
              opacity: p.animY.interpolate({
                inputRange: [0, screenH * 0.5, screenH + 100],
                outputRange: [1, 1, 0],
              }),
              transform: [
                { translateX: p.animX },
                { translateY: p.animY },
                { rotate: p.animR.interpolate({
                  inputRange: [-360, 360],
                  outputRange: ['-360deg', '360deg'],
                })},
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: -40,
  },
});