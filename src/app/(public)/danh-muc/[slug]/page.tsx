import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { categorySuppliers, categoryMaterials } from '@/lib/search';
import { SupplierCard } from '@/components/site/supplier-card';
import { MaterialCard } from '@/components/site/material-card';
import { CATEGORY_CONTENT } from '@/lib/category-content';

const DESCRIPTIONS: Record<string, string> = {
  'tu-dong-hoa': 'Robot công nghiệp, AMR, MES/IoT nhà máy và thiết bị tự động hóa.',
  'nhua-polymer': 'Hạt nhựa TPE/TPR, masterbatch, compound, khuôn thổi và các vật liệu polymer cho sản xuất.',
  'may-moc-thiet-bi': 'Máy ép nhựa, máy nén khí, máy hàn siêu âm và thiết bị sản xuất.',
  'hoa-chat-hoa-dau': 'Chất màu, keo công nghiệp, hóa dầu và phụ gia cho sản xuất.',
  'vat-lieu-moi': 'PTFE, vật liệu quang điện, vật liệu công nghệ cao và vật liệu kỹ thuật.',
  'khuon-mau-co-khi': 'Khuôn thổi/ép, gia công CNC, cơ khí chính xác và tooling.',
  'dien-dien-tu-cap': 'Dây cáp điện, cảm biến, thiết bị chiếu sáng và linh kiện điện tử.',
  'in-an': 'Máy in nhãn, RFID, vật tư in Flexo và giải pháp bao bì.',
  'cntt-phan-mem-ai': 'Giải pháp IoT nhà máy, AI bảo trì thiết bị.',
  'an-toan-nang-luong': 'Thiết bị an toàn PCCC, tiết kiệm năng lượng.',
  'do-luong-kiem-tra': '3D scan, laser đo lường, kiểm định CNC.',
  'kho-van-nang-ha': 'Xe nâng, kho thông minh, ắc quy công nghiệp.',
  'vat-lieu-xay-dung': 'Thép, xi măng, gạch, vật liệu hoàn thiện, cách nhiệt và chống thấm cho công trình.',
};

// Ảnh nền banner theo ngành; ngành chưa có ảnh riêng dùng ảnh nhà máy chung
const BANNERS: Record<string, string> = {
  'tu-dong-hoa': '/images/lap-dat-thiet-bi-cong-nghiep.jpg',
  'nhua-polymer': '/images/tudonghoa.jpg',
};
const DEFAULT_BANNER = '/images/hero-nhamay.webp';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await prisma.category.findFirst({
    where: { slug, isActive: true },
    select: { name: true },
  });
  if (!c) return { title: 'Không tìm thấy danh mục' };

  const title = `Nhà cung cấp ${c.name} uy tín – Danh sách đã duyệt`;
  const description = (DESCRIPTIONS[slug] || `Danh sách nhà cung cấp ${c.name} đã được SMEE duyệt hồ sơ.`) + ' Gửi yêu cầu báo giá miễn phí.';

  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: `/danh-muc/${slug}` },
    openGraph: { title, description },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { slug } = await params;
  const { mode: modeParam } = await searchParams;
  const mode = modeParam === 'product' ? 'product' : 'supplier';
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    select: { name: true, icon: true },
  });
  if (!category) notFound();

  const [suppliers, materials] = await Promise.all([categorySuppliers(slug), categoryMaterials(slug)]);
  const results = mode === 'product' ? materials : suppliers;
    const related = await prisma.category.findMany({
    where: { isActive: true, slug: { not: slug } },
    select: { name: true, slug: true },
    orderBy: { name: 'asc' },
    take: 6,
  });
  const content = CATEGORY_CONTENT[slug];

  const tabClass = (active: boolean) =>
    `rounded-full border px-3.5 py-2 text-[13px] font-extrabold ${
      active ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="mb-3 text-[12px] text-muted-foreground">
        <Link href="/" className="hover:underline">Trang chủ</Link> › Danh mục › {category.name}
      </p>

            <div
        className="relative flex min-h-[210px] items-end overflow-hidden rounded-[22px] text-white"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(15,21,34,0.35), rgba(15,21,34,0.85)), url(${BANNERS[slug] ?? DEFAULT_BANNER})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      >
        <div className="max-w-[720px] p-6 sm:p-7">
          <div className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#ffb067]">Danh mục ngành</div>
          <h1 className="mb-1.5 mt-1 text-[26px] font-black leading-tight tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:text-[34px]">
            {category.name}
          </h1>
          {DESCRIPTIONS[slug] && <p className="text-[14.5px] text-white/90">{DESCRIPTIONS[slug]}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
            <span className="rounded-full bg-white/15 px-3 py-1 font-bold backdrop-blur">{suppliers.length} nhà cung cấp</span>
            <span className="rounded-full bg-white/15 px-3 py-1 font-bold backdrop-blur">{materials.length} sản phẩm</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Link href={`/danh-muc/${slug}`} className={tabClass(mode === 'supplier')}>
          Nhà cung cấp {suppliers.length}
        </Link>
        <Link href={`/danh-muc/${slug}?mode=product`} className={tabClass(mode === 'product')}>
          Sản phẩm {materials.length}
        </Link>
      </div>

      {results.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Danh mục này chưa có {mode === 'product' ? 'sản phẩm' : 'nhà cung cấp'} nào.{' '}
          <Link href="/tim-kiem" className="font-bold text-orange-600 underline">
            Tìm trong toàn bộ hệ thống
          </Link>
        </div>
      )}

      {mode === 'supplier' ? (
        <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s: any) => (
            <SupplierCard key={s.id} s={s} />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {materials.map((m: any) => (
            <MaterialCard key={m.id} m={m} />
          ))}
        </div>
      )}

           {content && (
        <section className="mt-10 rounded-2xl border border-[#ead9c6] bg-white p-6">
          <h2 className="text-lg font-black">Tìm hiểu về ngành {category.name}</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-700">{content.intro[0]}</p>

          <details className="group mt-2">
            <summary className="cursor-pointer text-[13px] font-extrabold text-[#c2410c]">
              Xem thêm: ứng dụng và lưu ý khi chọn nhà cung cấp
            </summary>
            <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-slate-700">
              {content.intro.slice(1).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-[15px] font-extrabold">Ứng dụng phổ biến</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13.5px] text-slate-700">
                  {content.uses.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[15px] font-extrabold">Lưu ý khi chọn nhà cung cấp</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13.5px] text-slate-700">
                  {content.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        </section>
      )}

      {related.length > 0 && (
        <div className="mb-6 mt-7">
          <h3 className="mb-2.5 text-[14px] font-extrabold">Ngành liên quan</h3>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/danh-muc/${r.slug}`}
                className="rounded-full border border-[#ead9c6] bg-white px-3.5 py-1.5 text-[13px] font-bold hover:border-[#f26b1d] hover:text-[#c2410c]"
              >
                {r.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}