import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductForm } from '@/components/supplier/product-form';

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string; productId: string }>;
}) {
  const { id: companyId, productId } = await params;
  const profile = await prisma.supplierProfile.findUnique({
    where: { id: companyId },
    select: { id: true, companyName: true },
  });

  if (!profile) notFound();

  const [material, categories] = await Promise.all([
    prisma.material.findFirst({
      where: { id: productId, supplierProfileId: companyId },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  if (!material) notFound();

  const backHref = `/admin/companies/${companyId}/products`;

  return (
    <div>
      <div className="mx-auto max-w-3xl px-6 pt-6 lg:px-8">
        <Link href={backHref} className="text-sm font-semibold text-orange-600">
          ← Sản phẩm của doanh nghiệp
        </Link>
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs text-muted-foreground">Đang sửa sản phẩm của</p>
          <strong>{profile.companyName}</strong>
        </div>
      </div>
      <ProductForm
        key={material.id}
        allCategories={categories}
        apiBase={`/api/admin/companies/${companyId}/products`}
        backHref={backHref}
        initialProduct={{
          id: material.id,
          name: material.name,
          categoryId: material.categoryId,
          description: material.description,
          function: material.function,
          unit: material.unit,
          priceMinCents: material.priceMinCents,
          priceMaxCents: material.priceMaxCents,
          images: Array.isArray(material.images) ? (material.images as string[]) : [],
          specifications:
            material.specifications &&
            typeof material.specifications === 'object' &&
            !Array.isArray(material.specifications)
              ? (material.specifications as Record<string, string>)
              : {},
          isActive: material.isActive,
        }}
      />
    </div>
  );
}
