'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Send, ShieldCheck, X } from 'lucide-react';

export function SourcingQuoteDialog({ postId, postTitle }: { postId: string; postTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  function close() {
    if (!done && message && !window.confirm('Bỏ báo giá đang soạn?')) return;
    setOpen(false);
    setMessage('');
    setDone(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(`/api/sourcing/posts/${postId}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setDone(true);
        router.refresh(); // cập nhật số "báo giá đã gửi" trên bảng tin
      } else if (res.status === 401) {
        setOpen(false);
        toast('Bạn cần đăng nhập để gửi báo giá', {
          action: { label: 'Đăng nhập', onClick: () => router.push('/login') },
        });
      } else {
        toast.error(data.error || 'Gửi báo giá thất bại');
      }
    } catch {
      toast.error('Không thể kết nối máy chủ');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-[#f2c89f] px-3 py-1.5 text-[12px] font-extrabold text-[#c2410c] transition hover:bg-[#fff7ef]"
      >
        Gửi báo giá
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={close}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  ✓
                </div>
                <b className="block text-sm">Đã gửi báo giá</b>
                <p className="mt-1 text-xs text-muted-foreground">Người đăng bài sẽ nhận được thông báo và email.</p>
                <button type="button" onClick={close} className="mt-4 rounded-lg border px-4 py-2 text-xs font-bold">
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <b className="text-lg font-bold text-[#25324a]">Gửi báo giá riêng</b>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">Cho nhu cầu: {postTitle}</p>
                  </div>
                  <button type="button" onClick={close} aria-label="Đóng" className="text-muted-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <label className="mb-1.5 block text-xs font-bold text-slate-600">Nội dung báo giá *</label>
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border p-3.5 text-sm outline-none focus:border-orange-400"
                  placeholder="Ghi rõ đơn giá, số lượng tối thiểu (MOQ), thời gian giao hàng, điều kiện thanh toán..."
                />
                <div className="mb-3 mt-1 text-right text-[11px] text-slate-400">{message.length}/2000</div>

                <p className="mb-4 flex gap-2 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  Báo giá này chỉ người đăng bài nhìn thấy. Mỗi công ty chỉ gửi 1 báo giá cho mỗi bài.
                </p>

                <button
                  type="submit"
                  disabled={sending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-extrabold text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Đang gửi...' : 'Gửi báo giá'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}