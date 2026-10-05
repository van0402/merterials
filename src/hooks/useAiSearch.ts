'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MACRO_REGION_LABELS: Record<string, string> = {
  NORTH: 'Miền Bắc',
  CENTRAL: 'Miền Trung',
  SOUTH: 'Miền Nam',
};

export function useAiSearch() {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);

  async function askAi(rawText: string) {
    const text = rawText.trim();
    if (!text) {
      alert('Mô tả nhu cầu của bạn trước đã.');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Chưa phân tích được lúc này, bạn thử lại nhé.');
        return;
      }

      const need = data.need;
      if (!need.product) {
        alert('Mình chưa xác định được bạn cần sản phẩm gì, hãy nêu rõ tên vật liệu hoặc sản phẩm nhé.');
        return;
      }

      const params = new URLSearchParams({
        q: need.product,
        mode: 'supplier',
        region: need.province || MACRO_REGION_LABELS[need.macroRegion] || '',
        type: need.businessType || '',
        ai: '1',
        ask: text,
      });
      if (need.quantity) params.set('qty', need.quantity);
      if (need.extraRequirements) params.set('extra', need.extraRequirements);
      router.push(`/tim-kiem?${params.toString()}`);
    } catch {
      alert('Không thể kết nối máy chủ, bạn thử lại nhé.');
    } finally {
      setAnalyzing(false);
    }
  }

  return { analyzing, askAi };
}