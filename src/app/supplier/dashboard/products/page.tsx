import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductList } from '@/components/supplier/product-list';

export default async function SupplierProductsPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');

  const profile = await prisma.supplierProfile.findUnique({ where: { userId } });
  if (!profile) redirect('/register-supplier');

  const materials = await prisma.material.findMany({
    where: { supplierProfileId: profile.id },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <ProductList
      initialMaterials={materials.map((m) => ({
        id: m.id,
        name: m.name,
        categoryName: m.category?.name ?? null,
        priceMinCents: m.priceMinCents,
        priceMaxCents: m.priceMaxCents,
        currency: m.currency,
        images: Array.isArray(m.images) ? (m.images as string[]) : [],
        isActive: m.isActive,
      }))}
    />
  );
}