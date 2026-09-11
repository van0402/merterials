'use client';

import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';

export function LanguageToggle() {
  const { language, toggleLanguage, t } = useI18n();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="h-9 gap-2 rounded-full border border-orange-200 bg-white/80 px-3 text-xs font-bold uppercase text-slate-700 shadow-sm transition hover:bg-orange-50 hover:text-orange-700"
      aria-label={language === 'vi' ? t('language.switchToEnglish') : t('language.switchToVietnamese')}
      title={language === 'vi' ? t('language.switchToEnglish') : t('language.switchToVietnamese')}
    >
      <Languages className="h-4 w-4" />
      <span>{language.toUpperCase()}</span>
    </Button>
  );
}
