import Link from 'next/link';
import { Gem, MapPin, Sparkles, type LucideIcon } from 'lucide-react';

const GRADIENTS = [
  'from-[#1c2a52] to-[#0f1836]',
  'from-[#c2410c] to-[#7c2d12]',
  'from-[#3f4a5c] to-[#1b222e]',
];

// Bậc VIP. Hiện có 2 kiểu giao diện; BRONZE / SILVER để dành cho sau này.
export type VipTier = 'DIAMOND' | 'GOLD';

const VIP_STYLES: Record<
  VipTier,
  { label: string; Icon: LucideIcon; card: string; badge: string; tag: string; link: string }
> = {
  // Kim cương: thẻ trắng, viền trên xanh dương dày, huy hiệu xanh đặc
  DIAMOND: {
    label: 'VIP',
    Icon: Sparkles,
    card: 'border-[#d9defa] border-t-[4px] border-t-[#3047e8] bg-white shadow-[0_10px_24px_rgba(48,71,232,0.10)]',
    badge: 'bg-[#3047e8] text-white',
    tag: 'bg-[#e8ecff] text-[#2f3fb0]',
    link: '!text-[#3047e8]',
  },
  // Vàng: thẻ nền kem, viền trên vàng đậm dày, huy hiệu vàng gradient
  GOLD: {
    label: 'Hot',
    Icon: Gem,
    card: 'border-[#f0e0b0] border-t-[4px] border-t-[#c99a1b] bg-[#fffbee] shadow-[0_10px_24px_rgba(160,115,20,0.14)]',
    badge: 'bg-gradient-to-r from-[#b8860b] to-[#e0b73e] text-white',
    tag: 'bg-[#f7ecc9] text-[#7a5a10]',
    link: '!text-[#a8780f]',
  },
};

export interface ShelfCompany {
  id: string;
  companyName: string;
  specialty: string;
  country: string;
  tags: string[];
  productCount: number;
  vipTier?: VipTier | null;
}

export interface CategoryShelfProps {
  index: number;
  categorySlug: string;
  categoryName: string;
  icon: string;
  supplierCount: number;
  companies: ShelfCompany[];
  imageUrl?: string;
}

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export function CategoryShelf({ index, categorySlug, categoryName, icon, supplierCount, companies, imageUrl }: CategoryShelfProps) {
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <section className="grid gap-5 border-t border-orange-100 py-7 first:border-t-0 md:grid-cols-[280px_1fr]">
      <div
        className={`relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-[20px] p-6 text-white ${imageUrl ? '' : `bg-gradient-to-br ${gradient}`}`}
        style={
          imageUrl
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(10,16,38,0.25), rgba(10,16,38,0.9)), url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl backdrop-blur">
          {icon}
        </div>
        <div className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-white/80">
          {supplierCount} nhà cung cấp
        </div>
        <h2 className="mb-3.5 text-xl font-black leading-tight tracking-tight text-balance">{categoryName}</h2>
        <Link
          href={`/danh-muc/${categorySlug}`}
          className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-extrabold !text-slate-900 transition hover:-translate-y-0.5"
        >
          Khám phá ngành →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {companies.map((company) => {
          const vip = company.vipTier ? VIP_STYLES[company.vipTier] : null;

          return (
            <article
              key={company.id}
              className={`relative flex flex-col gap-2.5 rounded-[16px] border p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(25,40,65,0.08)] ${vip ? vip.card : 'border-[#e7ebf0] bg-white shadow-[0_8px_22px_rgba(25,40,65,0.04)]'}`}
            >
              {vip && (
  <span
    className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-extrabold leading-none ${vip.badge}`}
  >
    <vip.Icon className="h-3 w-3" />
    {vip.label}
  </span>
)}

              <div className={`flex min-h-[46px] items-start gap-2.5 ${vip ? 'pr-[96px]' : ''}`}>
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] border border-[#e4eaf1] bg-[#f3f6fa] text-[11px] font-black text-[#344b68]">
                  {initialsOf(company.companyName)}
                </div>
                <div className="line-clamp-2 text-[14px] font-bold leading-tight text-[#25324a]" title={company.companyName}>
                  {company.companyName}
                </div>
              </div>

              <div className="flex items-center gap-1 text-[12px] text-[#6b7a90]">
                <MapPin className="h-3 w-3 shrink-0" />
                {company.country}
              </div>

              <span className="w-fit rounded-full border border-[#d7efe4] bg-[#eef9f4] px-2 py-1 text-[11.5px] font-extrabold text-[#0f7a52]">
                ✓ Đã duyệt
              </span>

              <div className="text-[12.5px] leading-snug text-[#647287]">{company.specialty}</div>

              {company.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {company.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-full px-2 py-1 text-[10.5px] font-bold ${vip ? vip.tag : 'border border-[#e8edf3] bg-[#f6f8fb] text-[#526176]'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#edf1f4] pt-2.5 text-[11.5px]">
                <span className="min-w-0 truncate text-[#748196]">
                  {company.productCount > 0 ? `${company.productCount} sản phẩm` : 'Chưa có sản phẩm'}
                </span>
                <Link
                  href={`/suppliers/${company.id}`}
                  className={`shrink-0 whitespace-nowrap font-extrabold ${vip ? vip.link : '!text-[#c2410c]'}`}
                >
                  Xem hồ sơ →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
