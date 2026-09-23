'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface RfqModalProps {
  supplierProfileId: string;
  supplierName: string;
  materialId?: string;
}

export function RfqModal({ supplierProfileId, supplierName, materialId }: RfqModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
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
        toast.success('Đã gửi yêu cầu báo giá');
      } else {
        toast.error(data.error || 'Gửi thất bại');
      }
    } catch {
      toast.error('Không thể kết nối máy chủ');
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
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-orange-500 px-3 py-2 text-[12px] font-extrabold text-white"
      >
        Yêu cầu báo giá
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={close}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">✓</div>
                <b className="block text-sm">Đã gửi yêu cầu tới {supplierName}</b>
                <p className="mt-1 text-xs text-muted-foreground">Nhà cung cấp sẽ liên hệ lại sớm nhất có thể.</p>
                <button type="button" onClick={close} className="mt-4 rounded-lg border px-4 py-2 text-xs font-bold">
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-3 flex items-center justify-between">
                  <b className="text-[15px] font-black">Yêu cầu báo giá</b>
                  <button type="button" onClick={close} className="text-lg leading-none text-muted-foreground">×</button>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">Gửi tới {supplierName}</p>

                <label className="mb-2 block text-xs font-bold text-slate-600">Họ tên</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="mb-3 h-10 w-full rounded-lg border px-3 text-sm" placeholder="Nguyễn Văn A" />

                <label className="mb-2 block text-xs font-bold text-slate-600">Số điện thoại</label>
                <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="mb-3 h-10 w-full rounded-lg border px-3 text-sm" placeholder="09xx xxx xxx" />

                <label className="mb-2 block text-xs font-bold text-slate-600">Email (không bắt buộc)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-3 h-10 w-full rounded-lg border px-3 text-sm" placeholder="ban@congty.com" />

                <label className="mb-2 block text-xs font-bold text-slate-600">Nội dung cần báo giá</label>
                <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="mb-4 w-full rounded-lg border p-3 text-sm" placeholder="VD: Cần 500 tấm MDF chống ẩm 18mm, giao trong tháng này" />

                <button type="submit" disabled={sending} className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-extrabold text-white">
                  {sending ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}