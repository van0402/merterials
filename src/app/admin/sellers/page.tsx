'use client';

import { useEffect, useRef, useState } from 'react';
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
import * as XLSX from 'xlsx';

interface Seller {
  id: string;
  companyName: string;
  taxCode: string | null;
  businessType: string | null;
  contactEmail: string | null;
  contactName: string | null;
  phone: string;
  address: string | null;
  description: string | null;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  reviewNotes: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
  categories: { category: { name: string } }[];
  capabilities: { capability: { name: string } }[];
  documents: { type: string; fileUrl: string }[];
}

const TABS: { value: Seller['status']; label: string }[] = [
  { value: 'DRAFT', label: 'Bản nháp' },
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
  DRAFT: 'bg-gray-100 text-gray-500',
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

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Seller['status']>('PENDING');
  const [selected, setSelected] = useState<Seller | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  function load() {
    setLoading(true);
    fetch('/api/admin/sellers')
      .then((res) => res.json())
      .then((data) => data.success && setSellers(data.sellers))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = sellers.filter((s) => s.status === tab);

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


function findValue(row: Record<string, any>, keys: string[]) {
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const match = rowKeys.find((k) => k.toLowerCase().includes(key.toLowerCase()));
    if (match && row[match]) return String(row[match]).trim();
  }
  return '';
}

async function handleImportFile(file: File) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

  const rows = rawRows
    .map((r) => ({
      companyName: findValue(r, ['tên công ty', 'company']),
      contactName: findValue(r, ['người đại diện', 'contact']),
      phone: findValue(r, ['điện thoại', 'phone', 'sđt']),
      country: findValue(r, ['quốc gia', 'country']),
      industryRaw: findValue(r, ['ngành nghề', 'industry']),
    }))
    .filter((r) => r.companyName && r.phone);

  if (rows.length === 0) {
    toast.error('Không tìm thấy dòng hợp lệ nào trong file (thiếu tên công ty hoặc SĐT)');
    return;
  }

  const res = await fetch('/api/admin/suppliers/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  const data = await res.json();
  if (data.success) {
    toast.success(`Đã import ${data.created} công ty vào Bản nháp`);
    setTab('DRAFT');
    load();
  } else {
    toast.error(data.error || 'Import thất bại');
  }
}

async function bulkAction(action: 'publish' | 'delete') {
  if (selectedIds.length === 0) return;
  const res = await fetch('/api/admin/sellers/bulk', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: selectedIds, action }),
  });
  const data = await res.json();
  if (data.success) {
    toast.success(action === 'publish' ? `Đã đăng ${data.updated} công ty` : `Đã xoá ${data.deleted} bản nháp`);
    setSelectedIds([]);
    load();
  } else {
    toast.error(data.error || 'Thao tác thất bại');
  }
}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Duyệt doanh nghiệp</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xét duyệt hồ sơ pháp lý và kích hoạt trạng thái nhà cung cấp.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
        />
        <Button onClick={() => fileInputRef.current?.click()}>Import từ Excel</Button>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map((t) => {
          const count = sellers.filter((s) => s.status === t.value).length;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-bold ${
                tab === t.value ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted-foreground'
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${tab === t.value ? 'bg-orange-50' : 'bg-slate-100'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'DRAFT' && selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border bg-orange-50 px-4 py-2.5">
          <span className="text-sm font-semibold">{selectedIds.length} đã chọn</span>
          <Button size="sm" onClick={() => bulkAction('publish')}>Đăng lên trang</Button>
          <Button size="sm" variant="outline" className="border-red-200 text-red-600" onClick={() => bulkAction('delete')}>Xoá</Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="bg-[#fafafa] text-left">
              {tab === 'DRAFT' && (
                <th className="w-8 border-b px-4 py-3">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={(e) => setSelectedIds(e.target.checked ? filtered.map((s) => s.id) : [])}
                  />
                </th>
              )}
              {['Doanh nghiệp', 'Ngành nghề', 'Mã số thuế', 'Ngày nộp', 'Trạng thái', ''].map((h) => (
                <th key={h} className="border-b px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                {tab === 'DRAFT' && (
                  <td className="border-b px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={(e) =>
                        setSelectedIds((prev) => (e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)))
                      }
                    />
                  </td>
                )}
                <td className="border-b px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-orange-50 text-[10px] font-bold text-orange-600">
                      {s.companyName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <b className="block text-[12px]">{s.companyName}</b>
                      <span className="block text-[10px] text-muted-foreground">
                        {s.businessType ? BUSINESS_TYPE_LABELS[s.businessType] : '—'}
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
        {!loading && filtered.length === 0 && (
          <div className="p-14 text-center text-sm text-muted-foreground">Không có hồ sơ nào trong mục này.</div>
        )}
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
                      {selected.businessType ? BUSINESS_TYPE_LABELS[selected.businessType] : '—'}
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
                {selected.status === 'DRAFT' && (
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      disabled={submitting}
                      onClick={async () => {
                        setSubmitting(true);
                        await fetch('/api/admin/sellers/bulk', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ids: [selected.id], action: 'delete' }),
                        });
                        toast.success('Đã xoá bản nháp');
                        setSelected(null);
                        setSubmitting(false);
                        load();
                      }}
                    >
                      Xoá
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      disabled={submitting}
                      onClick={async () => {
                        setSubmitting(true);
                        await fetch('/api/admin/sellers/bulk', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ids: [selected.id], action: 'publish' }),
                        });
                        toast.success('Đã đăng lên trang');
                        setSelected(null);
                        setSubmitting(false);
                        load();
                      }}
                    >
                      Đăng lên trang
                    </Button>
                  </div>
                )}
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