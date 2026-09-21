import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Wrench,
  MessageSquare,
} from 'lucide-react';

export default async function SupplierDashboardPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');

  const profile = await prisma.supplierProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, createdAt: true } },
      categories: { include: { category: { select: { name: true } } } },
      capabilities: { include: { capability: { select: { name: true } } } },
      documents: true,
      materials: { orderBy: { createdAt: 'desc' } },
      inquiries: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { material: { select: { name: true } }, user: { select: { name: true } } },
      },
    },
  });

  if (!profile) redirect('/register-supplier');

  const hasBusinessLicense = profile.documents.some((d) => d.type === 'BUSINESS_LICENSE');
  const hasCompanyProfile = profile.documents.some((d) => d.type === 'OTHER');
  const hasQualityCert = profile.documents.some((d) => d.type === 'QUALITY_CERT');
  const hasCategories = profile.categories.length > 0;

  const checklist = [
    { label: 'Thông tin doanh nghiệp', desc: 'Đã hoàn thành', done: true },
    { label: 'Ngành nghề & năng lực', desc: hasCategories ? 'Đã khai báo' : 'Chưa chọn ngành nghề', done: hasCategories },
    { label: 'Hồ sơ năng lực (Company Profile)', desc: hasCompanyProfile ? 'Đã tải lên' : 'Chưa tải lên hồ sơ năng lực', done: hasCompanyProfile },
    { label: 'Chứng nhận', desc: hasQualityCert ? 'Đã tải lên' : 'Chưa có ISO / chứng nhận liên quan', done: hasQualityCert },
  ];
  const completion = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  const timeline = [
    { label: 'Đăng ký tài khoản', date: profile.user?.createdAt ?? profile.createdAt, done: true },
    { label: 'Khai báo doanh nghiệp & tải hồ sơ', date: profile.createdAt, done: true },
    {
      label: 'Admin kiểm tra',
      date: profile.reviewedAt,
      done: profile.status !== 'PENDING',
      current: profile.status === 'PENDING',
    },
    {
      label: 'Kích hoạt tài khoản Nhà cung cấp',
      date: profile.status === 'APPROVED' ? profile.reviewedAt : null,
      done: profile.status === 'APPROVED',
      current: false,
    },
  ];

  return (
    <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-[26px] font-black tracking-tight">Xin chào, {profile.companyName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý hồ sơ, sản phẩm và nhu cầu khách hàng.</p>
        </div>

        <div className="mb-6 grid grid-cols-1 items-center gap-4 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-white p-4 sm:grid-cols-[1fr_auto]">
          <div>
            <h3 className="text-sm font-bold">Hồ sơ doanh nghiệp đã hoàn thiện {completion}%</h3>
            <p className="mt-1 text-xs text-[#7c6656]">
              Bổ sung Company Profile và chứng nhận để hoàn tất quy trình xác minh Supplier.
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <span className="block h-full rounded-full bg-orange-500" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <strong className="block text-2xl">{profile.materials.length}</strong>
            <span className="text-xs text-muted-foreground">Sản phẩm đang đăng</span>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <strong className="block text-2xl">{profile.inquiries.length}</strong>
            <span className="text-xs text-muted-foreground">RFQ gần đây</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b p-4">
              <h3 className="text-sm font-bold">Việc cần làm</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Hoàn thiện hồ sơ để tăng độ tin cậy</p>
            </div>
            <div className="px-4">
              {checklist.map((item, i) => (
                <div key={item.label} className={`flex items-center gap-3 py-3 ${i < checklist.length - 1 ? 'border-b' : ''}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.done ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {item.done ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <b className="block text-xs">{item.label}</b>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b p-4">
              <h3 className="text-sm font-bold">Trạng thái xác minh</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Theo dõi tiến trình đăng ký Supplier</p>
            </div>
            <div className="px-4">
              {timeline.map((step, i) => (
                <div key={step.label} className={`flex items-start gap-3 py-3 ${i < timeline.length - 1 ? 'border-b' : ''}`}>
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                    step.done ? 'bg-emerald-50 text-emerald-600' : step.current ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {step.done ? '✓' : step.current ? '●' : ''}
                  </div>
                  <div className="min-w-0 flex-1">
                    <b className="block text-xs">{step.label}</b>
                    {step.date && (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {new Date(step.date).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${
                    step.done ? 'bg-emerald-50 text-emerald-700' : step.current ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {step.done ? 'Hoàn thành' : step.current ? 'Đang xử lý' : 'Chưa tới'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="text-sm font-bold">Sản phẩm của tôi</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Quản lý trạng thái hiển thị</p>
              </div>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </div>
            {profile.materials.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-2 h-7 w-7 opacity-40" />
                Chưa có sản phẩm nào — tính năng thêm sản phẩm đang được xây dựng.
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full min-w-[500px] border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#fafafa] text-left">
                      {['Sản phẩm', 'Đơn vị', 'Trạng thái'].map((h) => (
                        <th key={h} className="border-b px-4 py-2.5 text-[9px] font-bold uppercase text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {profile.materials.map((m) => (
                      <tr key={m.id}>
                        <td className="border-b px-4 py-2.5">{m.name}</td>
                        <td className="border-b px-4 py-2.5">{m.unit || '—'}</td>
                        <td className="border-b px-4 py-2.5">
                          <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${m.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {m.isActive ? 'Active' : 'Draft'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="text-sm font-bold">RFQ mới</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Nhu cầu khách hàng vừa gửi</p>
              </div>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            {profile.inquiries.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Clock className="mx-auto mb-2 h-7 w-7 opacity-40" />
                Chưa có yêu cầu báo giá nào.
              </div>
            ) : (
              <div className="px-4">
                {profile.inquiries.map((inq, i) => (
                  <div key={inq.id} className={`py-3 ${i < profile.inquiries.length - 1 ? 'border-b' : ''}`}>
                    <b className="text-xs">{inq.user?.name || inq.guestName || 'Khách vãng lai'}</b>
                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground line-clamp-2">{inq.message}</p>
                    {inq.material && (
                      <span className="mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[9px] text-muted-foreground">
                        {inq.material.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

