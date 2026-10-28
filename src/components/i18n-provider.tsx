'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { en } from '@/lib/i18n/en';
import { vi } from '@/lib/i18n/vi';
import { zh } from '@/lib/i18n/zh';
import { ko } from '@/lib/i18n/ko';
export const I18N_STORAGE_KEY = 'supermaterial-language';
export const SUPPORTED_LANGUAGES = ['vi', 'en', 'zh', 'ko'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

type Messages = Record<string, unknown>;
type I18nContextValue = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
  get: (key: string) => unknown;
  tx: (viText: string, enText: string) => string;
};

const dictionaries: Record<SupportedLanguage, Messages> = { vi, en, zh, ko };

const I18nContext = createContext<I18nContextValue | null>(null);

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return value === 'vi' || value === 'en' || value === 'zh' || value === 'ko';
}

function getMessage(messages: Messages, key: string): string | undefined {
  const value = getValue(messages, key);
  return typeof value === 'string' ? value : undefined;
}

function getValue(messages: Messages, key: string): unknown {
  return key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);
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
    t: (key: string, fallback?: string) =>
    getMessage(dictionaries[language], key) ?? fallback ?? key,
    get: (key: string) => getValue(dictionaries[language], key),
    tx: (viText: string, enText: string) =>
    language === 'vi' ? viText : enText,
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
