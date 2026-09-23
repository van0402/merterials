import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ImageLightbox } from '@/components/site/image-lightbox';
interface PageProps {
  params: Promise<{ id: string }>;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: 'Nhà sản xuất',
  DISTRIBUTOR: 'Nhà phân phối',
  IMPORTER: 'Nhà nhập khẩu',
  OEM_ODM: 'Đơn vị gia công (OEM/ODM)',
  SYSTEM_INTEGRATOR: 'Tích hợp hệ thống',
  TECHNICAL_SERVICE: 'Dịch vụ kỹ thuật',
};

const MAIN_MARKET_LABELS: Record<string, string> = {
  NATIONWIDE: 'Toàn quốc',
  NORTH: 'Miền Bắc',
  CENTRAL: 'Miền Trung',
  SOUTH: 'Miền Nam',
  EXPORT: 'Xuất khẩu',
};

const COMPANY_SIZE_LABELS: Record<string, string> = {
  UNDER_10: 'Dưới 10 nhân sự',
  FROM_10_TO_50: '10-50 nhân sự',
  FROM_51_TO_200: '51-200 nhân sự',
  FROM_201_TO_500: '201-500 nhân sự',
  OVER_500: 'Trên 500 nhân sự',
};

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function formatPrice(minCents: number | null, maxCents: number | null, currency: string) {
  if (minCents == null && maxCents == null) return null;
  const fmt = (cents: number) => cents.toLocaleString('vi-VN') + (currency === 'VND' ? 'đ' : ` ${currency}`);
  if (minCents != null && maxCents != null && minCents !== maxCents) {
    return `${fmt(minCents)} – ${fmt(maxCents)}`;
  }
  return fmt((minCents ?? maxCents)!);
}

export default async function SupplierDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supplier = await prisma.supplierProfile.findUnique({
    where: { id },
    include: {
      capabilities: { include: { capability: true } },
      categories: { include: { category: true } },
      materials: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { category: true },
      },
      _count: { select: { materials: { where: { isActive: true } } } },
    },
  });

  if (!supplier || supplier.status !== 'APPROVED') {
    notFound();
  }

  // Ưu tiên category thật; nếu chưa gán category nào thì fallback đoán tag từ industryRaw
  const realCategoryNames = supplier.categories.map((c) => c.category.name);
  const fallbackTags = realCategoryNames.length
    ? []
    : (supplier.industryRaw || '')
        .replace(/\([^)]*\)/g, '')
        .split(/[\/,&·]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 2);
  const displayTags = realCategoryNames.length ? realCategoryNames : fallbackTags;

  const contactHref = supplier.contactEmail
    ? `mailto:${supplier.contactEmail}`
    : `tel:${supplier.phone}`;

  const fullAddress = [supplier.address, supplier.district, supplier.province, supplier.country]
    .filter(Boolean)
    .join(', ');

  const galleryImages = Array.isArray(supplier.galleryImages) ? (supplier.galleryImages as string[]) : [];

  const infoItems = [
    supplier.businessTypes.length > 0 && { label: 'Loại hình', value: supplier.businessTypes.map((bt) => BUSINESS_TYPE_LABELS[bt]).join(', ') },
    supplier.mainMarket && { label: 'Thị trường chính', value: MAIN_MARKET_LABELS[supplier.mainMarket] },
    supplier.companySize && { label: 'Quy mô', value: COMPANY_SIZE_LABELS[supplier.companySize] },
    supplier.taxCode && { label: 'Mã số thuế', value: supplier.taxCode },
    supplier.website && { label: 'Website', value: supplier.website },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href="/">Trang chủ</Link> / <Link href="/#categories">Nhà cung cấp</Link> /{' '}
        <span className="text-foreground">{supplier.companyName}</span>
      </nav>

      <section className="overflow-hidden rounded-[26px] border bg-white shadow-sm">
        <div
          className="h-[160px] bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900 bg-cover bg-center"
          style={supplier.coverImageUrl ? { backgroundImage: `url(${supplier.coverImageUrl})` } : undefined}
        />
        <div className="flex flex-col gap-5 px-7 pb-7 sm:flex-row sm:items-end">
          <div className="-mt-14 flex h-[110px] w-[110px] flex-none items-center justify-center overflow-hidden rounded-[22px] border-4 border-white bg-gradient-to-br from-slate-700 to-slate-900 text-2xl font-black text-white shadow-lg">
            {supplier.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={supplier.logoUrl} alt={supplier.companyName} className="h-full w-full object-cover" />
            ) : (
              initialsOf(supplier.companyName)
            )}
          </div>
          <div className="min-w-0 flex-1 pt-4 sm:pt-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight">{supplier.companyName}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                ✓ Đã duyệt
              </span>
            </div>
            {supplier.tradingName && (
              <p className="mt-0.5 text-[12px] text-muted-foreground">Tên giao dịch: {supplier.tradingName}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] font-medium text-muted-foreground">
              <span>📍 {supplier.province ? `${supplier.province}, ` : ''}{supplier.country}</span>
              {supplier.businessTypes.length > 0 && <span>🏭 {supplier.businessTypes.map((bt) => BUSINESS_TYPE_LABELS[bt]).join(', ')}</span>}
              {supplier.foundedYear && <span>🗓 Thành lập {supplier.foundedYear}</span>}
            </div>
            {displayTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {displayTags.map((tag) => (
                  <span key={tag} className="inline-block rounded-full border bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2 sm:pt-0">
            <button
              type="button"
              title="Tính năng đang phát triển"
              className="rounded-xl border px-4 py-2.5 text-xs font-extrabold opacity-60"
            >
              ♡ Lưu công ty
            </button>
            <a href={contactHref} className="rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-extrabold text-white">
              Liên hệ nhà cung cấp
            </a>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Giới thiệu doanh nghiệp</h2>
            {supplier.description && (
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{supplier.description}</p>
            )}

            {infoItems.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {infoItems.map((item) => (
                  <div key={item.label} className="rounded-xl border bg-slate-50 p-3.5">
                    <div className="text-[10px] font-extrabold uppercase text-muted-foreground">{item.label}</div>
                    <div className="mt-1 text-xs font-extrabold">{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {!supplier.description && infoItems.length === 0 && (
              <p className="mt-3 text-[13px] text-muted-foreground">Doanh nghiệp chưa cập nhật thêm thông tin.</p>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Sản phẩm</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {supplier._count.materials > 0
                    ? `${supplier._count.materials} sản phẩm / nguyên vật liệu công ty này đang cung cấp.`
                    : 'Các sản phẩm / nguyên vật liệu công ty này cung cấp.'}
                </p>
              </div>
              {supplier._count.materials > supplier.materials.length && (
                <span className="text-xs font-extrabold text-orange-600">
                  Xem tất cả sản phẩm ({supplier._count.materials}) →
                </span>
              )}
            </div>

            {supplier.materials.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed p-9 text-center">
                <div className="text-2xl">📦</div>
                <b className="mt-2 block text-sm">Nhà cung cấp chưa cập nhật sản phẩm nào</b>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Thông tin sản phẩm sẽ hiển thị ở đây khi công ty thêm vào hệ thống.
                </span>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                {supplier.materials.map((m) => {
                  const price = formatPrice(m.priceMinCents, m.priceMaxCents, m.currency);
                  const images = Array.isArray(m.images) ? (m.images as string[]) : [];
                  return (
                    <div key={m.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="flex h-[100px] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        {images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={images[0]} alt={m.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl opacity-40">📦</span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <div className="line-clamp-2 min-h-[32px] text-[11.5px] font-extrabold leading-tight">{m.name}</div>
                        {m.category && (
                          <span className="mt-1.5 inline-block rounded-full bg-orange-50 px-2 py-0.5 text-[9.5px] font-bold text-orange-700">
                            {m.category.name}
                          </span>
                        )}
                        <div className={`mt-1.5 text-[12px] font-black ${price ? '' : 'italic text-muted-foreground'}`}>
                          {price || 'Liên hệ báo giá'}
                        </div>
                        {price && m.unit && <div className="text-[10px] text-muted-foreground">/ {m.unit}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {galleryImages.length > 0 && (
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Hình ảnh công ty</h2>
              <p className="mt-1 text-xs text-muted-foreground">Nhà máy, xưởng, dây chuyền sản xuất.</p>
                            <div className="mt-4">
                <ImageLightbox images={galleryImages} />
              </div>
            </section>
          )}

          {supplier.capabilities.length > 0 && (
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Năng lực</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Năng lực do doanh nghiệp khai báo, admin xác nhận trước khi hiển thị.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {supplier.capabilities.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5 rounded-xl border bg-slate-50 p-3">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-orange-50 text-orange-600">✓</span>
                    <span className="text-xs font-bold">{c.capability.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-bold">Liên hệ nhà cung cấp</h3>
            <div className="mt-3 space-y-2 text-[11px] text-muted-foreground">
              {supplier.contactName && <div>👤 {supplier.contactName}</div>}
              {supplier.contactEmail && <div>✉ {supplier.contactEmail}</div>}
              <div>☎ {supplier.phone}</div>
              {fullAddress && <div>📍{fullAddress}</div>}
            </div>
            <a
              href={contactHref}
              className="mt-4 block rounded-xl bg-orange-500 py-2.5 text-center text-xs font-extrabold text-white"
            >
              Liên hệ ngay
            </a>
          </div>

          <div className="rounded-2xl bg-slate-900 p-5 text-white">
            <h4 className="font-bold">Thông tin xác minh</h4>
            <div className="mt-3 flex gap-2.5 text-[11px] text-white/80">
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/15 text-emerald-300">✓</span>
              Hồ sơ doanh nghiệp đã được admin duyệt trước khi hiển thị.
            </div>
            <div className="mt-3 flex gap-2.5 text-[11px] text-white/80">
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/15 text-emerald-300">✓</span>
              Cập nhật hồ sơ gần nhất: {new Date(supplier.updatedAt).toLocaleDateString('vi-VN')}.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}