import { BrandLogo } from '@/components/brand-logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-orange-200/60 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <BrandLogo className="h-6 w-6 rounded-lg bg-white shadow" />
          Supply Merterial
        </div>
        <p>© {new Date().getFullYear()} Supply Merterial. Danh bạ nhà cung cấp nguyên vật liệu.</p>
      </div>
    </footer>
  );
}