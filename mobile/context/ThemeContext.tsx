import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
  colors: lightColors,
  isDark: false,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeState(saved);
      }
    });
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    AsyncStorage.setItem('app_theme', newTheme);
  };

  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
