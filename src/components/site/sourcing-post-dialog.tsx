'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Send, ShieldCheck, X } from 'lucide-react';
import { DURATION_OPTIONS, SOURCING_AREAS } from '@/lib/sourcing';

interface Category {
  id: string;
  name: string;
}

const INPUT_CLASS =
  'h-11 w-full rounded-xl border px-3.5 text-sm outline-none focus:border-orange-400';
const LABEL_CLASS = 'mb-1.5 block text-xs font-bold text-slate-600';

export function SourcingPostDialog({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [province, setProvince] = useState('');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const hasDraft = title !== '' || content !== '';

  // Bấm nút: chưa đăng nhập thì chỉ hiện thông báo, không mở popup
  async function handleOpen() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('not-logged-in');
    } catch {
      toast('Bạn cần đăng nhập để đăng nhu cầu mua', {
        action: { label: 'Đăng nhập', onClick: () => router.push('/login') },
      });
      return;
    }
    setOpen(true);
  }

  function reset() {
    setTitle('');
    setContent('');
    setCategoryId('');
    setProvince('');
    setDurationDays(30);
    setConfirmed(false);
    setDone(false);
  }

  function close() {
    // Đang gõ dở thì hỏi lại để khỏi mất bài
    if (!done && hasDraft && !window.confirm('Bỏ bài đang soạn?')) return;
    setOpen(false);
    reset();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/sourcing/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          categoryId: categoryId || undefined,
          province: province || undefined,
          durationDays,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setDone(true);
        router.refresh(); // cập nhật danh sách bài ở trang đang xem
      } else {
        toast.error(data.error || 'Đăng bài thất bại');
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
        onClick={handleOpen}
        className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-extrabold text-white shadow-md shadow-orange-500/20"
      >
        + Đăng nhu cầu mua
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
                <b className="block text-sm">Đã gửi bài, đang chờ admin duyệt</b>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bài sẽ hiển thị sau khi được duyệt. Bạn sẽ nhận thông báo khi có kết quả.
                </p>
                <button type="button" onClick={close} className="mt-4 rounded-lg border px-4 py-2 text-xs font-bold">
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <b className="text-lg font-bold text-[#25324a]">Đăng nhu cầu mua</b>
                    <p className="mt-0.5 text-xs text-muted-foreground">Nhà cung cấp sẽ gửi báo giá riêng cho bạn</p>
                  </div>
                  <button type="button" onClick={close} aria-label="Đóng" className="text-muted-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <label className={LABEL_CLASS}>Tiêu đề *</label>
                <input
                  required
                  minLength={10}
                  maxLength={150}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="VD: Cần tìm hạt nhựa ABS chống cháy 5 tấn/tháng"
                />
                <div className="mb-3 mt-1 text-right text-[11px] text-slate-400">{title.length}/150</div>

                <label className={LABEL_CLASS}>Nội dung chi tiết *</label>
                <textarea
                  required
                  minLength={20}
                  maxLength={3000}
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full rounded-xl border p-3.5 text-sm outline-none focus:border-orange-400"
                  placeholder="Mô tả vật tư/thiết bị cần mua, số lượng, tiêu chuẩn, nơi giao hàng..."
                />
                <div className="mb-3 mt-1 text-right text-[11px] text-slate-400">{content.length}/3000</div>

                <div className="mb-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={LABEL_CLASS}>Danh mục</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={INPUT_CLASS}>
                      <option value="">Chưa chọn</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Khu vực</label>
                    <select value={province} onChange={(e) => setProvince(e.target.value)} className={INPUT_CLASS}>
                      <option value="">Toàn quốc</option>
                      {SOURCING_AREAS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className={LABEL_CLASS}>Thời hạn hiển thị (tính từ lúc admin duyệt)</label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className={`${INPUT_CLASS} mb-4`}
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} ngày
                    </option>
                  ))}
                </select>

                <label className="mb-4 flex cursor-pointer items-start gap-2 text-[12px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span>
                    Tôi xác nhận bài không chứa thông tin nhạy cảm hay dữ liệu nội bộ không muốn công khai.
                  </span>
                </label>

                <p className="mb-4 flex gap-2 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  Thông tin liên hệ của bạn không bị công khai. Nhà cung cấp chỉ liên hệ qua hệ thống.
                </p>

                <button
                  type="submit"
                  disabled={sending || !confirmed}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-extrabold text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Đang gửi...' : 'Gửi bài chờ duyệt'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}