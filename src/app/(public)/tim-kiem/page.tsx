import Link from 'next/link';
import { searchMaterials, searchSuppliers } from '@/lib/search';
import { RfqModal } from '@/components/site/rfq-modal';
import { writeSearchReply } from '@/lib/ai';
import { SearchBar } from '@/components/site/search-bar';
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
function supplierReasons(s: any, words: string[], materials: any[]) {
  const hit = (text?: string | null) => {
    const t = (text ?? '').toLowerCase();
    return words.some((w) => t.includes(w));
  };
  const fields: string[] = [];
  if (hit(s.company_name)) fields.push('tên công ty');
  if (hit(s.industry_raw)) fields.push('ngành nghề');
  if (hit(s.description)) fields.push('mô tả');

  const productCount = materials.filter((m) => m.supplier_id === s.id).length;
  const parts: string[] = [];
  if (fields.length) parts.push(`từ khoá khớp ở ${fields.join(', ')}`);
  if (productCount) parts.push(`có ${productCount} sản phẩm khớp`);
  return parts.join('; ');
}
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mode?: string; region?: string; verified?: string; type?: string; ai?: string; qty?: string; extra?: string; ask?: string }>;
}) {
  const { q = '', mode: modeParam, region = '', verified, type = '', ai, qty = '', extra = '', ask = '' } = await searchParams;
  const isAi = ai === '1';
  const mode = modeParam === 'product' ? 'product' : 'supplier';
  const verifiedOnly = verified === '1';

  const [materials, suppliers] = q.trim()
    ? await Promise.all([
        searchMaterials(q, region, verifiedOnly, type),
        searchSuppliers(q, region, verifiedOnly, type),
      ])
    : [[], []];

  const results = mode === 'product' ? materials : suppliers;
    const aiReply =
    isAi && q.trim()
      ? await writeSearchReply({
          product: q,
          region: region || null,
          businessType: type ? (BUSINESS_TYPE_LABELS[type] ?? type) : null,
          quantity: qty || null,
          extraRequirements: extra || null,
          supplierCount: suppliers.length,
          productCount: materials.length,
          topSuppliers: suppliers.slice(0, 3).map((s: any) => ({ name: s.company_name, province: s.province })),
        })
      : null;
  const replyText =
    aiReply ?? `Mình tìm thấy ${suppliers.length} nhà cung cấp và ${materials.length} sản phẩm phù hợp với "${q}".`;
  function buildHref(overrides: Partial<{ mode: string; region: string; verified: string; type: string }>) {
    const p = new URLSearchParams({ q, mode, region, type });
    if (verifiedOnly) p.set('verified', '1');
    if (isAi) {
      p.set('ai', '1');
      if (qty) p.set('qty', qty);
      if (extra) p.set('extra', extra);
      if (ask) p.set('ask', ask);
    }
    Object.entries(overrides).forEach(([key, value]) => {
      if (value) p.set(key, value);
      else p.delete(key);
    });
    return `/tim-kiem?${p.toString()}`;
  }

  const words = q.toLowerCase().split(/\s+/).filter(Boolean);

  const suggestions = [
    !region && { label: 'Tìm ở Bắc Ninh', href: buildHref({ region: 'Bắc Ninh' }) },
    !region && { label: 'Tìm ở Hà Nội', href: buildHref({ region: 'Hà Nội' }) },
    !type && { label: 'Chỉ nhà sản xuất', href: buildHref({ type: 'MANUFACTURER' }) },
    !type && { label: 'Chỉ đơn vị gia công', href: buildHref({ type: 'OEM_ODM' }) },
    !verifiedOnly && { label: 'Chỉ đã xác minh', href: buildHref({ verified: '1' }) },
  ].filter((x): x is { label: string; href: string } => Boolean(x));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SearchBar
        key={`${q}|${ask}|${isAi}`}
        q={q}
        ask={ask}
        mode={mode}
        region={region}
        type={type}
        verifiedOnly={verifiedOnly}
        initialAi={isAi}
      />

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

               <main
          className={
            isAi
              ? 'h-max rounded-3xl border border-purple-200 bg-gradient-to-b from-purple-50 to-white p-5 shadow-sm'
              : ''
          }
        >
                    {isAi && (
            <div className="mb-5 border-b border-purple-100 pb-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-lg text-white shadow-lg shadow-purple-500/20">
                  ✦
                </div>
                <div>
                  <h2 className="text-[17px] font-black">AI đã tìm giúp bạn</h2>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    Câu trả lời và kết quả được gộp trong cùng một luồng.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[15px] font-semibold leading-relaxed text-slate-800">{replyText}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {q && (
                  <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-slate-700 ring-1 ring-purple-200">
                    Sản phẩm: {q}
                  </span>
                )}
                {region && (
                  <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-slate-700 ring-1 ring-purple-200">
                    Khu vực: {region}
                  </span>
                )}
                {type && (
                  <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-slate-700 ring-1 ring-purple-200">
                    Loại: {BUSINESS_TYPE_LABELS[type] || type}
                  </span>
                )}
              </div>

              {suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[12px] font-bold text-purple-400">Gợi ý tìm sâu hơn:</span>
                  {suggestions.map((sg) => (
                    <Link
                      key={sg.label}
                      href={sg.href}
                      className="rounded-full border border-dashed border-purple-300 bg-white px-3 py-1.5 text-[12px] text-purple-800 hover:bg-purple-50"
                    >
                      {sg.label}
                    </Link>
                  ))}
                </div>
              )}

              {(qty || extra) && (
                <p className="mt-3 text-[12px] leading-relaxed text-slate-600">
                  {qty && (
                    <>
                      Số lượng: <b>{qty}</b>.{' '}
                    </>
                  )}
                  {extra && (
                    <>
                      Yêu cầu thêm: <b>{extra}</b>.{' '}
                    </>
                  )}
                  Mình chưa lọc được theo các mục này. Bạn có thể gửi yêu cầu báo giá để nhà cung cấp trả lời trực tiếp nhé.
                </p>
              )}
            </div>
          )}

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
              {isAi && region && (
                <div className="mt-3">
                  <Link href={buildHref({ region: '' })} className="font-bold text-orange-600 underline">
                    Bỏ lọc khu vực {region} và tìm lại
                  </Link>
                </div>
              )}
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
                                       {isAi && supplierReasons(s, words, materials) && (
                      <p className="mt-2 text-[12px] text-slate-600">
                        <b className="text-slate-700">Vì sao AI gợi ý:</b> {supplierReasons(s, words, materials)}.
                      </p>
                    )}

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