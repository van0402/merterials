'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Building2,
  BadgeCheck,
  Package,
  Wrench,
  LayoutGrid,
  MapPin,
  Users,
  Mail,
  Flag,
  Home,
  Search,
  BarChart3,
  ScrollText,
  Settings,
  UsersRound,
  Headphones,
  KeyRound,
  Activity,
  LogOut,
  ChevronDown,
  Database,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Tổng quan',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, href: '/admin' }],
  },
  {
    title: 'Doanh nghiệp',
    items: [
      { label: 'Doanh nghiệp', icon: Building2,href: '/admin/suppliers', badge: 12 },
      { label: 'Xác minh Supplier', icon: BadgeCheck, href: '/admin/sellers', badge: 12 },
      { label: 'Sản phẩm', icon: Package },
      { label: 'Năng lực', icon: Wrench },
    ],
  },
  {
    title: 'Danh mục',
    items: [
      { label: 'Ngành nghề', icon: LayoutGrid },
      { label: 'Khu vực', icon: MapPin },
    ],
  },
  {
    title: 'Người dùng & Đội ngũ',
    items: [
      { label: 'Thành viên nội bộ', icon: UsersRound, href: '/admin/team' },
      { label: 'Hỗ trợ', icon: Headphones, href: '/admin/support' },
      { label: 'RFQ / Leads', icon: Mail, badge: 8 },
      { label: 'Báo cáo vi phạm', icon: Flag },
    ],
  },
  {
    title: 'Nội dung & Phân tích',
    items: [
      { label: 'Trang chủ', icon: Home },
      { label: 'Search Analytics', icon: Search },
      { label: 'Báo cáo', icon: BarChart3 },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { label: 'Audit Logs', icon: ScrollText },
      { label: 'Email', icon: Mail, href: '/admin/emails' },
      { label: 'API Keys', icon: KeyRound, href: '/admin/api-keys' },
      { label: 'API Analytics', icon: Activity, href: '/admin/api-analytics' },
      { label: 'Cài đặt', icon: Settings, href: '/admin/settings' },
    ],
  },
];

function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <aside className="sticky top-0 hidden h-screen w-[255px] shrink-0 overflow-y-auto bg-[#111827] px-3 py-5 text-slate-300 lg:block">
      <div className="flex items-center gap-3 border-b border-[#253043] px-2 pb-5">
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] bg-white text-[11px] font-black text-orange-500">
          SMEE
        </div>
        <div>
          <b className="block text-sm text-white">Supply Merterial</b>
          <small className="text-slate-400">Admin Control Center</small>
        </div>
      </div>

      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="mt-5">
          <div className="px-2.5 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
            {group.title}
          </div>
          {group.items.map((item) => {
            const active = item.href ? isActive(item.href) : false;
            const disabled = !item.href;
            return (
              <button
                key={item.label}
                type="button"
                disabled={disabled}
                onClick={() => item.href && router.push(item.href)}
                className={`mb-1 flex w-full items-center gap-2.5 rounded-[11px] px-2.5 py-2.5 text-left text-[13px] font-semibold transition ${
                  active
                    ? 'bg-orange-600/90 text-white shadow-[inset_3px_0_0_#fb923c]'
                    : disabled
                      ? 'cursor-default text-slate-600'
                      : 'text-slate-300 hover:bg-[#1f2937] hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge != null && (
                  <span className="rounded-full bg-[#3a2418] px-1.5 py-0.5 text-[10px] font-bold text-orange-300">
                    {item.badge}
                  </span>
                )}
                {disabled && (
                  <span className="text-[9px] font-bold uppercase text-slate-700">Sắp có</span>
                )}
              </button>
            );
          })}
        </div>
      ))}

      <div className="mt-6 rounded-[14px] border border-[#293548] p-3.5 text-[11px] text-slate-400">
        <div className="mb-1.5 flex items-center gap-1.5 font-bold text-white">
          <Database className="h-3.5 w-3.5" />
          MinIO Storage
        </div>
        62.4 GB / 200 GB đã sử dụng
        <br />
        Trạng thái: Hoạt động
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Đang tải bảng điều khiển...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold">Không có quyền truy cập</h1>
          <p className="text-sm text-muted-foreground">Bạn cần quyền quản trị viên để truy cập trang này</p>
          <Button asChild>
            <a href="/login">Đến trang đăng nhập</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f7f8fa]">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-[70px] items-center justify-between border-b bg-white px-6">
          <div className="relative w-full max-w-[420px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Tìm doanh nghiệp, user, sản phẩm..."
              className="h-[42px] w-full rounded-xl border bg-[#fafafa] pl-10 pr-3 text-sm outline-none focus:border-orange-300 focus:bg-white"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex shrink-0 items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-muted/50">
                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-orange-50 font-bold text-orange-600">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <b className="block text-xs">{user.name}</b>
                  <span className="block text-[11px] text-muted-foreground">Super Admin</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => (window.location.href = '/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Cài đặt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
