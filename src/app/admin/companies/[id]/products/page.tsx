import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductList } from '@/components/supplier/product-list';

export default async function AdminCompanyProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await prisma.supplierProfile.findUnique({
    where: { id },
    select: { id: true, companyName: true, taxCode: true },
  });

  if (!profile) notFound();

  const materials = await prisma.material.findMany({
    where: { supplierProfileId: profile.id },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="px-6 pt-6 lg:px-8">
        <Link href="/admin/companies" className="text-sm font-semibold text-orange-600">
          ← Danh sách doanh nghiệp
        </Link>
        <div className="mt-4 rounded-xl border bg-white p-4">
          <h2 className="font-bold">{profile.companyName}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Mã số thuế: {profile.taxCode || 'Chưa cập nhật'}
          </p>
        </div>
      </div>
      <ProductList
        key={id}
        title="Sản phẩm của doanh nghiệp"
        apiBase={`/api/admin/companies/${id}/products`}
        baseHref={`/admin/companies/${id}/products`}
        initialMaterials={materials.map((material) => ({
          id: material.id,
          name: material.name,
          categoryName: material.category?.name ?? null,
          priceMinCents: material.priceMinCents,
          priceMaxCents: material.priceMaxCents,
          currency: material.currency,
          images: Array.isArray(material.images) ? (material.images as string[]) : [],
          isActive: material.isActive,
        }))}
      />
    </div>
  );
}
