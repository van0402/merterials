import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, Mail, MapPin, Package, Phone, ShieldCheck, User } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { CompanyAvatar } from '@/components/site/company-avatar';
import { ImageLightbox } from '@/components/site/image-lightbox';
import { RfqModal } from '@/components/site/rfq-modal';
import { JsonLd } from '@/components/seo/json-ld';

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

function formatPrice(minCents: number | null, maxCents: number | null, currency: string) {
  if (minCents == null && maxCents == null) return null;
  const fmt = (cents: number) => cents.toLocaleString('vi-VN') + (currency === 'VND' ? 'đ' : ` ${currency}`);
  if (minCents != null && maxCents != null && minCents !== maxCents) {
    return `${fmt(minCents)} – ${fmt(maxCents)}`;
  }
  return fmt((minCents ?? maxCents)!);
}

const SECTION = 'border-b border-gray-200 py-8 last:border-b-0';
const H2 = 'text-lg font-bold text-slate-800';

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const s = await prisma.supplierProfile.findUnique({
    where: { id },
    select: {
      companyName: true,
      description: true,
      province: true,
      status: true,
      logoUrl: true,
      coverImageUrl: true,
      categories: { select: { category: { select: { name: true } } }, take: 3 },
    },
  });
  if (!s) return { title: 'Không tìm thấy nhà cung cấp' };

  const nganh = s.categories.map((c) => c.category.name).join(', ');
  const noi = s.province ? ` tại ${s.province}` : '';
  const title = nganh ? `${s.companyName} – Nhà cung cấp ${nganh}${noi}` : s.companyName;
  const description = (
    s.description || `${s.companyName} – nhà cung cấp ${nganh || 'nguyên vật liệu'}${noi}. Xem sản phẩm và gửi yêu cầu báo giá.`
  ).slice(0, 160);
  const image = s.coverImageUrl || s.logoUrl || '/images/og-cover.jpg';

  return {
    title,
    description,
    alternates: { canonical: `/suppliers/${id}` },
    openGraph: { title, description, images: [image] },
    // Hồ sơ chưa duyệt thì không cho Google lưu
    robots: s.status === 'APPROVED' ? undefined : { index: false, follow: false },
  };
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
        take: 12,
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

  const fullAddress = [supplier.address, supplier.district, supplier.province, supplier.country]
    .filter(Boolean)
    .join(', ');

  const galleryImages = Array.isArray(supplier.galleryImages) ? (supplier.galleryImages as string[]) : [];

  const businessTypeText = supplier.businessTypes.map((bt) => BUSINESS_TYPE_LABELS[bt]).join(', ');

  const summaryParts = [
    [supplier.province, supplier.country].filter(Boolean).join(', '),
    businessTypeText,
    supplier.foundedYear ? `Thành lập ${supplier.foundedYear}` : '',
  ].filter(Boolean);

  const websiteHref = supplier.website
    ? /^https?:\/\//i.test(supplier.website) ? supplier.website : `https://${supplier.website}`
    : null;

  const infoRows: { label: string; value: React.ReactNode }[] = [
    supplier.tradingName && { label: 'Tên giao dịch', value: supplier.tradingName },
    businessTypeText && { label: 'Loại hình', value: businessTypeText },
    supplier.mainMarket && { label: 'Thị trường chính', value: MAIN_MARKET_LABELS[supplier.mainMarket] },
    supplier.companySize && { label: 'Quy mô', value: COMPANY_SIZE_LABELS[supplier.companySize] },
    supplier.taxCode && { label: 'Mã số thuế', value: supplier.taxCode },
    supplier.website && {
      label: 'Website',
      value: (
        <a href={websiteHref!} target="_blank" rel="noopener noreferrer" className="text-orange-700 hover:underline">
          {supplier.website.replace(/^https?:\/\//i, '')}
        </a>
      ),
    },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[];

  const contactRows = [
    supplier.contactName && { Icon: User, label: 'Người liên hệ', value: supplier.contactName },
    supplier.contactEmail && { Icon: Mail, label: 'Email', value: supplier.contactEmail },
    supplier.phone && { Icon: Phone, label: 'Điện thoại', value: supplier.phone },
    fullAddress && { Icon: MapPin, label: 'Địa chỉ', value: fullAddress },
  ].filter(Boolean) as { Icon: typeof User; label: string; value: string }[];

  const ctaClass =
    'select-none rounded-[10px] bg-orange-600 px-[22px] py-3 text-[14.5px] font-semibold text-white hover:bg-orange-700';

  // Dữ liệu cấu trúc cho Google (không đưa SĐT/email vào)
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://supply.smee.vn';
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: supplier.companyName,
    url: `${SITE}/suppliers/${supplier.id}`,
    ...(supplier.logoUrl && { logo: new URL(supplier.logoUrl, SITE).href }),
    ...(supplier.description && { description: supplier.description.slice(0, 300) }),
    ...(supplier.foundedYear && { foundingDate: String(supplier.foundedYear) }),
    ...(supplier.website && { sameAs: [supplier.website] }),
    address: {
      '@type': 'PostalAddress',
      ...(supplier.address && { streetAddress: supplier.address }),
      ...(supplier.province && { addressRegion: supplier.province }),
      addressCountry: 'VN',
    },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Nhà cung cấp', item: `${SITE}/suppliers` },
      { '@type': 'ListItem', position: 3, name: supplier.companyName },
    ],
  };

  return (
    <div className="mx-auto max-w-[1080px] px-4 pb-16 pt-7 sm:px-6">
      <JsonLd data={orgSchema} />
      <JsonLd data={breadcrumbSchema} />
      <nav className="text-[13px] text-gray-500">
        <Link href="/" className="hover:text-slate-800">Trang chủ</Link>
        <span className="mx-1.5 text-gray-300">/</span>
        <Link href="/suppliers" className="hover:text-slate-800">Nhà cung cấp</Link>
        <span className="mx-1.5 text-gray-300">/</span>
        <span>{supplier.companyName}</span>
      </nav>

      <header className="flex flex-wrap items-start gap-x-6 gap-y-4 border-b border-gray-200 pb-7 pt-8 md:flex-nowrap">
        <CompanyAvatar name={supplier.companyName} logoUrl={supplier.logoUrl} size={88} />

        <div className="order-3 min-w-0 basis-full md:order-none md:basis-0 md:flex-1">
          <h1 className="text-[23px] font-bold leading-snug tracking-tight text-slate-800 sm:text-[28px]">
            {supplier.companyName}
          </h1>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-green-700">
            <ShieldCheck className="h-[15px] w-[15px]" />
            Nhà cung cấp đã được duyệt
          </div>
          {summaryParts.length > 0 && (
            <p className="mt-2.5 text-[14.5px] text-gray-500">{summaryParts.join(' · ')}</p>
          )}
          {displayTags.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-2">
              {displayTags.map((tag) => (
                <span key={tag} className="rounded-full border border-gray-200 px-3 py-1 text-[13px] text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="order-2 ml-auto flex-none pt-1 md:order-none md:ml-0">
          <RfqModal
            supplierProfileId={supplier.id}
            supplierName={supplier.companyName}
            verified={supplier.isVerified}
            title="Liên hệ nhà cung cấp"
            buttonLabel="Liên hệ nhà cung cấp"
            buttonClassName={ctaClass}
          />
        </div>
      </header>

      <div className="grid gap-x-14 lg:grid-cols-[1fr_300px]">
        <div>
          <section className={SECTION}>
            <h2 className={H2}>Giới thiệu</h2>
            {supplier.description && (
              <p className="mt-3.5 max-w-[62ch] text-[15px] leading-[1.75] text-gray-600">{supplier.description}</p>
            )}
            {infoRows.length > 0 ? (
              <dl className="mt-5">
                {infoRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[110px_1fr] gap-4 border-t border-gray-200 py-3 text-[14.5px] sm:grid-cols-[150px_1fr]"
                  >
                    <dt className="text-gray-500">{row.label}</dt>
                    <dd className="font-medium text-slate-800">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              !supplier.description && (
                <p className="mt-3.5 text-sm text-gray-500">Doanh nghiệp chưa cập nhật thêm thông tin.</p>
              )
            )}
          </section>

          <section className={SECTION}>
            <h2 className={H2}>Sản phẩm</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {supplier._count.materials > 0
                ? `${supplier._count.materials} sản phẩm đang cung cấp`
                : 'Các sản phẩm / nguyên vật liệu công ty này cung cấp'}
            </p>

            {supplier.materials.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-gray-200 p-9 text-center">
                <Package className="mx-auto h-7 w-7 text-gray-300" />
                <b className="mt-2 block text-sm text-slate-800">Nhà cung cấp chưa cập nhật sản phẩm nào</b>
                <span className="mt-1 block text-xs text-gray-500">
                  Thông tin sản phẩm sẽ hiển thị ở đây khi công ty thêm vào hệ thống.
                </span>
              </div>
            ) : (
              <div
                className={
                  supplier.materials.length > 4
                    ? 'mt-5 flex snap-x gap-4 overflow-x-auto pb-2'
                    : 'mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'
                }
              >
                {supplier.materials.map((m) => {
                  const price = formatPrice(m.priceMinCents, m.priceMaxCents, m.currency);
                  const images = Array.isArray(m.images) ? (m.images as string[]) : [];
                  return (
                    <Link
                      key={m.id}
                      href={`/products/${m.id}`}
                      className={
                        (supplier.materials.length > 4 ? 'w-[200px] shrink-0 snap-start ' : '') +
                        'group block overflow-hidden rounded-[14px] border border-[#e8ebf0] bg-white transition hover:border-[#f0c9a6] hover:shadow-[0_8px_24px_rgba(25,40,65,0.07)]'
                      }
                    >
                      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#f7f8fa] text-gray-300">
                        {images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={images[0]} alt={m.name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-9 w-9" strokeWidth={1.4} />
                        )}
                      </div>
                      <div className="p-4">
                        <div className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-800 group-hover:text-orange-700">
                          {m.name}
                        </div>
                        {m.category && <div className="mt-0.5 text-[13px] text-gray-500">{m.category.name}</div>}
                        <div className="mt-1.5 text-[15px] font-bold text-slate-800">
                          {price ? (
                            <>
                              {price}
                              {m.unit && <small className="ml-1 text-[13px] font-medium text-gray-500">/ {m.unit}</small>}
                            </>
                          ) : (
                            <span className="font-medium italic text-gray-500">Liên hệ báo giá</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {galleryImages.length > 0 && (
            <section className={SECTION}>
              <h2 className={H2}>Hình ảnh công ty</h2>
              <p className="mt-0.5 text-sm text-gray-500">Nhà máy, xưởng, dây chuyền sản xuất</p>
              <div className="mt-5">
                <ImageLightbox images={galleryImages} />
              </div>
            </section>
          )}

          {supplier.capabilities.length > 0 && (
            <section className={SECTION}>
              <h2 className={H2}>Năng lực</h2>
              <div className="mt-4 flex flex-wrap gap-x-7 gap-y-2.5">
                {supplier.capabilities.map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-2 text-[14.5px] text-slate-800">
                    <Check className="h-[17px] w-[17px] text-green-700" strokeWidth={2.4} />
                    {c.capability.name}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="border-t border-gray-200 pt-8 lg:border-t-0">
          <div className="lg:sticky lg:top-24">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Liên hệ</h3>
            <div className="mt-3.5 grid gap-4">
              {contactRows.map(({ Icon, label, value }) => (
                <div key={label} className="flex gap-3 text-[14.5px] text-slate-800">
                  <Icon className="mt-1 h-4 w-4 flex-none text-gray-500" />
                  <span className="break-words">
                    <small className="block text-[12.5px] text-gray-500">{label}</small>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <RfqModal
              supplierProfileId={supplier.id}
              supplierName={supplier.companyName}
              verified={supplier.isVerified}
              title="Liên hệ nhà cung cấp"
              buttonLabel="Liên hệ ngay"
              buttonClassName={`${ctaClass} mt-6 block w-full text-center`}
            />
            <div className="mt-6 grid gap-2 border-t border-gray-200 pt-5 text-[13px] text-gray-500">
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 h-[15px] w-[15px] flex-none text-green-700" strokeWidth={2.4} />
                Hồ sơ đã được admin duyệt trước khi hiển thị
              </div>
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 h-[15px] w-[15px] flex-none text-green-700" strokeWidth={2.4} />
                Cập nhật gần nhất: {new Date(supplier.updatedAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}