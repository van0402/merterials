"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { toast } from 'sonner';
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
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { NotificationBell } from "@/components/notification-bell";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/i18n-provider";
import { SupportChatWidget } from "@/components/support-chat-widget";
import {
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  ChevronsUpDown,
  Store,
  FileSignature,
  Layers,
  BookText,
  Info,
} from "lucide-react";

interface BrandSettings {
  companyName?: string;
  companyLogo?: string;
  brandBackgroundColor?: string;
  brandButtonColor?: string;
  brandTextColor?: string;
}

const mainNavItems = [
  {
    labelKey: "affiliateLayout.nav.affiliateProgram",
    url: "/affiliate/affiliate-program",
    icon: Layers,
  },
  {
    labelKey: "affiliateLayout.nav.reports",
    url: "/affiliate/reports",
    icon: BarChart3,
  },
  { labelKey: "affiliateLayout.nav.payouts", url: "/affiliate/payouts", icon: Wallet },
  { labelKey: "affiliateLayout.nav.seller", url: "/affiliate/seller", icon: Store },
  {
    labelKey: "affiliateLayout.nav.contract",
    url: "/affiliate/contract",
    icon: FileSignature,
  },
];

const accountNavItems = [
  { labelKey: "affiliateLayout.nav.settings", url: "/affiliate/settings", icon: Settings },
];

const otherFeatureNavItems = [
  { labelKey: "affiliateLayout.nav.academy", url: "/affiliate/academy", icon: BookText },
  {
    labelKey: "affiliateLayout.nav.support",
    url: "/affiliate/support",
    icon: Info,
  },
];

function AffiliateSidebar({ brand }: { brand: BrandSettings }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, checkAuth } = useAuth();
const needsContract = user?.role !== 'ADMIN' && (!user?.contractStatus || user.contractStatus === 'DRAFT');

const handleNavigate = (url: string) => {
  if (needsContract && url !== '/affiliate/contract') {
    toast.warning('Vui lòng hoàn thành hợp đồng trước khi truy cập mục này.');
    router.push('/affiliate/contract');
    return;
  }
  router.push(url);
};

  const { t } = useI18n();

  useEffect(() => {
    const handleProfileUpdated = () => checkAuth();
    window.addEventListener("affiliate-profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("affiliate-profile-updated", handleProfileUpdated);
  }, []);

  const isActive = (url: string) => {
    if (url === "/affiliate") return pathname === "/affiliate";
    return pathname.startsWith(url);
  };

  const brandName = brand.companyName || "SMEE";

  return (
    <Sidebar
      variant="inset"
      className="border-orange-200/70 bg-white/80 backdrop-blur-2xl"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="m-2 flex items-center gap-3 rounded-3xl border border-orange-200/80 bg-gradient-to-br from-white to-orange-50 p-3 shadow-lg shadow-orange-950/5">
              <BrandLogo
                className="h-11 w-11 rounded-2xl bg-white shadow-lg shadow-orange-500/15"
                alt={`${brandName} logo`}
              />
              <div className="flex min-w-0 flex-col">
                <span className="whitespace-nowrap text-sm font-black tracking-tight text-gradient">
                  {brandName} Affiliate
                </span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {t('affiliateLayout.portalSubtitle')}
                </span>
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
                    onClick={() => handleNavigate(item.url)}
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
          <SidebarGroupLabel>{t('affiliateLayout.account')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavItems.map((item) => (
                <SidebarMenuItem key={item.labelKey}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => handleNavigate(item.url)}
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
          <SidebarGroupLabel>{t('affiliateLayout.otherFeatures')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherFeatureNavItems.map((item) => (
                <SidebarMenuItem key={item.labelKey}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => handleNavigate(item.url)}
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
                    <AvatarImage src={user?.profilePicture || undefined} alt={user?.name || "Avatar"} />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-orange-600 to-amber-500 text-white text-xs">
                      {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
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
                <DropdownMenuItem
                  onClick={() => router.push("/affiliate/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t('layout.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-destructive"
                >
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

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [brand, setBrand] = useState<BrandSettings>({});

  useEffect(() => {
    if (loading || !user || user.role === 'ADMIN') return;
    const needsContract = !user.contractStatus || user.contractStatus === 'DRAFT';
    if (needsContract && pathname !== '/affiliate/contract') {
      toast.warning('Vui lòng hoàn thành hợp đồng trước khi truy cập mục này.');
      router.replace('/affiliate/contract');
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-orange-500" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t('layout.loadingDashboard')}
          </p>
        </div>
      </div>
    );
  }

  if (!user || !user.hasAffiliate) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold">{t('layout.accessDenied')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('affiliateLayout.affiliateRequired')}
          </p>
          <Button asChild>
            <a href="/login">{t('layout.loginCta')}</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AffiliateSidebar brand={brand} />
      <SidebarInset className="smee-shell">
        <header className="smee-topbar flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {t('affiliateLayout.welcomeBack')}, {user.name?.split(" ")[0]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <NotificationBell userRole={user.role} />
            </div>
          </div>
        </header>
        <main className="smee-page flex-1 overflow-auto">{children}</main>
      </SidebarInset>
      <SupportChatWidget currentUserId={user.id} />
    </SidebarProvider>
  );
}
