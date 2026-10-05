import Link from 'next/link';
import { RfqModal } from '@/components/site/rfq-modal';

function formatPrice(minCents: number | null, maxCents: number | null, currency: string) {
  if (minCents == null && maxCents == null) return null;
  const fmt = (v: number) => Number(v).toLocaleString('vi-VN') + (currency === 'VND' ? 'đ' : ` ${currency}`);
  if (minCents != null && maxCents != null && minCents !== maxCents) return `${fmt(minCents)} – ${fmt(maxCents)}`;
  return fmt((minCents ?? maxCents)!);
}

export function MaterialCard({ m }: { m: any }) {
  const images = Array.isArray(m.images) ? m.images : [];
  const price = formatPrice(m.price_min_cents, m.price_max_cents, m.currency);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-orange-200">
      <Link href={`/suppliers/${m.supplier_id}`}>
        <div className="flex h-[100px] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          {images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[0]} alt={m.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl opacity-40"></span>
          )}
        </div>
        <div className="p-2.5">
          <div className="line-clamp-2 min-h-[32px] text-[11.5px] font-extrabold leading-tight">{m.name}</div>
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
}