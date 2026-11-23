import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

// Bắt buộc: không cho chạy lúc docker build (lúc đó không có DB)
export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://supply.smee.vn';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [suppliers, products, categories] = await Promise.all([
    prisma.supplierProfile.findMany({
      where: { status: 'APPROVED' },
      select: { id: true, updatedAt: true },
    }),
    prisma.material.findMany({
      where: { isActive: true, supplierProfile: { status: 'APPROVED' } },
      select: { id: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    }),
  ]);

  return [
    { url: SITE, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/suppliers`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/can-mua`, changeFrequency: 'daily', priority: 0.7 },
    ...categories.map((c) => ({
      url: `${SITE}/danh-muc/${c.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...suppliers.map((s) => ({
      url: `${SITE}/suppliers/${s.id}`,
      lastModified: s.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${SITE}/products/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}