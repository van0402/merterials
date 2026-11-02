'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, BadgeCheck, Clock, Mail, ArrowRight, ClipboardCheck } from 'lucide-react';
import { initialsOf } from '@/lib/category-style';

interface Stats {
  counts: {
    total: number;
    approved: number;
    pendingCompanies: number;
    inquiriesThisMonth: number;
    pendingInquiries: number;
    pendingSourcing: number;
  };
  recent: {
    id: string;
    companyName: string;
    businessTypes: string[];
    categoryName: string | null;
    province: string | null;
    status: string;
    createdAt: string;
  }[];
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: 'Nhà sản xuất',
  DISTRIBUTOR: 'Nhà phân phối',
  IMPORTER: 'Nhà nhập khẩu',
  OEM_ODM: 'Gia công (OEM/ODM)',
  SYSTEM_INTEGRATOR: 'Tích hợp hệ thống',
  TECHNICAL_SERVICE: 'Dịch vụ kỹ thuật',
};

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Đã duyệt', className: 'bg-emerald-50 text-emerald-700' },
  PENDING: { label: 'Chờ duyệt', className: 'bg-amber-50 text-amber-700' },
  REJECTED: { label: 'Từ chối', className: 'bg-red-50 text-red-700' },
  SUSPENDED: { label: 'Tạm khóa', className: 'bg-slate-100 text-slate-600' },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => (d.success ? setStats(d) : setFailed(true)))
      .catch(() => setFailed(true));
  }, []);

  const c = stats?.counts;
  const show = (n: number | undefined) => (n == null ? '—' : n.toLocaleString('vi-VN'));

  const metrics = [
    { icon: Building2, value: show(c?.total), label: 'Tổng doanh nghiệp' },
    { icon: BadgeCheck, value: show(c?.approved), label: 'Nhà cung cấp đã duyệt' },
    { icon: Clock, value: show(c?.pendingCompanies), label: 'Hồ sơ chờ duyệt' },
    { icon: Mail, value: show(c?.inquiriesThisMonth), label: 'Yêu cầu báo giá tháng này' },
  ];

  const todos = [
    { icon: BadgeCheck, title: 'Hồ sơ doanh nghiệp chờ duyệt', href: '/admin/sellers', count: c?.pendingCompanies },
    { icon: ClipboardCheck, title: 'Bài "Cần mua" chờ duyệt', href: '/admin/sourcing', count: c?.pendingSourcing },
    { icon: Mail, title: 'Yêu cầu báo giá chưa xử lý', href: '/admin/inquiries', count: c?.pendingInquiries },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[28px] font-bold">Tổng quan hệ thống</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Theo dõi hoạt động nhà cung cấp, người dùng và kết nối B2B.
        </p>
      </div>

      {failed && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Không tải được số liệu. Thử tải lại trang.
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border bg-white p-[18px] shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <m.icon className="h-5 w-5" />
            </div>
            <strong className="mt-4 block text-[27px] leading-none">{m.value}</strong>
            <span className="mt-1 block text-[11px] text-muted-foreground">{m.label}</span>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h3 className="text-sm font-bold">Doanh nghiệp mới</h3>
              <small className="text-xs text-muted-foreground">5 hồ sơ đăng ký gần nhất</small>
            </div>
            <Link href="/admin/companies" className="flex items-center gap-1 text-[11px] font-extrabold text-orange-600">
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="bg-[#fafafa] text-left">
                  {['Doanh nghiệp', 'Ngành', 'Khu vực', 'Trạng thái', 'Ngày'].map((h) => (
                    <th key={h} className="border-b px-4 py-3 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats?.recent.map((row) => {
                  const st = STATUS_STYLE[row.status] ?? STATUS_STYLE.PENDING;
                  return (
                    <tr key={row.id}>
                      <td className="border-b px-4 py-3">
                        <Link href={`/admin/companies/${row.id}/edit`} className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-orange-50 text-[10px] font-bold text-orange-600">
                            {initialsOf(row.companyName)}
                          </div>
                          <div>
                            <b className="block text-[11px]">{row.companyName}</b>
                            <span className="block text-[10px] text-muted-foreground">
                              {row.businessTypes.map((bt) => BUSINESS_TYPE_LABELS[bt] ?? bt).join(', ') || '—'}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="border-b px-4 py-3 text-[11px]">{row.categoryName ?? '—'}</td>
                      <td className="border-b px-4 py-3 text-[11px]">{row.province ?? '—'}</td>
                      <td className="border-b px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${st.className}`}>{st.label}</span>
                      </td>
                      <td className="border-b px-4 py-3 text-[11px]">
                        {new Date(row.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  );
                })}
                {stats && stats.recent.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      Chưa có doanh nghiệp nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-4">
            <h3 className="text-sm font-bold">Việc cần xử lý</h3>
            <small className="text-xs text-muted-foreground">Bấm để mở trang duyệt</small>
          </div>
          <div className="p-2">
            {todos.map((t) => (
              <Link
                key={t.title}
                href={t.href}
                className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-orange-50/60"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <t.icon className="h-4 w-4" />
                </div>
                <span className="flex-1 text-[12px] font-semibold">{t.title}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    t.count ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {show(t.count)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}