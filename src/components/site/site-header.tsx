'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand-logo';
import { useI18n } from '@/components/i18n-provider';
import { LanguageToggle } from '@/components/language-toggle';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { LogOut, LayoutDashboard, Building2 } from 'lucide-react';

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  hasSupplierProfile: boolean;
  supplierStatus?: string | null;
  supplierProfileId?: string | null;
}


export function SiteHeader() {
  const { t } = useI18n();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-orange-200/60 bg-orange-50/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo className="h-10 w-10 rounded-2xl bg-white shadow" />
          <span className="text-lg font-black tracking-[-0.03em]">Supply Merterial</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex">
          <a href="/#categories">{t('header.home')}</a>
          <a href="/suppliers">{t('header.suppliers')}</a>
          <a href="/products">{t('header.products')}</a>
          <a href="/can-mua">{t('header.sourcing')}</a>
        </nav>


        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          {checking ? (
            <div className="h-9 w-16 animate-pulse rounded-md bg-orange-100 sm:h-10 sm:w-24" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-full border border-orange-200 bg-white px-2 py-1.5 pr-4 shadow-sm transition hover:border-orange-300">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                    {user.name?.charAt(0).toUpperCase() ?? 'U'}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-bold leading-tight text-slate-900">{user.name}</span>
                    <span className="block text-xs leading-tight text-slate-500">
                      {user.role === 'ADMIN'
                        ? t('header.admin')
                        : user.role === 'SUPPLIER'
                          ? t('header.supplier')
                          : t('header.buyer')}
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block truncate font-bold">{user.name}</span>
                  <span className="block truncate text-xs font-normal text-slate-500">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === 'ADMIN' && (
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                  {t('header.adminPage')}
                  </DropdownMenuItem>
                )}
                {user.role !== 'ADMIN' && user.hasSupplierProfile && (
                  <DropdownMenuItem onClick={() => router.push('/supplier/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t('header.dashboard')}
                  </DropdownMenuItem>
                )}
                {user.role !== 'ADMIN' && !user.hasSupplierProfile && (
                  <DropdownMenuItem onClick={() => router.push('/register-supplier')}>
                    <Building2 className="mr-2 h-4 w-4" />
                    {t('header.becomeSupplier')}
                  </DropdownMenuItem>
                )}
                {user.role !== 'ADMIN' && user.hasSupplierProfile && user.supplierStatus === 'APPROVED' && user.supplierProfileId && (
                  <DropdownMenuItem onClick={() => window.open(`/suppliers/${user.supplierProfileId}`, '_blank')}>
                    <Building2 className="mr-2 h-4 w-4" />
                    {t('header.publicProfile')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                 {t('header.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" className="h-9 px-2.5 text-xs sm:h-10 sm:px-4 sm:text-sm">
                  {t('header.login')}
                </Button>
              </Link>
              <Link href="/register">
                <Button className="h-9 px-2.5 text-xs sm:h-10 sm:px-4 sm:text-sm">{t('header.register')}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}