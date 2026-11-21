import { prisma } from '@/lib/prisma';
import { SupplierApplyForm } from '@/components/site/supplier-apply-form';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
export default async function BecomeSupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ companyName?: string }>;
}) {
  const requestHeaders = await headers();
const userId = requestHeaders.get('x-user-id');

if (userId) {
  const existing = await prisma.supplierProfile.findUnique({
    where: { userId },
    select: { status: true },
  });

  if (existing) {
    const needsEditing =
      existing.status === 'DRAFT' ||
      existing.status === 'REJECTED';

    redirect(
      needsEditing
        ? '/supplier/dashboard/profile'
        : '/supplier/dashboard',
    );
  }
}
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