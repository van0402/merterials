import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand-logo';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-orange-200/60 bg-orange-50/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo className="h-10 w-10 rounded-2xl bg-white shadow" />
          <span className="text-lg font-black tracking-[-0.03em]">Supply Merterial</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex">
          <a href="/#suppliers">Nhà cung cấp</a>
          <a href="/#categories">Danh mục</a>
          <a href="/#how">Cách hoạt động</a>
          <a href="/#">Giới thiệu</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline">Đăng nhập</Button>
          </Link>
          <Link href="/register">
            <Button>Đăng ký</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}