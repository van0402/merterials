import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { categorySuppliers, categoryMaterials } from '@/lib/search';
import { SupplierCard } from '@/components/site/supplier-card';
import { MaterialCard } from '@/components/site/material-card';

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
};

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

  const tabClass = (active: boolean) =>
    `rounded-full border px-3.5 py-2 text-[13px] font-extrabold ${
      active ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="mb-3 text-[12px] text-muted-foreground">
        <Link href="/" className="hover:underline">Trang chủ</Link> › Danh mục › {category.name}
      </p>

      <div className="flex items-start gap-4 rounded-2xl border bg-white p-5">
        <div>
          <h1 className="text-xl font-black">{category.name}</h1>
          {DESCRIPTIONS[slug] && <p className="mt-1 text-[13px] text-muted-foreground">{DESCRIPTIONS[slug]}</p>}
          <div className="mt-2.5 flex gap-2 text-[12px]">
            <span className="rounded-full bg-orange-50 px-2.5 py-1 font-bold text-orange-800">{suppliers.length} nhà cung cấp</span>
            <span className="rounded-full bg-orange-50 px-2.5 py-1 font-bold text-orange-800">{materials.length} sản phẩm</span>
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
        <div className="mt-4 space-y-3">
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
    </div>
  );
}