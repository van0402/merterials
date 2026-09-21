import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SupplierSidebar } from '@/components/supplier/supplier-sidebar';

export default async function SupplierDashboardLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');

  const profile = await prisma.supplierProfile.findUnique({
    where: { userId },
    select: { companyName: true, businessType: true, province: true, status: true },
  });

  if (!profile) redirect('/register-supplier');

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f7f8fa] lg:grid-cols-[260px_1fr]">
      <SupplierSidebar
        companyName={profile.companyName}
        businessType={profile.businessType}
        province={profile.province}
        status={profile.status}
      />
      <div>{children}</div>
    </div>
  );
}
