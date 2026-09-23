import Link from 'next/link';
import { searchMaterials, searchSuppliers } from '@/lib/search';
import { RfqModal } from '@/components/site/rfq-modal';
function formatPrice(minCents: number | null, maxCents: number | null, currency: string) {
  if (minCents == null && maxCents == null) return null;
  const fmt = (v: number) => Number(v).toLocaleString('vi-VN') + (currency === 'VND' ? 'đ' : ` ${currency}`);
  if (minCents != null && maxCents != null && minCents !== maxCents) return `${fmt(minCents)} – ${fmt(maxCents)}`;
  return fmt((minCents ?? maxCents)!);
}

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: 'Nhà sản xuất',
  DISTRIBUTOR: 'Nhà phân phối',
  IMPORTER: 'Nhà nhập khẩu',
  OEM_ODM: 'Đơn vị gia công',
  SYSTEM_INTEGRATOR: 'Tích hợp hệ thống',
  TECHNICAL_SERVICE: 'Dịch vụ kỹ thuật',
};

const REGIONS = ['Bắc Ninh', 'Hà Nội', 'Hải Phòng', 'TP. Hồ Chí Minh', 'Bình Dương', 'Đà Nẵng'];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mode?: string; region?: string; verified?: string; type?: string }>;
}) {
  const { q = '', mode: modeParam, region = '', verified, type = '' } = await searchParams;
  const mode = modeParam === 'product' ? 'product' : 'supplier';
  const verifiedOnly = verified === '1';

  const [materials, suppliers] = q.trim()
    ? await Promise.all([
        searchMaterials(q, region, verifiedOnly, type),
        searchSuppliers(q, region, verifiedOnly, type),
      ])
    : [[], []];

  const results = mode === 'product' ? materials : suppliers;

  function buildHref(overrides: Partial<{ mode: string; region: string; verified: string; type: string }>) {
    const p = new URLSearchParams({ q, mode, region, type });
    if (verifiedOnly) p.set('verified', '1');
    Object.entries(overrides).forEach(([key, value]) => {
      if (value) p.set(key, value);
      else p.delete(key);
    });
    return `/tim-kiem?${p.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <form action="/tim-kiem" method="GET" className="mb-6 flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row">
        <input type="hidden" name="mode" value={mode} />
        {region && <input type="hidden" name="region" value={region} />}
        {type && <input type="hidden" name="type" value={type} />}
        {verifiedOnly && <input type="hidden" name="verified" value="1" />}
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Tìm sản phẩm, vật liệu, nhà cung cấp..."
          className="h-11 flex-1 rounded-lg border px-4 text-sm outline-none focus:border-orange-300"
        />
        <button type="submit" className="h-11 rounded-lg bg-orange-500 px-6 text-sm font-extrabold text-white">
          Tìm kiếm
        </button>
      </form>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-max space-y-5 rounded-2xl border bg-white p-4">
          <div>
            <b className="mb-2 block text-sm font-black">Đã xác minh</b>
            <Link href={buildHref({ verified: verifiedOnly ? '' : '1' })} className="flex items-center gap-2 text-[13px] text-slate-600">
              <span className={`flex h-4 w-4 items-center justify-center rounded border ${verifiedOnly ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300'}`}>
                {verifiedOnly && '✓'}
              </span>
              Chỉ hiện đã xác minh
            </Link>
          </div>

          <div>
            <b className="mb-2 block text-sm font-black">Loại nhà cung cấp</b>
            <div className="space-y-2">
              {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
                <Link
                  key={value}
                  href={buildHref({ type: type === value ? '' : value })}
                  className="flex items-center gap-2 text-[13px] text-slate-600"
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded border ${type === value ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300'}`}>
                    {type === value && '✓'}
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <b className="mb-2 block text-sm font-black">Khu vực</b>
            <div className="space-y-2">
              {REGIONS.map((r) => (
                <Link
                  key={r}
                  href={buildHref({ region: region === r ? '' : r })}
                  className="flex items-center gap-2 text-[13px] text-slate-600"
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded border ${region === r ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300'}`}>
                    {region === r && '✓'}
                  </span>
                  {r}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <main>
          <p className="text-sm text-muted-foreground">
            {q ? `Kết quả cho "${q}"` : 'Nhập từ khoá để tìm kiếm'}
            {region && ` tại ${region}`}
          </p>

          <div className="mt-4 flex gap-2">
            <Link
              href={buildHref({ mode: 'supplier' })}
              className={`rounded-full border px-3.5 py-2 text-[13px] font-extrabold ${mode === 'supplier' ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'}`}
            >
              Nhà cung cấp {suppliers.length}
            </Link>
            <Link
              href={buildHref({ mode: 'product' })}
              className={`rounded-full border px-3.5 py-2 text-[13px] font-extrabold ${mode === 'product' ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'}`}
            >
              Sản phẩm {materials.length}
            </Link>
          </div>

          {results.length === 0 && q && (
            <div className="mt-8 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Không tìm thấy kết quả phù hợp. Thử từ khoá khác hoặc bỏ bớt bộ lọc.
            </div>
          )}

          {mode === 'supplier' ? (
            <div className="mt-4 space-y-3">
              {suppliers.map((s: any) => (
                <div key={s.id} className="grid grid-cols-[64px_1fr] gap-4 rounded-2xl border bg-white p-4 sm:grid-cols-[72px_1fr_auto]">
                  <div className="flex h-[64px] w-[64px] items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-black text-white">
                    {initialsOf(s.company_name)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-[15px] font-black">{s.company_name}</b>
                      {s.is_verified && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                          ✓ Đã xác minh
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                      <span>📍 {s.province || 'Việt Nam'}</span>
                      {Array.isArray(s.business_types) && s.business_types.length > 0 && (
                        <span>🏭 {s.business_types.map((bt: string) => BUSINESS_TYPE_LABELS[bt] || bt).join(', ')}</span>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-[12.5px] text-muted-foreground">
                      {s.description || s.industry_raw || 'Chưa cập nhật thông tin doanh nghiệp.'}
                    </p>
                  </div>
                                    <div className="col-span-2 flex gap-2 sm:col-span-1 sm:flex-col">
                    <Link href={`/suppliers/${s.id}`} className="flex-1 rounded-lg border px-3 py-2 text-center text-[12px] font-extrabold sm:flex-none">
                      Xem hồ sơ
                    </Link>
                    <RfqModal supplierProfileId={s.id} supplierName={s.company_name} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
              {materials.map((m: any) => {
                const images = Array.isArray(m.images) ? m.images : [];
                const price = formatPrice(m.price_min_cents, m.price_max_cents, m.currency);
                return (
                  <div
                    key={m.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-orange-200"
                  >
                    <Link href={`/suppliers/${m.supplier_id}`}>
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
                        {m.category_name && (
                          <span className="mt-1.5 inline-block rounded-full bg-orange-50 px-2 py-0.5 text-[9.5px] font-bold text-orange-700">
                            {m.category_name}
                          </span>
                        )}
                        <div className={`mt-1.5 text-[12px] font-black ${price ? '' : 'italic text-muted-foreground'}`}>
                          {price || 'Liên hệ báo giá'}
                        </div>
                        <div className="mt-1.5 truncate text-[10px] text-muted-foreground">{m.company_name}</div>
                      </div>
                    </Link>
                    <div className="border-t p-2">
                      <RfqModal supplierProfileId={m.supplier_id} supplierName={m.company_name} materialId={m.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}