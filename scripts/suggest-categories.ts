import { PrismaClient } from '@prisma/client';
import { suggestCategories } from '../src/lib/category-rules';

const prisma = new PrismaClient();

async function main() {
  const suppliers = await prisma.supplierProfile.findMany({
    where: { status: 'APPROVED', categories: { none: {} } },
    select: {
      companyName: true,
      industryRaw: true,
      materials: { select: { category: { select: { slug: true } } } },
    },
    orderBy: { companyName: 'asc' },
  });

  const rows = suppliers.map((s) => {
    const byRules = suggestCategories(s);
    const byProducts = Array.from(
      new Set(s.materials.map((m) => m.category?.slug).filter((x): x is string => Boolean(x))),
    );
    const slugs = Array.from(new Set([...byRules.map((r) => r.slug), ...byProducts]));

    return {
      'Công ty': s.companyName.slice(0, 32),
      'Ngành nghề': (s.industryRaw ?? '(trống)').slice(0, 40),
      'Gợi ý': slugs.join(', ') || 'CHƯA RÕ',
      'Vì sao': [
        ...byRules.map((r) => `từ khoá ${r.matched.join('/')}`),
        ...(byProducts.length ? ['theo sản phẩm'] : []),
      ].join('; '),
    };
  });

  console.table(rows);
  console.log(`Tổng: ${rows.length} công ty chưa có danh mục`);
}

main().finally(() => prisma.$disconnect()); 