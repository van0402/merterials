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
import { AdminPagination } from '@/components/admin/pagination';
import Link from 'next/link';
import { toast } from 'sonner';
interface Company {
  id: string;
  companyName: string;
  taxCode: string | null;
  businessTypes: string[];
  contactEmail: string | null;
  contactName: string | null;
  phone: string;
  address: string | null;
  country: string;
  industryRaw: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  createdAt: string;
  user: { name: string; email: string } | null;
  categories: { category: { name: string } }[];
}

const STATUS_STYLE: Record<Company['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  SUSPENDED: 'bg-slate-100 text-slate-600',
};

const STATUS_LABEL: Record<Company['status'], string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  SUSPENDED: 'Tạm khoá',
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: 'Nhà sản xuất',
  DISTRIBUTOR: 'Nhà phân phối',
  IMPORTER: 'Nhà nhập khẩu',
  OEM_ODM: 'Đơn vị gia công (OEM/ODM)',
  SYSTEM_INTEGRATOR: 'Tích hợp hệ thống',
  TECHNICAL_SERVICE: 'Dịch vụ kỹ thuật',
};

const PAGE_SIZE = 20;

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Company | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/companies?page=${page}&pageSize=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        setCompanies(data.companies);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

    async function handleDelete(id: string, companyName: string) {
    const confirmed = confirm(
      `Xoá hẳn "${companyName}" khỏi hệ thống?\n\nToàn bộ sản phẩm, tài liệu, ngành nghề của công ty này cũng sẽ bị xoá theo. KHÔNG THỂ HOÀN TÁC.`,
    );
    if (!confirmed) return;

    const res = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success(`Đã xoá "${companyName}"`);
      setSelected(null);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => prev - 1);
    } else {
      toast.error(data.error || 'Xoá thất bại');
    }
  }

  async function handleBulkDelete() {
    const confirmed = confirm(
      `Xoá hẳn ${selectedIds.length} doanh nghiệp đã chọn khỏi hệ thống?\n\nToàn bộ sản phẩm, tài liệu, ngành nghề của các công ty này cũng sẽ bị xoá theo. KHÔNG THỂ HOÀN TÁC.`,
    );
    if (!confirmed) return;

    const res = await fetch('/api/admin/companies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Đã xoá ${data.deleted} doanh nghiệp`);
      setCompanies((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      setTotal((prev) => prev - data.deleted);
      setSelectedIds([]);
    } else {
      toast.error(data.error || 'Xoá thất bại');
    }
  }
  
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Quản lý thành viên</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Toàn bộ doanh nghiệp đang hiển thị trên trang, gồm cả tự đăng ký và admin nhập.
        </p>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
          <span className="text-sm font-semibold">{selectedIds.length} đã chọn</span>
          <button
            onClick={handleBulkDelete}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
          >
            Xoá đã chọn
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="bg-[#fafafa] text-left">
              <th className="w-8 border-b px-4 py-3">
                <input
                  type="checkbox"
                  checked={companies.length > 0 && selectedIds.length === companies.length}
                  onChange={(e) => setSelectedIds(e.target.checked ? companies.map((c) => c.id) : [])}
                />
              </th>
              {['Doanh nghiệp', 'Nguồn', 'Ngành nghề', 'Trạng thái', 'Ngày tạo', ''].map((h) => (
                <th key={h} className="border-b px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td className="border-b px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={(e) =>
                      setSelectedIds((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)))
                    }
                  />
                </td>
                <td className="border-b px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-orange-50 text-[10px] font-bold text-orange-600">
                      {c.companyName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <b className="block text-[12px]">{c.companyName}</b>
                      <span className="block text-[10px] text-muted-foreground">{c.country}</span>
                    </div>
                  </div>
                </td>
                <td className="border-b px-4 py-3 text-[12px]">
                  {c.user ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">Tự đăng ký</span>
                  ) : (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">Admin nhập</span>
                  )}
                </td>
                <td className="border-b px-4 py-3 text-[12px]">
                  {c.categories.map((cat) => cat.category.name).join(', ') || c.industryRaw || '—'}
                </td>
                <td className="border-b px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${STATUS_STYLE[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </td>
                <td className="border-b px-4 py-3 text-[12px]">
                  {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="border-b px-4 py-3">
                  <button onClick={() => setSelected(c)} className="text-[11px] font-extrabold text-orange-600">
                    Xem chi tiết →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && companies.length === 0 && (
          <div className="p-14 text-center text-sm text-muted-foreground">Chưa có doanh nghiệp nào.</div>
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
                  Mã số thuế: {selected.taxCode || '—'} · Tạo ngày {new Date(selected.createdAt).toLocaleDateString('vi-VN')}
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
                      <span className="block text-[10px] text-muted-foreground">Người đại diện</span>
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
                    <div>
                      <span className="block text-[10px] text-muted-foreground">Quốc gia</span>
                      {selected.country}
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] text-muted-foreground">Địa chỉ</span>
                      {selected.address || '—'}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Ngành nghề</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.categories.map((cat) => (
                      <span key={cat.category.name} className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                        {cat.category.name}
                      </span>
                    ))}
                    {selected.categories.length === 0 && (
                      <span className="text-[11px] text-muted-foreground">{selected.industryRaw || 'Chưa phân loại'}</span>
                    )}
                  </div>
                </div>
              </div>

                            <SheetFooter className="mt-6 flex-col gap-2 sm:flex-col">
                <Link href={`/admin/companies/${selected.id}/edit`} className="w-full">
                  <button className="w-full rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-[12px] font-bold text-orange-700 hover:bg-orange-100">
                    Chỉnh sửa thông tin doanh nghiệp
                  </button>
                </Link>
                <button
                  onClick={() => handleDelete(selected.id, selected.companyName)}
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-bold text-red-700 hover:bg-red-100"
                >
                  Xoá doanh nghiệp
                </button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
