'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { en } from '@/lib/i18n/en';
import { vi } from '@/lib/i18n/vi';

export const I18N_STORAGE_KEY = 'refferq-language';
export const SUPPORTED_LANGUAGES = ['vi', 'en'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

type Messages = Record<string, unknown>;
type I18nContextValue = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  tx: (viText: string, enText: string) => string;
};

const dictionaries: Record<SupportedLanguage, Messages> = { vi, en };

const I18nContext = createContext<I18nContextValue | null>(null);

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return value === 'vi' || value === 'en';
}

function getMessage(messages: Messages, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);

  return typeof value === 'string' ? value : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('vi');

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(I18N_STORAGE_KEY);
    const nextLanguage = isSupportedLanguage(savedLanguage) ? savedLanguage : 'vi';

    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage;
  }, []);

  const setLanguage = (nextLanguage: SupportedLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(I18N_STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.dispatchEvent(new CustomEvent('language:change', { detail: { language: nextLanguage } }));
  };

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage(language === 'vi' ? 'en' : 'vi'),
    t: (key: string, fallback?: string) => getMessage(dictionaries[language], key) ?? fallback ?? key,
    tx: (viText: string, enText: string) => language === 'vi' ? viText : enText,
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
