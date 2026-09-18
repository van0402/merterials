import { prisma } from '@/lib/prisma';
import { SupplierApplyForm } from '@/components/site/supplier-apply-form';

export default async function BecomeSupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ companyName?: string }>;
}) {
  const { companyName } = await searchParams;
  const [categories, capabilities] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.capability.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-4 py-8">
      <SupplierApplyForm categories={categories} capabilities={capabilities} initialCompanyName={companyName} />
    </div>
  );
}