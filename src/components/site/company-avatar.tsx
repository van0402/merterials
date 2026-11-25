import { AVATAR_COLORS, companyInitials, hashOf } from '@/lib/category-style';

// Ảnh đại diện công ty dùng chung cho mọi trang:
// - có logo: hiện logo trên nền trắng, viền mảnh
// - chưa có logo: chữ cái trên nền pastel, màu cố định theo tên công ty
export function CompanyAvatar({
  name,
  logoUrl,
  size = 44,
  className = '',
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const box = { width: size, height: size, borderRadius: Math.round(size * 0.28) };

  if (logoUrl) {
    return (
      <span
        className={`flex flex-none items-center justify-center overflow-hidden border border-[#e8ebf0] bg-white shadow-[0_4px_12px_rgba(25,40,65,0.08)] ${className}`}
        style={box}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="" className="h-full w-full object-contain p-[12%]" />
      </span>
    );
  }

  const [bg, fg] = AVATAR_COLORS[hashOf(name) % AVATAR_COLORS.length];
  return (
    <span
      aria-hidden="true"
      className={`flex flex-none select-none items-center justify-center font-black tracking-[0.01em] ${className}`}
      style={{
        ...box,
        fontSize: Math.max(10, Math.round(size * 0.34)),
        background: bg,
        color: fg,
      }}
    >
      {companyInitials(name)}
    </span>
  );
}
