import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function searchMaterials(q: string, region: string, verifiedOnly = false, businessType = '') {
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const wordConditions = words.map((word) => {
    const like = `%${word}%`;
    return Prisma.sql`(m.name ILIKE ${like} OR m.description ILIKE ${like} OR c.name ILIKE ${like} OR m.specifications::text ILIKE ${like})`;
  });
  const regionQuery = `%${region}%`;

  return prisma.$queryRaw<any[]>`
    SELECT
      m.id, m.name, m.description, m.unit, m.price_min_cents, m.price_max_cents, m.currency, m.images,
      s.id as supplier_id, s.company_name, s.province, s.main_market, s.business_types, s.is_verified,
      s.industry_raw,
      c.name as category_name
    FROM materials m
    JOIN supplier_profiles s ON s.id = m.supplier_profile_id
    LEFT JOIN categories c ON c.id = m.category_id
    WHERE m.is_active = true
      AND s.status = 'APPROVED'
      AND ${Prisma.join(wordConditions, ' AND ')}
      AND (${region} = '' OR s.province ILIKE ${regionQuery})
      AND (${verifiedOnly} = false OR s.is_verified = true)
      AND (${businessType} = '' OR ${businessType} = ANY(s.business_types::text[]))
    ORDER BY m.created_at DESC
    LIMIT 30
  `;
}

export async function searchSuppliers(q: string, region: string, verifiedOnly = false, businessType = '') {
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const wordConditions = words.map((word) => {
    const like = `%${word}%`;
    return Prisma.sql`(company_name ILIKE ${like} OR description ILIKE ${like} OR industry_raw ILIKE ${like})`;
  });
  const regionQuery = `%${region}%`;

  return prisma.$queryRaw<any[]>`
    SELECT id, company_name, description, province, main_market, business_types, industry_raw, is_verified
    FROM supplier_profiles
    WHERE status = 'APPROVED'
      AND ${Prisma.join(wordConditions, ' AND ')}
      AND (${region} = '' OR province ILIKE ${regionQuery})
      AND (${verifiedOnly} = false OR is_verified = true)
      AND (${businessType} = '' OR ${businessType} = ANY(business_types::text[]))
    ORDER BY created_at DESC
    LIMIT 30
  `;
}
