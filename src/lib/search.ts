import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
const REGION_GROUPS: Record<string, { provinces: string[]; mainMarket: string }> = {
  'Miền Bắc': {
    mainMarket: 'NORTH',
    provinces: ['Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Bắc Ninh', 'Bắc Giang', 'Hải Dương', 'Hưng Yên', 'Vĩnh Phúc', 'Thái Nguyên', 'Phú Thọ', 'Nam Định', 'Thái Bình', 'Hà Nam', 'Ninh Bình', 'Lạng Sơn', 'Cao Bằng', 'Lào Cai', 'Yên Bái', 'Tuyên Quang', 'Hà Giang', 'Bắc Kạn', 'Sơn La', 'Hòa Bình', 'Điện Biên', 'Lai Châu'],
  },
  'Miền Trung': {
    mainMarket: 'CENTRAL',
    provinces: ['Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Huế', 'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận', 'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng'],
  },
  'Miền Nam': {
    mainMarket: 'SOUTH',
    provinces: ['Hồ Chí Minh', 'Bình Dương', 'Đồng Nai', 'Vũng Tàu', 'Long An', 'Tây Ninh', 'Bình Phước', 'Tiền Giang', 'Bến Tre', 'Cần Thơ', 'An Giang', 'Kiên Giang', 'Cà Mau', 'Bạc Liêu', 'Sóc Trăng', 'Vĩnh Long', 'Đồng Tháp', 'Trà Vinh', 'Hậu Giang'],
  },
};

function regionCondition(region: string, province: Prisma.Sql, mainMarket: Prisma.Sql) {
  if (!region) return Prisma.sql`TRUE`;

  const group = REGION_GROUPS[region];
  if (group) {
    const provinceMatches = group.provinces.map((p) => Prisma.sql`${province} ILIKE ${`%${p}%`}`);
    return Prisma.sql`(${Prisma.join(provinceMatches, ' OR ')} OR ${mainMarket}::text = ${group.mainMarket})`;
  }

  return Prisma.sql`${province} ILIKE ${`%${region}%`}`;
}

export async function searchMaterials(q: string, region: string, verifiedOnly = false, businessType = '') {
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const wordConditions = words.map((word) => {
    const like = `%${word}%`;
    return Prisma.sql`(m.name ILIKE ${like} OR m.description ILIKE ${like} OR c.name ILIKE ${like} OR m.specifications::text ILIKE ${like})`;
  });

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
      AND ${regionCondition(region, Prisma.raw('s.province'), Prisma.raw('s.main_market'))}
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

  return prisma.$queryRaw<any[]>`
    SELECT id, company_name, description, province, main_market, business_types, industry_raw, is_verified
    FROM supplier_profiles
    WHERE status = 'APPROVED'
      AND ${Prisma.join(wordConditions, ' AND ')}
      AND ${regionCondition(region, Prisma.raw('province'), Prisma.raw('main_market'))}
      AND (${verifiedOnly} = false OR is_verified = true)
      AND (${businessType} = '' OR ${businessType} = ANY(business_types::text[]))
    ORDER BY created_at DESC
    LIMIT 30
  `;
}

export async function categorySuppliers(slug: string) {
  return prisma.$queryRaw<any[]>`
    SELECT s.id, s.company_name, s.description, s.province, s.main_market, s.business_types, s.industry_raw, s.is_verified
    FROM supplier_profiles s
    WHERE s.status = 'APPROVED'
      AND (
        EXISTS (
          SELECT 1 FROM supplier_categories sc
          JOIN categories c ON c.id = sc.category_id
          WHERE sc.supplier_profile_id = s.id AND c.slug = ${slug}
        )
        OR EXISTS (
          SELECT 1 FROM materials m
          JOIN categories c ON c.id = m.category_id
          WHERE m.supplier_profile_id = s.id AND m.is_active = true AND c.slug = ${slug}
        )
      )
    ORDER BY s.created_at DESC
    LIMIT 50
  `;
}

export async function categoryMaterials(slug: string) {
  return prisma.$queryRaw<any[]>`
    SELECT
      m.id, m.name, m.description, m.unit, m.price_min_cents, m.price_max_cents, m.currency, m.images,
      s.id as supplier_id, s.company_name, s.province, s.main_market, s.business_types, s.is_verified,
      s.industry_raw,
      c.name as category_name
    FROM materials m
    JOIN supplier_profiles s ON s.id = m.supplier_profile_id
    JOIN categories c ON c.id = m.category_id
    WHERE m.is_active = true
      AND s.status = 'APPROVED'
      AND c.slug = ${slug}
    ORDER BY m.created_at DESC
    LIMIT 50
  `;
}
