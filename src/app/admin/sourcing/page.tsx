'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AdminPagination } from '@/components/admin/pagination';

type PostStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';

interface PostRow {
  id: string;
  title: string;
  content: string;
  province: string | null;
  durationDays: number;
  status: PostStatus;
  rejectReason: string | null;
  expiresAt: string | null;
  createdAt: string;
  user: { name: string; email: string };
  category: { name: string } | null;
  _count: { quotes: number };
}

const STATUS_LABEL: Record<PostStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CLOSED: 'Đã đóng',
};
const STATUS_STYLE: Record<PostStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  CLOSED: 'bg-slate-100 text-slate-600',
};
const TABS = [
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'CLOSED', label: 'Đã đóng' },
  { value: '', label: 'Tất cả' },
];
const PAGE_SIZE = 20;

export default function AdminSourcingPage() {
  const [rows, setRows] = useState<PostRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pending, setPending] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('PENDING'); // mặc định mở tab "Chờ duyệt"
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null); // đang nhập lý do từ chối bài nào
  const [busyId, setBusyId] = useState<string | null>(null); // bài đang xử lý (khoá nút)

  function load() {
    setLoading(true);
    fetch(`/api/admin/sourcing?page=${page}&pageSize=${PAGE_SIZE}&status=${status}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        setRows(data.posts);
        setTotal(data.total);
        setPending(data.pending);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [page, status]);

  async function review(id: string, body: { action: 'approve' } | { action: 'reject'; reason: string }) {
    setBusyId(id);
    const res = await fetch(`/api/admin/sourcing/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusyId(null);

    if (data.success) {
      toast.success(body.action === 'approve' ? 'Đã duyệt bài' : 'Đã từ chối bài');
      setRejecting(null);
      load(); // tải lại danh sách
    } else {
      toast.error(data.error || 'Thao tác thất bại');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">
          Duyệt bài "Cần mua"{' '}
          <span className="ml-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] text-orange-600">
            {pending} chờ duyệt
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bài chỉ hiển thị công khai sau khi được duyệt. Hạn bài tính từ lúc duyệt.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => {
              setStatus(t.value);
              setPage(1); // đổi tab thì về trang 1
              setRejecting(null);
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
        {rows.map((p) => {
          const expired = p.status === 'APPROVED' && p.expiresAt && new Date(p.expiresAt) < new Date();
          return (
            <div key={p.id} className="rounded-2xl border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <b className="text-[15px] font-black">{p.title}</b>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${STATUS_STYLE[p.status]}`}>
                  {expired ? 'Đã hết hạn' : STATUS_LABEL[p.status]}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                <span>Người đăng: {p.user.name} ({p.user.email})</span>
                {p.category && <span>Danh mục: {p.category.name}</span>}
                {p.province && <span>Khu vực: {p.province}</span>}
                <span>Hạn: {p.durationDays} ngày</span>
                <span>{new Date(p.createdAt).toLocaleString('vi-VN')}</span>
              </div>

              {/* Admin xem TOÀN BỘ nội dung trước khi duyệt */}
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-[13px] text-slate-700">{p.content}</p>

              {p.status === 'APPROVED' && p.expiresAt && (
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Hết hạn: {new Date(p.expiresAt).toLocaleDateString('vi-VN')} · {p._count.quotes} báo giá
                </p>
              )}
              {p.status === 'REJECTED' && p.rejectReason && (
                <p className="mt-2 text-[12px] text-red-600">Lý do từ chối: {p.rejectReason}</p>
              )}

              {p.status === 'PENDING' && (
                <div className="mt-3">
                  {rejecting?.id === p.id ? (
                    <div className="space-y-2">
                      <textarea
                        autoFocus
                        value={rejecting.reason}
                        onChange={(e) => setRejecting({ id: p.id, reason: e.target.value })}
                        rows={2}
                        placeholder="Lý do từ chối (người đăng sẽ thấy)"
                        className="w-full rounded-lg border p-2.5 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600"
                          disabled={busyId === p.id}
                          onClick={() => review(p.id, { action: 'reject', reason: rejecting.reason })}
                        >
                          Xác nhận từ chối
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejecting(null)}>
                          Huỷ
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" disabled={busyId === p.id} onClick={() => review(p.id, { action: 'approve' })}>
                        Duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600"
                        onClick={() => setRejecting({ id: p.id, reason: '' })}
                      >
                        Từ chối
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!loading && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Không có bài nào ở mục này.
          </div>
        )}
      </div>

      <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}