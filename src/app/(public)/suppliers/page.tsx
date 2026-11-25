import Link from 'next/link';
import type { BusinessType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { RfqModal } from '@/components/site/rfq-modal';
import { CompanyAvatar } from '@/components/site/company-avatar';

export const metadata = {
  title: 'Nhà cung cấp',
  description: 'Danh sách doanh nghiệp đã được SMEE duyệt hồ sơ. Lọc theo ngành, khu vực và gửi yêu cầu báo giá trực tiếp.',
};

const PAGE_SIZE = 9;

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  MANUFACTURER: 'Nhà sản xuất',
  DISTRIBUTOR: 'Nhà phân phối',
  IMPORTER: 'Nhà nhập khẩu',
  OEM_ODM: 'Gia công OEM/ODM',
  SYSTEM_INTEGRATOR: 'Tích hợp hệ thống',
  TECHNICAL_SERVICE: 'Dịch vụ kỹ thuật',
};

// label hiện cho người dùng, match là chữ dùng để tìm trong cột province
const REGIONS = [
  { label: 'Bắc Ninh', match: 'Bắc Ninh' },
  { label: 'Hà Nội', match: 'Hà Nội' },
  { label: 'Hải Phòng', match: 'Hải Phòng' },
  { label: 'TP. Hồ Chí Minh', match: 'Hồ Chí Minh' },
  { label: 'Bình Dương', match: 'Bình Dương' },
  { label: 'Đà Nẵng', match: 'Đà Nẵng' },
  { label: 'Nước ngoài', match: '' },
];

const SORTS = { new: 'Mới duyệt', name: 'Tên A → Z', products: 'Nhiều sản phẩm' } as const;
type SortKey = keyof typeof SORTS;

// Ảnh bìa theo ngành: CHỈ gán khi danh mục khớp. Ngành khác dùng bìa trung tính (màu + icon).
const COVER_PHOTOS: Record<string, string[]> = {
  'vat-lieu-moi': ['/images/covers/new-material.webp'],
  'may-moc-thiet-bi': ['/images/covers/equipment-robot.webp', '/images/covers/equipment-pipes.webp'],
  'nhua-polymer': ['/images/covers/polymer.webp'],
  'tu-dong-hoa': ['/images/covers/automation.webp'],
};

type Neutral = { from: string; to: string; icon: string };
const NEUTRAL_COVERS: Record<string, Neutral> = {
  'hoa-chat-hoa-dau': { from: '#e0ecfb', to: '#bcd6f4', icon: 'water-pump' },
  'khuon-mau-co-khi': { from: '#e8e9ee', to: '#d0d3de', icon: 'product-lifecycle' },
  'dien-dien-tu-cap': { from: '#fdf0cc', to: '#f8de94', icon: 'electric-panel' },
  'in-an': { from: '#fbe3ec', to: '#f4c4d6', icon: 'print' },
  'cntt-phan-mem-ai': { from: '#e3e6fb', to: '#c6cdf5', icon: 'technology' },
  'an-toan-nang-luong': { from: '#e0f3e4', to: '#bfe5c8', icon: 'energy-storage' },
  'do-luong-kiem-tra': { from: '#dff4f8', to: '#b9e6ef', icon: 'vision' },
  'kho-van-nang-ha': { from: '#f1e6dc', to: '#e2cdb9', icon: 'scissor-lift' },
};
const DEFAULT_COVER: Neutral = { from: '#fff0e2', to: '#fde3cb', icon: '' }; // chưa có danh mục / ngành lạ

// Băm tên thành số cố định, để cùng một công ty luôn ra cùng một ảnh/màu (không đổi mỗi lần tải)
function hashOf(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

// Danh mục đầu tiên có ảnh khớp thì dùng ảnh; không thì bìa trung tính theo danh mục đầu
function coverFor(slugs: string[], name: string): { photo: string | null; neutral: Neutral } {
  const hit = slugs.find((s) => COVER_PHOTOS[s]);
  const photo = hit ? COVER_PHOTOS[hit][hashOf(name) % COVER_PHOTOS[hit].length] : null;
  return { photo, neutral: NEUTRAL_COVERS[slugs[0]] ?? DEFAULT_COVER };
}

type Params = {
  q?: string; category?: string; region?: string; type?: string;
  verified?: string; sort?: string; view?: string; page?: string;
};

const SELECT_CLASS =
  'h-10 rounded-[10px] border border-[#e8ebf0] bg-white px-3 text-[13.5px] text-[#3f4a5e] outline-none focus:border-[#f0b98a]';

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;

  // Đọc và kiểm tra các tham số trên đường dẫn (giá trị lạ thì bỏ qua)
  const q = (sp.q ?? '').trim();
  const category = sp.category ?? '';
  const region = REGIONS.some((r) => r.label === sp.region) ? sp.region! : '';
  const type = Object.keys(BUSINESS_TYPE_LABELS).includes(sp.type ?? '') ? (sp.type as BusinessType) : undefined;
  const verified = sp.verified === '1';
  const sort: SortKey = Object.keys(SORTS).includes(sp.sort ?? '') ? (sp.sort as SortKey) : 'new';
  const view = sp.view === 'list' ? 'list' : 'grid';
  const page = Math.max(1, Number(sp.page) || 1);

  // Điều kiện lọc: chỉ công ty đã duyệt
  const regionMatch = REGIONS.find((r) => r.label === region);
  const where: Prisma.SupplierProfileWhereInput = {
    status: 'APPROVED',
    ...(q
      ? {
          OR: [
            { companyName: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { industryRaw: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(category ? { categories: { some: { category: { slug: category } } } } : {}),
    ...(region === 'Nước ngoài'
      ? { country: { not: 'Việt Nam' } }
      : regionMatch
        ? { province: { contains: regionMatch.match, mode: 'insensitive' } }
        : {}),
    ...(type ? { businessTypes: { has: type } } : {}),
    ...(verified ? { isVerified: true } : {}),
  };

  const orderBy: Prisma.SupplierProfileOrderByWithRelationInput[] = [
    sort === 'name' ? { companyName: 'asc' } : sort === 'products' ? { materials: { _count: 'desc' } } : { createdAt: 'desc' },
    { id: 'asc' }, // thêm id để thứ tự ổn định khi phân trang
  ];

  const [suppliers, total, categories] = await Promise.all([
    prisma.supplierProfile.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        companyName: true,
        description: true,
        industryRaw: true,
        province: true,
        country: true,
        logoUrl: true,
        coverImageUrl: true,
        isVerified: true,
        businessTypes: true,
        categories: { orderBy: { id: 'asc' }, select: { category: { select: { name: true, slug: true } } } },
        _count: { select: { categories: true, materials: { where: { isActive: true } } } },
      },
    }),
    prisma.supplierProfile.count({ where }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { name: true, slug: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Tạo đường dẫn mới mà vẫn giữ các bộ lọc đang chọn
  function buildHref(overrides: Partial<Params>) {
    const current: Params = {
      q, category, region, type: type ?? '', verified: verified ? '1' : '',
      sort, view, page: String(page), ...overrides,
    };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) {
      if (!v) continue;
      if ((k === 'sort' && v === 'new') || (k === 'view' && v === 'grid') || (k === 'page' && v === '1')) continue;
      params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/suppliers?${qs}` : '/suppliers';
  }

  return (
    <div>
      {/* Dải tiêu đề + ô tìm + bộ lọc: một form GET, bấm "Lọc" thì tải lại với ?q=...&category=... */}
      <form action="/suppliers" method="GET">
        {view === 'list' && <input type="hidden" name="view" value="list" />}

        <section className="border-b border-[#f3e6d8] bg-gradient-to-b from-[#fff4e9] to-transparent">
          <div className="mx-auto max-w-6xl px-4 pb-7 pt-8">
            <p className="text-[12.5px] text-[#a3acba]">
              <Link href="/" className="hover:underline">Trang chủ</Link> / Nhà cung cấp
            </p>
            <h1 className="mt-2 text-[30px] font-bold tracking-tight text-[#1f2a3d]">Nhà cung cấp</h1>
            <p className="mt-1.5 max-w-xl text-[#7a8597]">
              Doanh nghiệp đã được SMEE duyệt hồ sơ. Tìm theo ngành, khu vực và gửi yêu cầu báo giá trực tiếp.
            </p>
            <div className="mt-5 flex max-w-2xl rounded-xl border border-[#efd9c4] bg-white p-1.5 shadow-[0_6px_20px_rgba(234,106,18,0.07)]">
              <input
                name="q"
                defaultValue={q}
                placeholder="Tìm theo tên công ty hoặc ngành nghề"
                className="min-w-0 flex-1 bg-transparent px-3 text-[#1f2a3d] outline-none"
              />
              <button type="submit" className="h-10 rounded-lg bg-[#ea6a12] px-5 text-sm font-semibold text-white">
                Tìm kiếm
              </button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-1.5 pt-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <select name="category" defaultValue={category} className={SELECT_CLASS}>
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <select name="region" defaultValue={region} className={SELECT_CLASS}>
                <option value="">Toàn quốc</option>
                {REGIONS.map((r) => (
                  <option key={r.label} value={r.label}>{r.label}</option>
                ))}
              </select>
              <select name="type" defaultValue={type ?? ''} className={SELECT_CLASS}>
                <option value="">Mọi loại hình</option>
                {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <label className="cursor-pointer">
                <input type="checkbox" name="verified" value="1" defaultChecked={verified} className="peer sr-only" />
                <span className="inline-block rounded-[10px] border border-[#e8ebf0] bg-white px-3.5 py-2.5 text-[13.5px] text-[#3f4a5e] peer-checked:border-[#f3c9a3] peer-checked:bg-[#fff3e8] peer-checked:font-semibold peer-checked:text-[#c2410c]">
                  ✓ Đã xác minh
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

            {/* Đổi kiểu xem: là link nên không cần JavaScript */}
            <div className="flex overflow-hidden rounded-[10px] border border-[#e8ebf0] bg-white text-[15px]">
              <Link href={buildHref({ view: 'grid' })} title="Dạng lưới"
                className={`flex h-10 w-10 items-center justify-center ${view === 'grid' ? 'bg-[#1f2a3d] text-white' : 'text-[#a3acba]'}`}>▦</Link>
              <Link href={buildHref({ view: 'list' })} title="Dạng danh sách"
                className={`flex h-10 w-10 items-center justify-center ${view === 'list' ? 'bg-[#1f2a3d] text-white' : 'text-[#a3acba]'}`}>☰</Link>
            </div>
          </div>
        </div>
      </form>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <p className="mb-5 mt-6 text-base text-[#7a8597]">
          <b className="font-semibold text-[#1f2a3d]">{total}</b> nhà cung cấp
        </p>

        {suppliers.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-[#7a8597]">
            Không tìm thấy nhà cung cấp phù hợp.{' '}
            <Link href="/suppliers" className="font-semibold text-[#c2410c] underline">Xóa bộ lọc</Link>
          </div>
        )}

        <div className={view === 'list' ? 'space-y-3' : 'grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3'}>
          {suppliers.map((s) => {
            const location = [s.province, s.country].filter(Boolean).join(', ');
            const types = s.businessTypes.map((t) => BUSINESS_TYPE_LABELS[t]).join(', ');
            const desc = s.description || s.industryRaw || 'Chưa cập nhật thông tin doanh nghiệp.';
            const extra = Math.max(0, s._count.categories - 3);
const cover = coverFor(s.categories.map((c) => c.category.slug), s.companyName);
const logo = <CompanyAvatar name={s.companyName} logoUrl={s.logoUrl} size={56} />;
            const meta = (
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-[#7a8597]">
                {s.isVerified && <span className="font-medium text-[#17835c]">✓ Đã xác minh</span>}
                {(location || types) && <span>{[location, types].filter(Boolean).join(' · ')}</span>}
              </div>
            );
            const nameLink = (
              <Link href={`/suppliers/${s.id}`} className="line-clamp-2 text-base font-semibold leading-snug text-[#1f2a3d] after:absolute after:inset-0 group-hover:text-[#c2410c]">
                {s.companyName}
              </Link>
            );
            const quote = (
              <div className="relative z-10">
                <RfqModal
                  supplierProfileId={s.id}
                  supplierName={s.companyName}
                  verified={s.isVerified}
                  buttonLabel="Yêu cầu báo giá"
                  buttonClassName="text-[12.5px] font-semibold text-[#c2410c] hover:underline"
                />
              </div>
            );
            const productCount = (
              <span className="text-[12.5px] text-[#a3acba]">
                {s._count.materials > 0 ? `${s._count.materials} sản phẩm` : 'Chưa có sản phẩm'}
              </span>
            );

            // Kiểu danh sách: mỗi công ty một hàng
            if (view === 'list') {
              return (
                <article key={s.id} className="group relative flex flex-col gap-3 rounded-[14px] border border-[#e8ebf0] bg-white p-4 transition hover:border-[#f0c9a6] sm:flex-row sm:items-center sm:gap-5">
                  {logo}
                  <div className="min-w-0 sm:w-[300px]">
                    {nameLink}
                    {meta}
                  </div>
                  <p className="line-clamp-2 flex-1 text-[13.5px] text-[#3f4a5e]">{desc}</p>
                  <div className="flex items-center gap-4 sm:ml-auto">
                    {productCount}
                    {quote}
                  </div>
                </article>
              );
            }

            // Kiểu lưới: thẻ có dải bìa (ảnh bìa thật nếu có, không thì dải kem mỏng)
            return (
              <article key={s.id} className="group relative flex flex-col overflow-hidden rounded-[14px] border border-[#e8ebf0] bg-white transition hover:border-[#f0c9a6]">
                {s.coverImageUrl ? (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={s.coverImageUrl} alt="" className="h-[130px] w-full object-cover" />
) : cover.photo ? (
  <div className="relative h-[118px]">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={cover.photo} alt="" className="h-full w-full object-cover object-left" />
    <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-bold text-[#4a5b75]">
      Ảnh minh họa ngành
    </span>
  </div>
) : (
  <div
    className="relative h-[118px] overflow-hidden"
    style={{ background: `linear-gradient(120deg, ${cover.neutral.from}, ${cover.neutral.to})` }}
  >
    {cover.neutral.icon && (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/icon/${cover.neutral.icon}.png`}
        alt=""
        className="absolute right-3.5 top-1/2 h-[62px] w-[62px] -translate-y-1/2 -rotate-6 opacity-[0.16] mix-blend-multiply"
      />
    )}
  </div>
)}
                <div className="flex flex-1 flex-col px-5 pb-5">
                  <div className="relative z-10 -mt-7">{logo}</div>
                  <div className="mt-3 min-h-[64px]">
                    {nameLink}
                    {meta}
                  </div>
                  <p className="my-3 line-clamp-2 min-h-[42px] text-[13.5px] text-[#3f4a5e]">{desc}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5">
                   {s.categories.slice(0, 3).map((c) => (
                      <span key={c.category.name} className="rounded-full bg-[#f6f7f9] px-2.5 py-1 text-xs text-[#55637a]">
                        {c.category.name}
                      </span>
                    ))}
                    {extra > 0 && <span className="rounded-full bg-[#f6f7f9] px-2.5 py-1 text-xs text-[#55637a]">+{extra}</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#f0f2f5] pt-3">
                    {productCount}
                    {quote}
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