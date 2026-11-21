import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductForm } from '@/components/supplier/product-form';

export default async function AdminNewProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await prisma.supplierProfile.findUnique({
    where: { id },
    select: { companyName: true },
  });

  if (!profile) notFound();

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  const backHref = `/admin/companies/${id}/products`;

  return (
    <div>
      <div className="mx-auto max-w-3xl px-6 pt-6 lg:px-8">
        <Link href={backHref} className="text-sm font-semibold text-orange-600">
          ← Sản phẩm của doanh nghiệp
        </Link>
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs text-muted-foreground">Đang thêm sản phẩm cho</p>
          <strong>{profile.companyName}</strong>
        </div>
      </div>
      <ProductForm
        allCategories={categories}
        apiBase={`/api/admin/companies/${id}/products`}
        backHref={backHref}
      />
    </div>
  );
}
