import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductForm } from '@/components/supplier/product-form';

export default async function NewProductPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');

  const profile = await prisma.supplierProfile.findUnique({ where: { userId } });
  if (!profile) redirect('/register-supplier');

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return <ProductForm allCategories={categories} />;
}
