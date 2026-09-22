import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductForm } from '@/components/supplier/product-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');

  const profile = await prisma.supplierProfile.findUnique({ where: { userId } });
  if (!profile) redirect('/register-supplier');

  const [material, categories] = await Promise.all([
    prisma.material.findFirst({ where: { id, supplierProfileId: profile.id } }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  if (!material) notFound();

  return (
    <ProductForm
      allCategories={categories}
      initialProduct={{
        id: material.id,
        name: material.name,
        categoryId: material.categoryId,
        description: material.description,
        unit: material.unit,
        priceMinCents: material.priceMinCents,
        priceMaxCents: material.priceMaxCents,
        images: Array.isArray(material.images) ? (material.images as string[]) : [],
        specifications:
          material.specifications && typeof material.specifications === 'object' && !Array.isArray(material.specifications)
            ? (material.specifications as Record<string, string>)
            : {},
        isActive: material.isActive,
      }}
    />
  );
}
