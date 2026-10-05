import Link from 'next/link';
import { RfqModal } from '@/components/site/rfq-modal';

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: 'Nhà sản xuất',
  DISTRIBUTOR: 'Nhà phân phối',
  IMPORTER: 'Nhà nhập khẩu',
  OEM_ODM: 'Đơn vị gia công',
  SYSTEM_INTEGRATOR: 'Tích hợp hệ thống',
  TECHNICAL_SERVICE: 'Dịch vụ kỹ thuật',
};

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export function SupplierCard({ s }: { s: any }) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-4 rounded-2xl border bg-white p-4 sm:grid-cols-[72px_1fr_auto]">
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
          <span>{s.province || 'Việt Nam'}</span>
          {Array.isArray(s.business_types) && s.business_types.length > 0 && (
            <span>{s.business_types.map((bt: string) => BUSINESS_TYPE_LABELS[bt] || bt).join(', ')}</span>
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
  );
}
