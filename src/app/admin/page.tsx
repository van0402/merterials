'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Building2,
  BadgeCheck,
  Clock,
  Mail,
  ArrowRight,
  Package,
  Flag,
  AlertTriangle,
} from 'lucide-react';


const METRICS = [
  { icon: Building2, value: '386', label: 'Tổng doanh nghiệp' },
  { icon: BadgeCheck, value: '214', label: 'Supplier đã xác minh' },
  { icon: Clock, value: '12', label: 'Hồ sơ chờ xác minh' },
  { icon: Mail, value: '128', label: 'RFQ / Leads tháng này' },
];

const TODO_ITEMS = [
  { icon: BadgeCheck, title: 'Doanh nghiệp chờ xác minh', desc: 'Hồ sơ pháp lý mới', count: 12 },
  { icon: Package, title: 'Sản phẩm chờ duyệt', desc: 'Sản phẩm mới từ Supplier', count: 15 },
  { icon: Mail, title: 'RFQ cần kiểm tra', desc: 'Thiếu hoặc sai thông tin', count: 8 },
  { icon: Flag, title: 'Báo cáo vi phạm', desc: 'Thông tin doanh nghiệp bị report', count: 3 },
];

const NEW_COMPANIES = [
  { initials: 'AB', name: 'ABC Plastic', type: 'Manufacturer', category: 'Nhựa & Polymer', region: 'Bắc Ninh', status: 'pending', date: '16/09/2026' },
  { initials: 'TK', name: 'TechK Automation', type: 'System Integrator', category: 'Tự động hóa & Robot', region: 'Hà Nội', status: 'verified', date: '15/09/2026' },
  { initials: 'MN', name: 'Minh Nam CNC', type: 'Gia công cơ khí', category: 'Cơ khí chính xác', region: 'Hải Phòng', status: 'pending', date: '15/09/2026' },
  { initials: 'HC', name: 'Horizon Chemical', type: 'Distributor', category: 'Hóa chất', region: 'TP.HCM', status: 'needs_info', date: '14/09/2026' },
];

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  verified: { label: 'Verified', className: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'Chờ duyệt', className: 'bg-amber-50 text-amber-700' },
  needs_info: { label: 'Cần bổ sung', className: 'bg-red-50 text-red-700' },
};

const SEARCH_TERMS = [
  { term: 'gia công CNC Bắc Ninh', count: 182, pct: 100 },
  { term: 'nhựa ABS', count: 140, pct: 77 },
  { term: 'máy ép nhựa', count: 98, pct: 54 },
  { term: 'robot công nghiệp', count: 76, pct: 42 },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold">Tổng quan hệ thống</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Theo dõi hoạt động nhà cung cấp, người dùng và kết nối B2B.
          </p>
        </div>
        <select className="h-10 rounded-lg border bg-white px-3 text-sm">
          <option>30 ngày gần nhất</option>
          <option>7 ngày gần nhất</option>
          <option>90 ngày gần nhất</option>
        </select>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => (
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
              <small className="text-xs text-muted-foreground">Danh sách đăng ký gần đây</small>
            </div>
            <button className="flex items-center gap-1 text-[11px] font-extrabold text-orange-600">
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </button>
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
                {NEW_COMPANIES.map((c) => (
                  <tr key={c.name}>
                    <td className="border-b px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-orange-50 text-[10px] font-bold text-orange-600">
                          {c.initials}
                        </div>
                        <div>
                          <b className="block text-[11px]">{c.name}</b>
                          <span className="block text-[10px] text-muted-foreground">{c.type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="border-b px-4 py-3 text-[11px]">{c.category}</td>
                    <td className="border-b px-4 py-3 text-[11px]">{c.region}</td>
                    <td className="border-b px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${STATUS_STYLE[c.status].className}`}>
                        {STATUS_STYLE[c.status].label}
                      </span>
                    </td>
                    <td className="border-b px-4 py-3 text-[11px]">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h3 className="text-sm font-bold">Search Analytics</h3>
              <small className="text-xs text-muted-foreground">Top nhu cầu tìm kiếm</small>
            </div>
            <button className="text-[11px] font-extrabold text-orange-600">Chi tiết</button>
          </div>
          <div className="px-4 pt-1.5">
            {SEARCH_TERMS.map((s, i) => (
              <div key={s.term} className={`py-3 ${i < SEARCH_TERMS.length - 1 ? 'border-b' : ''}`}>
                <div className="flex items-center justify-between text-[11px]">
                  <b>{s.term}</b>
                  <strong>{s.count}</strong>
                </div>
                <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full bg-orange-500" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="m-4 rounded-xl border border-orange-200 bg-orange-50 p-3.5 text-[10px] leading-relaxed text-orange-900">
            <b className="mb-1 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Search không có kết quả
            </b>
            "PEEK supplier" xuất hiện 42 lần trong tháng này. Có thể cần bổ sung supplier cho nhóm này.
          </div>
        </div>
      </section>
    </div>
  );
}
