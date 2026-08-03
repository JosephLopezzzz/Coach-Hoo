import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '../services/coachMessageService';
import { LANGUAGE_KEY } from '../services/coachMessageService';
import { createT, t as translate, type TFunction } from '../constants/i18n';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => Promise<void>;
  /** Translate a key in the active language. */
  t: TFunction;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'english',
  setLang: async () => {},
  t: (key, params) => translate('english', key, params),
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

  const t = useMemo(() => createT(lang), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
