'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AdminPagination } from '@/components/admin/pagination';

interface Seller {
  id: string;
  companyName: string;
  taxCode: string | null;
  businessTypes: string[];
  contactEmail: string | null;
  contactName: string | null;
  phone: string;
  address: string | null;
  description: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  reviewNotes: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
  categories: { category: { name: string } }[];
  capabilities: { capability: { name: string } }[];
  documents: { type: string; fileUrl: string }[];
}

const TABS: { value: Seller['status']; label: string }[] = [
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'SUSPENDED', label: 'Tạm khoá' },
];

const STATUS_STYLE: Record<Seller['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  SUSPENDED: 'bg-slate-100 text-slate-600',
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: 'Nhà sản xuất',
  DISTRIBUTOR: 'Nhà phân phối',
  IMPORTER: 'Nhà nhập khẩu',
  OEM_ODM: 'Đơn vị gia công (OEM/ODM)',
  SYSTEM_INTEGRATOR: 'Tích hợp hệ thống',
  TECHNICAL_SERVICE: 'Dịch vụ kỹ thuật',
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: 'Giấy đăng ký kinh doanh',
  QUALITY_CERT: 'Chứng nhận chất lượng',
  OTHER: 'Hồ sơ khác',
};

const PAGE_SIZE = 20;

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<Seller['status'], number>>({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    SUSPENDED: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Seller['status']>('PENDING');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Seller | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/admin/sellers?status=${tab}&page=${page}&pageSize=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        setSellers(data.sellers);
        setTotal(data.total);
        setCounts(data.counts);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [tab, page]);

  function openDetail(seller: Seller) {
    setSelected(seller);
    setNotes(seller.reviewNotes ?? '');
  }

  const STATUS_MESSAGES: Record<'APPROVED' | 'REJECTED' | 'SUSPENDED', string> = {
    APPROVED: 'Đã duyệt doanh nghiệp',
    REJECTED: 'Đã từ chối hồ sơ',
    SUSPENDED: 'Đã tạm khoá doanh nghiệp',
  };

  async function review(status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') {
    if (!selected) return;
    const companyName = selected.companyName;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/sellers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, status, reviewNotes: notes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${STATUS_MESSAGES[status]}: ${companyName}`);
        setSelected(null);
        load();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch {
      toast.error('Không thể kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Duyệt doanh nghiệp</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Xét duyệt hồ sơ pháp lý và kích hoạt trạng thái nhà cung cấp tự đăng ký.
        </p>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setTab(t.value);
              setPage(1);
            }}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-bold ${
              tab === t.value ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted-foreground'
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${tab === t.value ? 'bg-orange-50' : 'bg-slate-100'}`}>
              {counts[t.value]}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="bg-[#fafafa] text-left">
              {['Doanh nghiệp', 'Ngành nghề', 'Mã số thuế', 'Ngày nộp', 'Trạng thái', ''].map((h) => (
                <th key={h} className="border-b px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id}>
                <td className="border-b px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-orange-50 text-[10px] font-bold text-orange-600">
                      {s.companyName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <b className="block text-[12px]">{s.companyName}</b>
                      <span className="block text-[10px] text-muted-foreground">
                        {s.businessTypes.length > 0 ? s.businessTypes.map((bt) => BUSINESS_TYPE_LABELS[bt]).join(', ') : '—'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="border-b px-4 py-3 text-[12px]">
                  {s.categories.map((c) => c.category.name).join(', ') || '—'}
                </td>
                <td className="border-b px-4 py-3 text-[12px]">{s.taxCode || '—'}</td>
                <td className="border-b px-4 py-3 text-[12px]">
                  {new Date(s.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="border-b px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${STATUS_STYLE[s.status]}`}>
                    {TABS.find((t) => t.value === s.status)?.label}
                  </span>
                </td>
                <td className="border-b px-4 py-3">
                  <button onClick={() => openDetail(s)} className="text-[11px] font-extrabold text-orange-600">
                    Xem chi tiết →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && sellers.length === 0 && (
          <div className="p-14 text-center text-sm text-muted-foreground">Không có hồ sơ nào trong mục này.</div>
        )}
        <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-[480px]">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.companyName}</SheetTitle>
                <SheetDescription>
                  Mã số thuế: {selected.taxCode || '—'} · Nộp ngày {new Date(selected.createdAt).toLocaleDateString('vi-VN')}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Thông tin doanh nghiệp</p>
                  <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                    <div>
                      <span className="block text-[10px] text-muted-foreground">Loại hình</span>
                      {selected.businessTypes.length > 0 ? selected.businessTypes.map((bt) => BUSINESS_TYPE_LABELS[bt]).join(', ') : '—'}
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground">Người đăng ký / liên hệ</span>
                      {selected.user?.name || selected.contactName || '—'}
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground">Email liên hệ</span>
                      {selected.user?.email || selected.contactEmail || '—'}
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground">Điện thoại</span>
                      {selected.phone}
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] text-muted-foreground">Địa chỉ</span>
                      {selected.address || '—'}
                    </div>
                    {selected.description && (
                      <div className="col-span-2">
                        <span className="block text-[10px] text-muted-foreground">Giới thiệu</span>
                        <span className="text-slate-600">{selected.description}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Ngành nghề & năng lực</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.categories.map((c) => (
                      <span key={c.category.name} className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                        {c.category.name}
                      </span>
                    ))}
                    {selected.capabilities.map((c) => (
                      <span key={c.capability.name} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                        {c.capability.name}
                      </span>
                    ))}
                    {selected.categories.length === 0 && selected.capabilities.length === 0 && (
                      <span className="text-[11px] text-muted-foreground">Chưa chọn</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Hồ sơ đã nộp</p>
                  {selected.documents.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">Chưa nộp giấy tờ nào</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.documents.map((d) => (
                        <div key={d.fileUrl} className="flex items-center justify-between rounded-xl border p-2.5 text-[12px]">
                          <span>{DOCUMENT_TYPE_LABELS[d.type] ?? d.type}</span>
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-orange-600">
                            Xem file →
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Ghi chú duyệt (bắt buộc nếu từ chối)
                  </Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Lý do từ chối / yêu cầu bổ sung..." />
                </div>
              </div>

              <SheetFooter className="mt-6">
                {selected.status === 'PENDING' && (
                  <div className="flex w-full gap-2">
                    <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" disabled={submitting} onClick={() => review('REJECTED')}>
                      Từ chối
                    </Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={submitting} onClick={() => review('APPROVED')}>
                      Duyệt
                    </Button>
                  </div>
                )}
                {selected.status === 'APPROVED' && (
                  <Button variant="outline" className="w-full" disabled={submitting} onClick={() => review('SUSPENDED')}>
                    Tạm khoá
                  </Button>
                )}
                {(selected.status === 'REJECTED' || selected.status === 'SUSPENDED') && (
                  <p className="w-full text-center text-[11px] text-muted-foreground">Hồ sơ đã xử lý, không còn hành động khả dụng</p>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}