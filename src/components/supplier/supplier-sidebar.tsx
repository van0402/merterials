'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: 'Nhà sản xuất',
  DISTRIBUTOR: 'Nhà phân phối',
  IMPORTER: 'Nhà nhập khẩu',
  OEM_ODM: 'Đơn vị gia công (OEM/ODM)',
  SYSTEM_INTEGRATOR: 'Tích hợp hệ thống',
  TECHNICAL_SERVICE: 'Dịch vụ kỹ thuật',
};

const STATUS_CHIP: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Chờ xác minh', className: 'bg-[rgba(191,115,0,.15)] text-[#e0a13a]' },
  APPROVED: { label: 'Đã xác minh', className: 'bg-[rgba(19,180,110,.12)] text-[#0b9a5b]' },
  REJECTED: { label: 'Bị từ chối', className: 'bg-[rgba(220,38,38,.15)] text-[#f26565]' },
  SUSPENDED: { label: 'Tạm khoá', className: 'bg-[rgba(120,139,161,.15)] text-[#8fa0b5]' },
};

interface NavItem {
  label: string;
  href?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  { title: 'Tổng quan', items: [{ label: 'Dashboard', href: '/supplier/dashboard' }] },
  { title: 'Doanh nghiệp', items: [{ label: 'Hồ sơ doanh nghiệp', href: '/supplier/dashboard/profile' }] },
  { title: 'Sản phẩm', items: [{ label: 'Sản phẩm của tôi', href: '/supplier/dashboard/products' }] },
    { title: 'Khách hàng', items: [{ label: 'Yêu cầu báo giá', href: '/supplier/dashboard/inquiries' }] },
  { title: 'Tài khoản', items: [{ label: 'Thông báo' }, { label: 'Cài đặt' }] },
];

interface SupplierSidebarProps {
  companyName: string;
  businessTypes: string[];
  province: string | null;
  status: string;
}

export function SupplierSidebar({ companyName, businessTypes, province, status }: SupplierSidebarProps) {
  const pathname = usePathname();
  const statusChip = STATUS_CHIP[status] ?? STATUS_CHIP.PENDING;

  return (
       <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto bg-[#0f1b2d] px-3 py-5 text-[#e2e8f0] lg:flex">
      <div className="flex items-center gap-3 border-b border-[#1f3047] px-2 pb-5">
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-white text-[11px] font-black text-orange-500">
          SMEE
        </div>
        <div>
          <b className="block text-sm text-[#f7f9fb]">Supply Merterial</b>
          <small className="text-[#8fa0b5]">Supplier Center</small>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#1f3047] bg-[#13233a] p-3.5">
        <b className="text-xs text-[#f7f9fb]">{companyName}</b>
        <span className="mt-1 block text-[10px] text-[#8fa0b5]">
          {businessTypes.length > 0 ? businessTypes.map((bt) => BUSINESS_TYPE_LABELS[bt]).join(', ') : 'Doanh nghiệp'}
          {province ? ` • ${province}` : ''}
        </span>
        <span className={`mt-2 inline-block rounded-full px-2 py-1 text-[9px] font-bold ${statusChip.className}`}>
          ● {statusChip.label}
        </span>
      </div>

      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="mt-5">
          <div className="px-2.5 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#788ba1]">
            {group.title}
          </div>
          {group.items.map((item) => {
            const active = item.href ? pathname === item.href : false;
            const className = `mb-1 flex items-center justify-between rounded-[11px] px-2.5 py-2.5 text-[13px] font-semibold transition-colors ${
              active ? 'bg-[#ff6b00] text-white' : 'text-[#e2e8f0] hover:bg-[#182a44] hover:text-[#f7f9fb]'
            }`;
            if (item.href) {
              return (
                <Link key={item.label} href={item.href} className={className}>
                  {item.label}
                </Link>
              );
            }
            return (
              <div key={item.label} className={className}>
                {item.label}
                <span className="text-[9px] font-bold uppercase text-[#5a6b80]">Sắp có</span>
              </div>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
