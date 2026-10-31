import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { BusinessType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { RfqModal } from '@/components/site/rfq-modal';
import { ProductGallery } from '@/components/site/product-gallery';
import { AVATAR_COLORS, CATEGORY_STYLES, DEFAULT_STYLE, hashOf, initialsOf } from '@/lib/category-style';

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  MANUFACTURER: 'Nhà sản xuất',
  DISTRIBUTOR: 'Nhà phân phối',
  IMPORTER: 'Nhà nhập khẩu',
  OEM_ODM: 'Gia công OEM/ODM',
  SYSTEM_INTEGRATOR: 'Tích hợp hệ thống',
  TECHNICAL_SERVICE: 'Dịch vụ kỹ thuật',
};

function formatPrice(min: number | null, max: number | null, currency: string) {
  if (min == null && max == null) return null;
  const fmt = (v: number) => v.toLocaleString('vi-VN') + (currency === 'VND' ? 'đ' : ` ${currency}`);
  if (min != null && max != null && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max)!);
}

// Dữ liệu lưu dạng JSON nên lọc lại cho chắc: chỉ lấy chuỗi hợp lệ
function toStrings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];
}
function toSpecs(v: unknown): [string, string][] {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return [];
  return Object.entries(v as Record<string, unknown>)
    .filter(([k, val]) => k.trim() && typeof val === 'string' && val.trim())
    .map(([k, val]) => [k, val as string]);
}

// cache: tiêu đề trang và nội dung trang dùng chung một lần truy vấn
const getProduct = cache(async (id: string) =>
  prisma.material.findFirst({
    where: { id, isActive: true, supplierProfile: { status: 'APPROVED' } }, // chỉ sản phẩm đang bán của công ty đã duyệt
    select: {
      id: true,
      name: true,
      description: true,
      unit: true,
      priceMinCents: true,
      priceMaxCents: true,
      currency: true,
      images: true,
      specifications: true,
      category: { select: { name: true, slug: true } },
      supplierProfile: {
        select: {
          id: true,
          companyName: true,
          isVerified: true,
          province: true,
          country: true,
          businessTypes: true,
          _count: { select: { materials: { where: { isActive: true } } } },
        },
      },
    },
  }),
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getProduct(id);
  if (!m) return { title: 'Không tìm thấy sản phẩm | Supply Merterial' };
  return {
    title: `${m.name} | Supply Merterial`,
    description: (m.description || `${m.name} do ${m.supplierProfile.companyName} cung cấp.`).slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getProduct(id);
  if (!m) notFound();

  const s = m.supplierProfile;
  const style = (m.category && CATEGORY_STYLES[m.category.slug]) || DEFAULT_STYLE;
  const images = toStrings(m.images);
  const specs = toSpecs(m.specifications);
  const priceText = formatPrice(m.priceMinCents, m.priceMaxCents, m.currency);
  const location = [s.province, s.country].filter(Boolean).join(', ');
  const types = s.businessTypes.map((t) => BUSINESS_TYPE_LABELS[t]).join(', ');
  const [avBg, avFg] = AVATAR_COLORS[hashOf(s.companyName) % AVATAR_COLORS.length];

  // Sản phẩm khác của cùng công ty
  const others = await prisma.material.findMany({
    where: { supplierProfileId: s.id, isActive: true, id: { not: m.id } },
    orderBy: { createdAt: 'desc' },
    take: 4,
    select: {
      id: true, name: true, unit: true, priceMinCents: true, priceMaxCents: true, currency: true,
      images: true, category: { select: { name: true, slug: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <nav className="py-5 text-[12.5px] text-[#a3acba]">
        <Link href="/" className="hover:underline">Trang chủ</Link> /{' '}
        <Link href="/products" className="hover:underline">Sản phẩm</Link>
        {m.category && <> / <Link href={`/products?category=${m.category.slug}`} className="hover:underline">{m.category.name}</Link></>}
        {' '}/ <span className="text-[#7a8597]">{m.name}</span>
      </nav>

      {/* Khối trên: ảnh + thông tin */}
      <section className="grid items-start gap-8 lg:grid-cols-[1.05fr_1fr]">
        <ProductGallery images={images} alt={m.name} from={style.from} to={style.to} icon={style.icon} />

        <div>
          {m.category && (
            <span className="inline-block rounded-full bg-[#fff1e4] px-3 py-1 text-xs font-semibold text-[#b45309]">
              {m.category.name}
            </span>
          )}
          <h1 className="mt-3 text-[27px] font-bold leading-tight tracking-tight text-[#1f2a3d]">{m.name}</h1>

          {priceText ? (
            <>
              <div className="mt-4 text-[28px] font-bold text-[#1f2a3d]">
                {priceText}
                {m.unit && <small className="ml-1 text-sm font-normal text-[#7a8597]">/ {m.unit}</small>}
              </div>
              <p className="text-[12.5px] text-[#a3acba]">Giá tham khảo do nhà cung cấp đăng, có thể thay đổi theo số lượng.</p>
            </>
          ) : (
            <div className="mt-4 text-lg font-medium italic text-[#7a8597]">Liên hệ báo giá</div>
          )}

          <div className="my-5 overflow-hidden rounded-xl border border-[#e8ebf0] bg-white text-[13.5px]">
            {[
              ['Nhà cung cấp', s.companyName],
              location ? ['Khu vực', location] : null,
              types ? ['Loại hình', types] : null,
              s.isVerified ? ['Xác minh', '✓ Đã được SMEE duyệt hồ sơ'] : null,
            ]
              .filter((r): r is string[] => r !== null)
              .map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-[#f0f2f5] px-3.5 py-2.5 last:border-0">
                  <span className="text-[#7a8597]">{label}</span>
                  <b className={`text-right font-semibold ${label === 'Xác minh' ? 'text-[#17835c]' : 'text-[#1f2a3d]'}`}>{value}</b>
                </div>
              ))}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <div className="flex min-w-[220px] flex-1">
              <RfqModal
                supplierProfileId={s.id}
                supplierName={s.companyName}
                materialId={m.id}
                verified={s.isVerified}
                title="Yêu cầu báo giá sản phẩm"
                buttonLabel="Yêu cầu báo giá sản phẩm này"
                buttonClassName="flex h-[46px] w-full items-center justify-center rounded-[11px] bg-[#ea6a12] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(234,106,18,0.22)] hover:bg-[#d85f0d]"
              />
            </div>
            <Link
              href={`/suppliers/${s.id}`}
              className="flex h-[46px] items-center justify-center rounded-[11px] border border-[#f0b98a] bg-white px-5 text-sm font-bold text-[#c2410c]"
            >
              Xem hồ sơ công ty
            </Link>
          </div>
          <p className="mt-3 flex gap-2 text-[12.5px] text-[#7a8597]">
            <span className="text-[#17835c]">✓</span>
            Yêu cầu của bạn được gửi trực tiếp tới nhà cung cấp. Không mất phí.
          </p>
        </div>
      </section>

      {/* Nội dung + khung nhà cung cấp */}
      <section className="mt-9 grid items-start gap-7 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {m.description && (
            <div className="rounded-2xl border border-[#e8ebf0] bg-white p-6">
              <h2 className="mb-3 text-[17px] font-bold text-[#1f2a3d]">Mô tả sản phẩm</h2>
              <p className="whitespace-pre-line leading-relaxed text-[#3f4a5e]">{m.description}</p>
            </div>
          )}

          {specs.length > 0 && (
            <div className="rounded-2xl border border-[#e8ebf0] bg-white p-6">
              <h2 className="mb-3 text-[17px] font-bold text-[#1f2a3d]">Thông số kỹ thuật</h2>
              <table className="w-full text-[13.5px]">
                <tbody>
                  {specs.map(([key, value]) => (
                    <tr key={key} className="border-b border-[#f0f2f5] last:border-0">
                      <td className="w-2/5 py-2.5 pr-3 align-top text-[#7a8597]">{key}</td>
                      <td className="py-2.5 align-top font-medium text-[#1f2a3d]">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-[#e8ebf0] bg-white p-6 lg:sticky lg:top-24">
          <h2 className="mb-3 text-[17px] font-bold text-[#1f2a3d]">Nhà cung cấp</h2>
          <div className="flex items-center gap-3">
            <div
              className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[14px] text-sm font-extrabold"
              style={{ background: avBg, color: avFg }}
            >
              {initialsOf(s.companyName)}
            </div>
            <div className="min-w-0">
              <div className="text-[15.5px] font-semibold leading-snug text-[#1f2a3d]">{s.companyName}</div>
              {s.isVerified && <div className="text-[12.5px] font-medium text-[#17835c]">✓ Đã xác minh</div>}
            </div>
          </div>
          <div className="my-4 text-[13.5px]">
            {[
              s.province ? ['Khu vực', s.province] : null,
              types ? ['Loại hình', types] : null,
              ['Sản phẩm đang bán', String(s._count.materials)],
            ]
              .filter((r): r is string[] => r !== null)
              .map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-[#f4f5f7] py-1.5 last:border-0">
                  <span className="text-[#7a8597]">{label}</span>
                  <b className="text-right font-semibold text-[#1f2a3d]">{value}</b>
                </div>
              ))}
          </div>
          <div className="flex flex-col gap-2">
            <Link href={`/suppliers/${s.id}`} className="rounded-[10px] border border-[#e8ebf0] p-2.5 text-center text-[13px] font-semibold text-[#3f4a5e]">
              Xem hồ sơ công ty
            </Link>
          </div>
        </aside>
      </section>

      {/* Sản phẩm khác của công ty */}
      {others.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-[#1f2a3d]">Sản phẩm khác của {s.companyName}</h2>
            <Link href={`/suppliers/${s.id}`} className="text-[13px] font-semibold text-[#c2410c]">Xem tất cả →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {others.map((o) => {
              const st = (o.category && CATEGORY_STYLES[o.category.slug]) || DEFAULT_STYLE;
              const photo = toStrings(o.images)[0];
              const p = formatPrice(o.priceMinCents, o.priceMaxCents, o.currency);
              return (
                <Link
                  key={o.id}
                  href={`/products/${o.id}`}
                  className="group overflow-hidden rounded-[14px] border border-[#e8ebf0] bg-white transition hover:border-[#f0c9a6]"
                >
                  <div
                    className="relative h-[104px] overflow-hidden"
                    style={photo ? undefined : { background: `linear-gradient(120deg, ${st.from}, ${st.to})` }}
                  >
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt={o.name} className="h-full w-full object-cover" />
                    ) : (
                      st.icon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/icon/${st.icon}.png`} alt="" className="absolute -bottom-1.5 right-2 h-[70px] w-[70px] -rotate-6 opacity-[0.16] mix-blend-multiply" />
                      )
                    )}
                  </div>
                  <div className="p-3">
                    <div className="line-clamp-2 min-h-[38px] text-[13.5px] font-semibold leading-snug text-[#1f2a3d] group-hover:text-[#c2410c]">
                      {o.name}
                    </div>
                    <div className={`mt-1.5 text-sm ${p ? 'font-bold text-[#1f2a3d]' : 'text-[12.5px] font-medium italic text-[#7a8597]'}`}>
                      {p ?? 'Liên hệ báo giá'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}