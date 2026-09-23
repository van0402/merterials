import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { InquiryStatusSelect } from '@/components/supplier/inquiry-status-select';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  RESPONDED: 'bg-blue-50 text-blue-700',
  CLOSED: 'bg-slate-100 text-slate-600',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  RESPONDED: 'Đã trả lời',
  CLOSED: 'Đã đóng',
};

export default async function SupplierInquiriesPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');

  const profile = await prisma.supplierProfile.findUnique({ where: { userId } });
  if (!profile) redirect('/register-supplier');

  const inquiries = await prisma.inquiry.findMany({
    where: { supplierProfileId: profile.id },
    include: { material: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-7">
      <h1 className="text-xl font-black">Yêu cầu báo giá</h1>
      <p className="mt-1 text-sm text-muted-foreground">Danh sách yêu cầu từ khách hàng quan tâm tới sản phẩm/dịch vụ của bạn.</p>

      {inquiries.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Chưa có yêu cầu báo giá nào.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {inquiries.map((inq) => (
            <div key={inq.id} className="rounded-2xl border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <b className="text-[14px] font-black">{inq.guestName || 'Khách đã đăng nhập'}</b>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-muted-foreground">
                    {inq.guestPhone && <span><img src="/images/phone-call.png" alt="Phone" className="w-4 h-4 inline mr-1" />{inq.guestPhone}</span>}
                    {inq.guestEmail && <span><img src="/images/mail.png" alt="Email" className="w-4 h-4 inline mr-1" />{inq.guestEmail}</span>}
                    {inq.material && <span><img src="/images/box.png" alt="Package" className="w-4 h-4 inline mr-1" />{inq.material.name}</span>}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${STATUS_STYLE[inq.status]}`}>
                  {STATUS_LABEL[inq.status]}
                </span>
              </div>
              <p className="mt-3 text-[13px] text-slate-700">{inq.message}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {new Date(inq.createdAt).toLocaleString('vi-VN')}
                </span>
                <InquiryStatusSelect id={inq.id} status={inq.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}