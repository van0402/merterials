'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Send, ShieldCheck, X } from 'lucide-react';
import { CompanyAvatar } from '@/components/site/company-avatar';

interface RfqModalProps {
  supplierProfileId: string;
  supplierName: string;
  materialId?: string;
  title?: string;
  buttonLabel?: string;
  buttonClassName?: string;
  verified?: boolean;
}

const DEFAULT_BUTTON_CLASS =
  'select-none rounded-lg bg-orange-500 px-3 py-2 text-[12px] font-extrabold text-white';
const INPUT_CLASS =
  'mb-3 h-11 w-full rounded-xl border px-3.5 text-sm outline-none focus:border-orange-400';

export function RfqModal({
  supplierProfileId,
  supplierName,
  materialId,
  title = 'Yêu cầu báo giá',
  buttonLabel = 'Yêu cầu báo giá',
  buttonClassName = DEFAULT_BUTTON_CLASS,
  verified = false,
}: RfqModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  async function handleSubmit(e: React.FormEvent) { 
    e.preventDefault();
    setSending(true);
      setError('');
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierProfileId,
          materialId,
          message,
          guestName: name || undefined,
          guestPhone: phone || undefined,
          guestEmail: email || undefined,
        }),
      });
            const data = await res.json();
      if (data.success) {
        setDone(true);
        toast.success('Đã gửi yêu cầu');
      } else {
        setError(data.error || 'Gửi thất bại');
      }
    } catch {
      setError('Không thể kết nối máy chủ');
    } finally {
      setSending(false);
    }
  }

  function close() {
    setOpen(false);
    setDone(false);
    setName('');
    setPhone('');
    setEmail('');
    setMessage('');
    setError('');
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClassName}>
        {buttonLabel}
      </button>

      {/* Vẽ popup ra document.body để không bị nhốt trong tầng xếp chồng của thẻ cha */}
      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={close}>
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  ✓
                </div>
                <b className="block text-sm">Đã gửi yêu cầu tới {supplierName}</b>
                <p className="mt-1 text-xs text-muted-foreground">Nhà cung cấp sẽ liên hệ lại sớm nhất có thể.</p>
                <button type="button" onClick={close} className="mt-4 rounded-lg border px-4 py-2 text-xs font-bold">
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <b className="text-lg font-black">{title}</b>
                    <p className="mt-0.5 text-xs text-muted-foreground">Gửi yêu cầu trực tiếp đến doanh nghiệp</p>
                  </div>
                  <button type="button" onClick={close} aria-label="Đóng" className="text-muted-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <CompanyAvatar name={supplierName} size={40} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{supplierName}</div>
                    {verified && <div className="text-[11px] font-semibold text-emerald-700">✓ Nhà cung cấp đã xác minh</div>}
                  </div>
                </div>
                 {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <label className="mb-1.5 block text-xs font-bold text-slate-600">Họ và tên *</label>
                <input required maxLength={150} value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} placeholder="Nhập họ và tên" />

                <label className="mb-1.5 block text-xs font-bold text-slate-600">Số điện thoại *</label>
                <input required maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT_CLASS} placeholder="Nhập số điện thoại" />

                <label className="mb-1.5 block text-xs font-bold text-slate-600">Email (không bắt buộc)</label>
                <input type="email" maxLength={150} value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLASS} placeholder="example@company.com" />

                <label className="mb-1.5 block text-xs font-bold text-slate-600">Nội dung yêu cầu *</label>
                <textarea
                  required
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="mb-1 w-full rounded-xl border p-3.5 text-sm outline-none focus:border-orange-400"
                  placeholder="Mô tả sản phẩm cần tìm, số lượng, thời gian cần hàng..."
                />
                <p className="mb-3 text-right text-[11px] text-muted-foreground">{message.length}/2000 ký tự</p>

                <p className="mb-4 flex gap-2 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  Thông tin của bạn sẽ được gửi tới nhà cung cấp để liên hệ lại.
                </p>

                <button
                  type="submit"
                  disabled={sending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}