'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AdminPagination } from '@/components/admin/pagination';

type InquiryStatus = 'PENDING' | 'RESPONDED' | 'CLOSED';

interface InquiryRow {
  id: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  user: { name: string | null; email: string } | null; // có nếu người gửi đã đăng nhập
  material: { name: string } | null; // có nếu gửi từ 1 sản phẩm
  supplierProfile: {
    id: string;
    companyName: string;
    contactEmail: string | null;
    phone: string;
    userId: string | null; // null = công ty chưa có tài khoản chủ
  };
}

const STATUS_LABEL: Record<InquiryStatus, string> = {
  PENDING: 'Chờ xử lý',
  RESPONDED: 'Đã trả lời',
  CLOSED: 'Đã đóng',
};
const STATUS_STYLE: Record<InquiryStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  RESPONDED: 'bg-blue-50 text-blue-700',
  CLOSED: 'bg-slate-100 text-slate-600',
};
const TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'RESPONDED', label: 'Đã trả lời' },
  { value: 'CLOSED', label: 'Đã đóng' },
];
const PAGE_SIZE = 20;

export default function AdminInquiriesPage() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pending, setPending] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/admin/inquiries?page=${page}&pageSize=${PAGE_SIZE}&status=${status}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        setRows(data.inquiries);
        setTotal(data.total);
        setPending(data.pending);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [page, status]); // đổi trang hoặc đổi tab -> tải lại

  async function changeStatus(id: string, next: InquiryStatus) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r))); // cập nhật ngay trên màn hình
    const res = await fetch('/api/admin/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    });
    const data = await res.json();
    if (!data.success) {
      toast.error('Lưu trạng thái thất bại');
      load(); // lỗi thì tải lại cho đúng dữ liệu thật
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">
          RFQ / Leads{' '}
          <span className="ml-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] text-orange-600">
            {pending} chờ xử lý
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tất cả yêu cầu báo giá khách gửi. Công ty chưa có tài khoản sẽ không tự nhận được, admin liên hệ chuyển tiếp.
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setStatus(t.value);
              setPage(1); // đổi tab thì về trang 1
            }}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-bold ${
              status === t.value ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {rows.map((r) => {
          const sender = r.user ? r.user.name || r.user.email : r.guestName || 'Khách';
          return (
            <div key={r.id} className="rounded-2xl border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <b className="text-[14px] font-black">{sender}</b>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-muted-foreground">
                    {(r.guestPhone) && <span>SĐT: {r.guestPhone}</span>}
                    {(r.guestEmail || r.user?.email) && <span>Email: {r.guestEmail || r.user?.email}</span>}
                    {r.material && <span>Sản phẩm: {r.material.name}</span>}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${STATUS_STYLE[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </div>

              <p className="mt-3 text-[13px] text-slate-700">{r.message}</p>

              {/* Công ty nhận + cách liên hệ để admin chuyển tiếp */}
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-[12px]">
                <span className="text-muted-foreground">Gửi tới: </span>
                <Link href={`/suppliers/${r.supplierProfile.id}`} className="font-bold text-orange-600">
                  {r.supplierProfile.companyName}
                </Link>
                {!r.supplierProfile.userId && (
                  <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    Chưa có tài khoản
                  </span>
                )}
                <div className="mt-1 text-muted-foreground">
                  SĐT công ty: {r.supplierProfile.phone}
                  {r.supplierProfile.contactEmail && <> · Email: {r.supplierProfile.contactEmail}</>}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString('vi-VN')}
                </span>
                <select
                  value={r.status}
                  onChange={(e) => changeStatus(r.id, e.target.value as InquiryStatus)}
                  className="rounded-lg border px-2 py-1 text-[12px]"
                >
                  {(Object.keys(STATUS_LABEL) as InquiryStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}

        {!loading && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Chưa có yêu cầu báo giá nào.
          </div>
        )}
      </div>

      <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}