'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  RESPONDED: 'Đã trả lời',
  CLOSED: 'Đã đóng',
};

export function InquiryStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function updateStatus(newStatus: string) {
    if (newStatus === status) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/supplier/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã cập nhật trạng thái');
        router.refresh();
      } else {
        toast.error(data.error || 'Cập nhật thất bại');
      }
    } catch {
      toast.error('Không thể kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={status}
      disabled={saving}
      onChange={(e) => updateStatus(e.target.value)}
      className="h-9 rounded-lg border px-2 text-xs font-bold"
    >
      {Object.entries(STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
}