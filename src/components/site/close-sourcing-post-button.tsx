'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function CloseSourcingPostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClose() {
    if (!window.confirm('Đóng bài này? Nhà cung cấp sẽ không gửi thêm báo giá được nữa.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sourcing/posts/${postId}/close`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success('Đã đóng bài');
        router.refresh(); // tải lại danh sách để cập nhật trạng thái
      } else {
        toast.error(data.error || 'Đóng bài thất bại');
      }
    } catch {
      toast.error('Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClose}
      disabled={loading}
      className="text-[12px] font-extrabold text-[#b74141] disabled:opacity-50"
    >
      {loading ? 'Đang đóng...' : 'Đóng bài'}
    </button>
  );
}