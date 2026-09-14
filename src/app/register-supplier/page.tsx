import { prisma } from '@/lib/prisma';
import { SupplierApplyForm } from '@/components/site/supplier-apply-form';

export default async function BecomeSupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ companyName?: string }>;
}) {
  const { companyName } = await searchParams;
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-black tracking-tight">Đăng ký trở thành nhà cung cấp</h1>
      <p className="mb-8 text-muted-foreground">
        Điền thông tin công ty — đội ngũ SMEE sẽ xét duyệt hồ sơ trong 1-2 ngày làm việc.
      </p>
      <SupplierApplyForm categories={categories} initialCompanyName={companyName} />
    </div>
  );
}