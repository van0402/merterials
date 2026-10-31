import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { RfqModal } from '@/components/site/rfq-modal';
import { AVATAR_COLORS, CATEGORY_STYLES, DEFAULT_STYLE, hashOf, initialsOf } from '@/lib/category-style';

export const metadata = {
  title: 'Sản phẩm | Supply Merterial',
  description: 'Vật liệu và thiết bị do các nhà cung cấp đã được SMEE duyệt đăng bán. Gửi yêu cầu báo giá trực tiếp.',
};

const PAGE_SIZE = 12;
// Khoảng giá (giá lưu theo VND). Chỉ khớp sản phẩm đã có giá.
const PRICE_RANGES: Record<string, { label: string; where: Prisma.MaterialWhereInput }> = {
  lt100: { label: 'Dưới 100.000đ', where: { priceMinCents: { lt: 100000 } } },
  mid: { label: '100.000đ – 500.000đ', where: { priceMinCents: { gte: 100000, lte: 500000 } } },
  gt500: { label: 'Trên 500.000đ', where: { priceMinCents: { gt: 500000 } } },
};

const SORTS = {
  new: 'Mới nhất',
  price_asc: 'Giá thấp đến cao',
  price_desc: 'Giá cao đến thấp',
  name: 'Tên A → Z',
} as const;
type SortKey = keyof typeof SORTS;

type Params = {
  q?: string; category?: string; price?: string; priced?: string;
  verified?: string; sort?: string; page?: string;
};

const SELECT_CLASS =
  'h-10 rounded-[10px] border border-[#e8ebf0] bg-white px-3 text-[13.5px] text-[#3f4a5e] outline-none focus:border-[#f0b98a]';

function formatPrice(min: number | null, max: number | null, currency: string) {
  if (min == null && max == null) return null;
  const fmt = (v: number) => v.toLocaleString('vi-VN') + (currency === 'VND' ? 'đ' : ` ${currency}`);
  if (min != null && max != null && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max)!);
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;

  // Đọc và kiểm tra tham số trên đường dẫn
  const q = (sp.q ?? '').trim();
  const category = sp.category ?? '';
  const price = Object.keys(PRICE_RANGES).includes(sp.price ?? '') ? sp.price! : '';
  const priced = sp.priced === '1';
  const verified = sp.verified === '1';
  const sort: SortKey = Object.keys(SORTS).includes(sp.sort ?? '') ? (sp.sort as SortKey) : 'new';
  const page = Math.max(1, Number(sp.page) || 1);

  // Điều kiện lọc: chỉ sản phẩm đang bán của công ty đã duyệt
  const and: Prisma.MaterialWhereInput[] = [];
  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    });
  }
  if (category) and.push({ category: { slug: category } });
  if (price) and.push(PRICE_RANGES[price].where);
  else if (priced) and.push({ OR: [{ priceMinCents: { not: null } }, { priceMaxCents: { not: null } }] });

  const where: Prisma.MaterialWhereInput = {
    isActive: true,
    supplierProfile: { status: 'APPROVED', ...(verified ? { isVerified: true } : {}) },
    AND: and,
  };

  const orderBy: Prisma.MaterialOrderByWithRelationInput[] = [
    sort === 'price_asc'
      ? { priceMinCents: { sort: 'asc', nulls: 'last' } }
      : sort === 'price_desc'
        ? { priceMinCents: { sort: 'desc', nulls: 'last' } }
        : sort === 'name'
          ? { name: 'asc' }
          : { createdAt: 'desc' },
    { id: 'asc' }, // ổn định thứ tự khi phân trang
  ];

  const [materials, total, categories] = await Promise.all([
    prisma.material.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        unit: true,
        priceMinCents: true,
        priceMaxCents: true,
        currency: true,
        images: true,
        category: { select: { name: true, slug: true } },
        supplierProfile: { select: { id: true, companyName: true, isVerified: true } },
      },
    }),
    prisma.material.count({ where }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { name: true, slug: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Tạo đường dẫn mới mà vẫn giữ các bộ lọc đang chọn
  function buildHref(overrides: Partial<Params>) {
    const current: Params = {
      q, category, price, priced: priced ? '1' : '', verified: verified ? '1' : '',
      sort, page: String(page), ...overrides,
    };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) {
      if (!v) continue;
      if ((k === 'sort' && v === 'new') || (k === 'page' && v === '1')) continue;
      params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/products?${qs}` : '/products';
  }

  return (
    <div>
      {/* Tiêu đề + ô tìm + bộ lọc: một form GET */}
      <form action="/products" method="GET">
        <section className="border-b border-[#f3e6d8] bg-gradient-to-b from-[#fff4e9] to-transparent">
          <div className="mx-auto max-w-6xl px-4 pb-7 pt-8">
            <p className="text-[12.5px] text-[#a3acba]">
              <Link href="/" className="hover:underline">Trang chủ</Link> / Sản phẩm
            </p>
            <h1 className="mt-2 text-[30px] font-bold tracking-tight text-[#1f2a3d]">Sản phẩm</h1>
            <p className="mt-1.5 max-w-xl text-[#7a8597]">
              Vật liệu và thiết bị do các nhà cung cấp đã được duyệt đăng bán. Bấm &quot;Yêu cầu báo giá&quot; để nhận giá trực tiếp.
            </p>
            <div className="mt-5 flex max-w-2xl rounded-xl border border-[#efd9c4] bg-white p-1.5 shadow-[0_6px_20px_rgba(234,106,18,0.07)]">
              <input
                name="q"
                defaultValue={q}
                placeholder="Tìm theo tên sản phẩm hoặc vật liệu"
                className="min-w-0 flex-1 bg-transparent px-3 text-[#1f2a3d] outline-none"
              />
              <button type="submit" className="h-10 rounded-lg bg-[#ea6a12] px-5 text-sm font-semibold text-white">
                Tìm kiếm
              </button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center gap-2.5 pt-5">
            <select name="category" defaultValue={category} className={SELECT_CLASS}>
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <select name="price" defaultValue={price} className={SELECT_CLASS}>
              <option value="">Mọi mức giá</option>
              {Object.entries(PRICE_RANGES).map(([value, r]) => (
                <option key={value} value={value}>{r.label}</option>
              ))}
            </select>
            <label className="cursor-pointer">
              <input type="checkbox" name="priced" value="1" defaultChecked={priced} className="peer sr-only" />
              <span className="inline-block rounded-[10px] border border-[#e8ebf0] bg-white px-3.5 py-2.5 text-[13.5px] text-[#3f4a5e] peer-checked:border-[#f3c9a3] peer-checked:bg-[#fff3e8] peer-checked:font-semibold peer-checked:text-[#c2410c]">
                Có giá niêm yết
              </span>
            </label>
            <label className="cursor-pointer">
              <input type="checkbox" name="verified" value="1" defaultChecked={verified} className="peer sr-only" />
              <span className="inline-block rounded-[10px] border border-[#e8ebf0] bg-white px-3.5 py-2.5 text-[13.5px] text-[#3f4a5e] peer-checked:border-[#f3c9a3] peer-checked:bg-[#fff3e8] peer-checked:font-semibold peer-checked:text-[#c2410c]">
                ✓ Nhà cung cấp đã xác minh
              </span>
            </label>
            <select name="sort" defaultValue={sort} className={SELECT_CLASS}>
              {Object.entries(SORTS).map(([value, label]) => (
                <option key={value} value={value}>Sắp xếp: {label}</option>
              ))}
            </select>
            <button type="submit" className="h-10 rounded-[10px] bg-[#1f2a3d] px-4 text-[13.5px] font-semibold text-white">
              Lọc
            </button>
          </div>
        </div>
      </form>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <p className="mb-5 mt-6 text-base text-[#7a8597]">
          <b className="font-semibold text-[#1f2a3d]">{total}</b> sản phẩm
        </p>

        {materials.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-[#7a8597]">
            Không tìm thấy sản phẩm phù hợp.{' '}
            <Link href="/products" className="font-semibold text-[#c2410c] underline">Xóa bộ lọc</Link>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {materials.map((m) => {
            const style = (m.category && CATEGORY_STYLES[m.category.slug]) || DEFAULT_STYLE;
            const images = Array.isArray(m.images) ? (m.images as unknown[]) : [];
            const photo = typeof images[0] === 'string' && images[0] ? (images[0] as string) : null;
            const priceText = formatPrice(m.priceMinCents, m.priceMaxCents, m.currency);
            const [avBg, avFg] = AVATAR_COLORS[hashOf(m.supplierProfile.companyName) % AVATAR_COLORS.length];

            return (
              <article
                key={m.id}
                className="group relative flex flex-col overflow-hidden rounded-[14px] border border-[#e8ebf0] bg-white transition hover:border-[#f0c9a6]"
              >
                {/* Ảnh sản phẩm thật nếu có; chưa có thì màu + icon theo ngành (không dùng ảnh giả) */}
                <div
                  className="relative h-[138px] overflow-hidden"
                  style={photo ? undefined : { background: `linear-gradient(120deg, ${style.from}, ${style.to})` }}
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    style.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/icon/${style.icon}.png`}
                        alt=""
                        className="absolute -bottom-1.5 right-3 h-[84px] w-[84px] -rotate-6 opacity-[0.16] mix-blend-multiply"
                      />
                    )
                  )}
                  {m.category && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-[#4a5b75]">
                      {m.category.name}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
                  {/* Chưa có trang chi tiết sản phẩm nên bấm vào sang hồ sơ công ty */}
                  <Link
  href={`/products/${m.id}`}
                    className="line-clamp-2 min-h-[41px] text-[14.5px] font-semibold leading-snug text-[#1f2a3d] after:absolute after:inset-0 group-hover:text-[#c2410c]"
                  >
                    {m.name}
                  </Link>

                  {priceText ? (
                    <div className="mt-2 text-[15px] font-bold text-[#1f2a3d]">
                      {priceText}
                      {m.unit && <small className="ml-1 text-xs font-normal text-[#a3acba]">/{m.unit}</small>}
                    </div>
                  ) : (
                    <div className="mt-2 text-[13px] font-medium italic text-[#7a8597]">Liên hệ báo giá</div>
                  )}

                  <div className="mt-2.5 flex items-center gap-2 border-t border-[#f0f2f5] pt-2.5 text-[12.5px] text-[#7a8597]">
                    <span
                      className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg text-[10px] font-extrabold"
                      style={{ background: avBg, color: avFg }}
                    >
                      {initialsOf(m.supplierProfile.companyName)}
                    </span>
                    <span className="min-w-0 truncate text-[#3f4a5e]">{m.supplierProfile.companyName}</span>
                    {m.supplierProfile.isVerified && <span className="text-[#17835c]">✓</span>}
                  </div>

                  <div className="relative z-10 mt-3">
                    <RfqModal
                      supplierProfileId={m.supplierProfile.id}
                      supplierName={m.supplierProfile.companyName}
                      materialId={m.id}
                      verified={m.supplierProfile.isVerified}
                      buttonLabel="Yêu cầu báo giá"
                      buttonClassName="block w-full rounded-[9px] border border-[#f0b98a] bg-white py-2 text-center text-[12.5px] font-semibold text-[#c2410c] hover:bg-[#fff3e8]"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between text-sm text-[#7a8597]">
            {page > 1 ? (
              <Link href={buildHref({ page: String(page - 1) })} className="rounded-lg border bg-white px-3.5 py-2 font-semibold">
                ← Trang trước
              </Link>
            ) : (
              <span />
            )}
            <span>Trang {page} / {totalPages}</span>
            {page < totalPages ? (
              <Link href={buildHref({ page: String(page + 1) })} className="rounded-lg border bg-white px-3.5 py-2 font-semibold">
                Trang sau →
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>
    </div>
  );
}