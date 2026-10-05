'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useAiSearch } from '@/hooks/useAiSearch';

interface SearchBarProps {
  q: string;
  ask: string;
  mode: string;
  region: string;
  type: string;
  verifiedOnly: boolean;
  initialAi: boolean;
}

export function SearchBar({ q, ask, mode, region, type, verifiedOnly, initialAi }: SearchBarProps) {
  const router = useRouter();
  const { analyzing, askAi } = useAiSearch();
  const [useAi, setUseAi] = useState(initialAi);
  const [keyword, setKeyword] = useState(q);
  const [aiText, setAiText] = useState(ask);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (useAi) {
      askAi(aiText);
      return;
    }
    const params = new URLSearchParams({ q: keyword.trim(), mode });
    if (region) params.set('region', region);
    if (type) params.set('type', type);
    if (verifiedOnly) params.set('verified', '1');
    router.push(`/tim-kiem?${params.toString()}`);
  }

  const tabClass = (active: boolean, color: string) =>
    `flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-extrabold ${
      active ? color : 'border-slate-200 text-slate-500'
    }`;

  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-2xl border bg-white p-4">
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setUseAi(false)}
          className={tabClass(!useAi, 'border-orange-300 bg-orange-50 text-orange-700')}
        >
          Từ khoá
        </button>
        <button
          type="button"
          onClick={() => setUseAi(true)}
          className={tabClass(useAi, 'border-purple-300 bg-purple-50 text-purple-700')}
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
          Hỏi AI
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {useAi ? (
          <input
            type="text"
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            maxLength={500}
            placeholder="Mô tả nhu cầu, ví dụ: xưởng ép nhựa ABS ở Bắc Ninh, 20.000 sp/tháng"
            className="h-11 flex-1 rounded-lg border border-purple-200 px-4 text-sm outline-none focus:border-purple-400"
          />
        ) : (
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm sản phẩm, vật liệu, nhà cung cấp..."
            className="h-11 flex-1 rounded-lg border px-4 text-sm outline-none focus:border-orange-300"
          />
        )}
        <button
          type="submit"
          disabled={analyzing}
          className={`h-11 rounded-lg px-6 text-sm font-extrabold text-white disabled:opacity-60 ${
            useAi ? 'bg-purple-600' : 'bg-orange-500'
          }`}
        >
          {useAi ? (analyzing ? 'AI đang phân tích...' : 'Hỏi AI') : 'Tìm kiếm'}
        </button>
      </div>
    </form>
  );
}