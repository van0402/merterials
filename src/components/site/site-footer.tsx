import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { LegalDialog } from '@/components/legal-dialog';
import { LEGAL_INFO } from '@/lib/legal';

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#101A2B] text-slate-300">
      {/* Glow nhẹ */}
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-orange-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* MAIN */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.9fr_1fr]">
          
          {/* BRAND */}
          <div>
            <div className="flex items-center gap-3">
              <BrandLogo className="h-11 w-11 rounded-xl bg-white shadow-lg" />

              <div>
                <div className="text-lg font-extrabold text-white">
                  Supply Material
                </div>

                <div className="mt-0.5 text-xs text-slate-500">
                  B2B Supplier Discovery Platform
                </div>
              </div>
            </div>

            <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">
              Nền tảng hỗ trợ doanh nghiệp tìm kiếm, kết nối và tiếp cận
              nguồn cung vật liệu, thiết bị và năng lực sản xuất B2B một
              cách nhanh chóng và minh bạch hơn.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
                ✓ Supplier đã duyệt
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
                AI Search
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
                RFQ riêng tư
              </span>
            </div>
          </div>

          {/* KHÁM PHÁ */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-white">
              Khám phá
            </h3>

            <div className="flex flex-col gap-3 text-sm">
              <Link
                href="/tim-kiem"
                className="transition hover:text-white"
              >
                Tìm kiếm
              </Link>

              <Link
                href="/#categories"
                className="transition hover:text-white"
              >
                Danh mục vật liệu
              </Link>

              <Link
                href="/can-mua"
                className="font-medium text-orange-300 transition hover:text-orange-200"
              >
                Cần mua
              </Link>
            </div>
          </div>

          {/* DOANH NGHIỆP */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-white">
              Dành cho doanh nghiệp
            </h3>

            <div className="flex flex-col gap-3 text-sm">
              <Link
                href="/register-supplier"
                className="transition hover:text-white"
              >
                Đăng ký nhà cung cấp
              </Link>

              <Link
                href="/can-mua"
                className="transition hover:text-white"
              >
                Đăng nhu cầu mua
              </Link>

              <Link
                href="/can-mua/cua-toi"
                className="transition hover:text-white"
              >
                Bài của tôi
              </Link>
            </div>
          </div>

          {/* PHÁP LÝ */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-white">
              Hỗ trợ & pháp lý
            </h3>

            <div className="flex flex-col gap-3 text-sm">
              <LegalDialog doc="terms" className="w-fit text-left transition hover:text-white">
                Điều khoản sử dụng
              </LegalDialog>

              <LegalDialog doc="privacy" className="w-fit text-left transition hover:text-white">
                Chính sách bảo mật
              </LegalDialog>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs text-slate-400">
                Email
              </p>

              <a
                href={`mailto:${LEGAL_INFO.supportEmail}`}
                className="mt-1 block break-all text-sm font-semibold text-white hover:underline"
              >
                {LEGAL_INFO.supportEmail}
              </a>

              <p className="mt-3 text-xs text-slate-400">
                Hotline
              </p>

              <a
                href={`tel:${LEGAL_INFO.phone}`}
                className="mt-1 block text-sm font-semibold text-white hover:underline"
              >
                {LEGAL_INFO.phone}
              </a>

              <p className="mt-3 text-xs text-slate-400">
                Địa chỉ
              </p>

              <p className="mt-1 text-sm font-semibold text-white">
                {LEGAL_INFO.address}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col gap-5 border-y border-white/10 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              Đang cần tìm nguồn cung?
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Đăng nhu cầu để tiếp cận các nhà cung cấp phù hợp trên hệ thống.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/can-mua"
              className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Đăng nhu cầu mua
            </Link>

            <Link
              href="/register-supplier"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Trở thành nhà cung cấp
            </Link>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="flex flex-col gap-3 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Supply Material. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-5">
            <LegalDialog doc="terms" className="transition hover:text-slate-300">
              Điều khoản
            </LegalDialog>

            <LegalDialog doc="privacy" className="transition hover:text-slate-300">
              Bảo mật
            </LegalDialog>
          </div>
        </div>
      </div>
    </footer>
  );
}