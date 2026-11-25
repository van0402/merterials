import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { RfqModal } from '@/components/site/rfq-modal';
import { CompanyAvatar } from '@/components/site/company-avatar';

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: 'Nhà sản xuất',
  DISTRIBUTOR: 'Nhà phân phối',
  IMPORTER: 'Nhà nhập khẩu',
  OEM_ODM: 'Đơn vị gia công',
  SYSTEM_INTEGRATOR: 'Tích hợp hệ thống',
  TECHNICAL_SERVICE: 'Dịch vụ kỹ thuật',
};

export function SupplierCard({ s }: { s: any }) {
  const types: string[] = Array.isArray(s.business_types) ? s.business_types : [];

  return (
    <article className="flex flex-col gap-2.5 rounded-[18px] border border-[#ead9c6] bg-white p-4 shadow-[0_6px_18px_rgba(25,40,65,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(25,40,65,0.1)]">
      <div className="flex items-start gap-2.5">
        <CompanyAvatar name={s.company_name} logoUrl={s.logo_url} size={44} />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[14.5px] font-extrabold leading-snug text-[#25324a]" title={s.company_name}>
            {s.company_name}
          </h3>
          <div className="mt-0.5 flex items-center gap-1 text-[12.5px] text-[#6b7a90]">
            <MapPin className="h-3 w-3 shrink-0" />
            {s.province || 'Việt Nam'}
          </div>
        </div>
      </div>

      <span className="w-fit rounded-full border border-[#d7efe4] bg-[#eef9f4] px-2.5 py-0.5 text-[11.5px] font-extrabold text-[#0f7a52]">
        ✓ Đã duyệt
      </span>

      <p className="line-clamp-3 text-[13px] leading-snug text-[#4b5566]">
        {s.description || s.industry_raw || 'Chưa cập nhật thông tin doanh nghiệp.'}
      </p>

      {types.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {types.map((bt) => (
            <span key={bt} className="rounded-full border border-[#e8edf3] bg-[#f6f8fb] px-2.5 py-0.5 text-[11.5px] font-bold text-[#526176]">
              {BUSINESS_TYPE_LABELS[bt] || bt}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex gap-2 border-t border-[#f0e6da] pt-3">
        <Link
          href={`/suppliers/${s.id}`}
          className="flex flex-1 items-center justify-center rounded-[11px] border border-[#f3c9a6] bg-white px-2 py-2 text-[13px] font-extrabold !text-[#c2410c] hover:bg-[#fff1e2]"
        >
          Xem hồ sơ
        </Link>
        <RfqModal
          supplierProfileId={s.id}
          supplierName={s.company_name}
          buttonLabel="Báo giá"
          buttonClassName="flex flex-1 items-center justify-center rounded-[11px] bg-[#f26b1d] px-2 py-2 text-[13px] font-extrabold text-white hover:bg-[#c2410c]"
        />
      </div>
    </article>
  );
}