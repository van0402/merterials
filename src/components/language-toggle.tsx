'use client';

import { Languages } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/components/i18n-provider';

const LANGUAGE_LABELS = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
  ko: '한국어',
} as const;

export function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  return (
    <Select
      value={language}
      onValueChange={(value) =>
        setLanguage(value as 'vi' | 'en' | 'zh' | 'ko')
      }
    >
      <SelectTrigger className="h-9 w-9 justify-center rounded-full border border-orange-200 bg-white/80 px-0 text-xs font-semibold text-slate-700 shadow-sm sm:w-[145px] sm:justify-between sm:px-3">
        <Languages className="h-4 w-4 sm:mr-2" />
        <span className="!hidden sm:!inline-flex">
          <SelectValue />
        </span>
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="vi">{LANGUAGE_LABELS.vi}</SelectItem>
        <SelectItem value="en">{LANGUAGE_LABELS.en}</SelectItem>
        <SelectItem value="zh">{LANGUAGE_LABELS.zh}</SelectItem>
        <SelectItem value="ko">{LANGUAGE_LABELS.ko}</SelectItem>
      </SelectContent>
    </Select>
  );
}