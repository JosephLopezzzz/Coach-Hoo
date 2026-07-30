import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '../services/coachMessageService';
import { LANGUAGE_KEY } from '../services/coachMessageService';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'english',
  setLang: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('english');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (saved === 'filipino' || saved === 'english') setLangState(saved);
      } catch {}
    })();
  }, []);

  const setLang = useCallback(async (l: Language) => {
    setLangState(l);
    await AsyncStorage.setItem(LANGUAGE_KEY, l);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
