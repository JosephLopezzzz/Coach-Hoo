import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Text } from 'react-native';

export interface TypewriterTextHandle {
  skip: () => void;
}

interface TypewriterTextProps {
  text: string;
  speed?: number;
  style?: any;
  onComplete?: () => void;
}

const TypewriterText = forwardRef<TypewriterTextHandle, TypewriterTextProps>(({
  text,
  speed = 25,
  style,
  onComplete,
}, ref) => {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(false);

  useImperativeHandle(ref, () => ({
    skip: () => {
      if (doneRef.current) return;
      doneRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      setDisplayed(text);
      onComplete?.();
    },
  }));

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;
    doneRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);

    const type = () => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
        timerRef.current = setTimeout(type, speed);
      } else if (!doneRef.current) {
        doneRef.current = true;
        onComplete?.();
      }
    };

    type();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text]);

  return (
    <Text style={style}>
      {displayed}
      {displayed.length < text.length && <Text style={{ opacity: 0.5 }}>|</Text>}
    </Text>
  );
});

export default TypewriterText;
