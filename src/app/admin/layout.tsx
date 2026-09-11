'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand-logo';
import { NotificationBell } from '@/components/notification-bell';
import { LanguageToggle } from '@/components/language-toggle';
import { useI18n } from '@/components/i18n-provider';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Wallet,
  Mail,
  Settings,
  Sliders,
  BarChart3,
  LogOut,
  ChevronsUpDown,
  KeyRound,
  Activity,
  Ticket,
  FolderOpen,
  FileText,
  FileSignature,
  UsersRound,
  Layers,
  Store,
  Headphones,
} from 'lucide-react';

const mainNavItems = [
  { labelKey: 'adminLayout.nav.dashboard', url: '/admin', icon: LayoutDashboard },
  { labelKey: 'adminLayout.nav.partners', url: '/admin/partners', icon: Users },
  { labelKey: 'adminLayout.nav.sellers', url: '/admin/sellers', icon: Store },
  { labelKey: 'adminLayout.nav.contracts', url: '/admin/contracts', icon: FileSignature },
  { labelKey: 'adminLayout.nav.customers', url: '/admin/customers', icon: UserCheck },
  { labelKey: 'adminLayout.nav.payouts', url: '/admin/payouts', icon: Wallet },
  { labelKey: 'adminLayout.nav.invoices', url: '/admin/invoices', icon: FileText },
  { labelKey: 'adminLayout.nav.emails', url: '/admin/emails', icon: Mail },
  { labelKey: 'adminLayout.nav.support', url: '/admin/support', icon: Headphones },
];

const marketingNavItems = [
  { labelKey: 'adminLayout.nav.coupons', url: '/admin/coupons', icon: Ticket },
  { labelKey: 'adminLayout.nav.resources', url: '/admin/resources', icon: FolderOpen },
  { labelKey: 'adminLayout.nav.programs', url: '/admin/programs', icon: Layers },
];

const configNavItems = [
  { labelKey: 'adminLayout.nav.programSettings', url: '/admin/program-settings', icon: Sliders },
  { labelKey: 'adminLayout.nav.team', url: '/admin/team', icon: UsersRound },
  { labelKey: 'adminLayout.nav.settings', url: '/admin/settings', icon: Settings },
  { labelKey: 'adminLayout.nav.reports', url: '/admin/reports', icon: BarChart3 },
  { labelKey: 'adminLayout.nav.apiKeys', url: '/admin/api-keys', icon: KeyRound },
  { labelKey: 'adminLayout.nav.apiAnalytics', url: '/admin/api-analytics', icon: Activity },
];

function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useI18n();

  const isActive = (url: string) => {
    if (url === '/admin') return pathname === '/admin';
    return pathname.startsWith(url);
  };

  return (
    <Sidebar variant="inset" className="border-orange-200/70 bg-white/80 backdrop-blur-2xl">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="m-2 flex items-center gap-3 rounded-3xl border border-orange-200/80 bg-gradient-to-br from-white to-orange-50 p-3 shadow-lg shadow-orange-950/5">
              <BrandLogo className="h-11 w-11 rounded-2xl bg-white shadow-lg shadow-orange-500/15" />
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight text-gradient">SMEE OS</span>
                <span className="text-xs text-muted-foreground">{t('adminLayout.operatingCenter')}</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('layout.mainMenu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.labelKey}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => router.push(item.url)}
                    tooltip={t(item.labelKey)}
                    className="rounded-2xl transition-all hover:translate-x-1 data-[active=true]:bg-gradient-to-r data-[active=true]:from-orange-600 data-[active=true]:to-amber-500 data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-orange-500/25"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.labelKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('adminLayout.marketing')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {marketingNavItems.map((item) => (
                <SidebarMenuItem key={item.labelKey}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => router.push(item.url)}
                    tooltip={t(item.labelKey)}
                    className="rounded-2xl transition-all hover:translate-x-1 data-[active=true]:bg-gradient-to-r data-[active=true]:from-orange-600 data-[active=true]:to-amber-500 data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-orange-500/25"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.labelKey)}</span>
              
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('adminLayout.configuration')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configNavItems.map((item) => (
                <SidebarMenuItem key={item.labelKey}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => router.push(item.url)}
                    tooltip={t(item.labelKey)}
                    className="rounded-2xl transition-all hover:translate-x-1 data-[active=true]:bg-gradient-to-r data-[active=true]:from-orange-600 data-[active=true]:to-amber-500 data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-orange-500/25"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.labelKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-2xl border border-orange-200/70 bg-white/70 shadow-sm transition-all data-[state=open]:bg-orange-50"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.profilePicture} alt={user?.name} />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-orange-600 to-amber-500 text-primary-foreground text-xs">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('layout.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('layout.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t('layout.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold">{t('layout.accessDenied')}</h1>
          <p className="text-sm text-muted-foreground">{t('adminLayout.adminRequired')}</p>
          <Button asChild>
            <a href="/login">{t('layout.loginCta')}</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="smee-shell">
        <header className="smee-topbar flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-500/80">{t('adminLayout.commandCenter')}</p>
              <p className="text-sm font-semibold text-slate-700">
                {new Date().getHours() < 12 ? t('adminLayout.morning') : new Date().getHours() < 18 ? t('adminLayout.afternoon') : t('adminLayout.evening')}, {user.name?.split(' ')[0]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <NotificationBell userRole={user.role} />
            </div>
          </div>
        </header>
        <main className="smee-page flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
