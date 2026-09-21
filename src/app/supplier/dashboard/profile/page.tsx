import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SupplierProfileForm } from '@/components/supplier/supplier-profile-form';

export default async function SupplierProfileEditPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');

  const [profile, categories, capabilities] = await Promise.all([
    prisma.supplierProfile.findUnique({
      where: { userId },
      include: {
        categories: { select: { categoryId: true } },
        capabilities: { select: { capabilityId: true } },
        documents: true,
      },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.capability.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  if (!profile) redirect('/register-supplier');

  return (
    <SupplierProfileForm
      profile={{
        id: profile.id,
        companyName: profile.companyName,
        tradingName: profile.tradingName,
        country: profile.country,
        taxCode: profile.taxCode,
        foundedYear: profile.foundedYear,
        businessType: profile.businessType,
        contactName: profile.contactName,
        contactEmail: profile.contactEmail,
        phone: profile.phone,
        website: profile.website,
        address: profile.address,
        province: profile.province,
        district: profile.district,
        description: profile.description,
        mainMarket: profile.mainMarket,
        companySize: profile.companySize,
        logoUrl: profile.logoUrl,
        coverImageUrl: profile.coverImageUrl,
        status: profile.status,
        categoryIds: profile.categories.map((c) => c.categoryId),
        capabilityIds: profile.capabilities.map((c) => c.capabilityId),
        documents: profile.documents.map((d) => ({ id: d.id, type: d.type, fileUrl: d.fileUrl, status: d.status })),
      }}
      allCategories={categories}
      allCapabilities={capabilities}
    />
  );
}
