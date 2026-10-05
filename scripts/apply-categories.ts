import { PrismaClient } from '@prisma/client';
import { suggestCategories } from '../src/lib/category-rules';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

async function main() {
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const idBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const suppliers = await prisma.supplierProfile.findMany({
    where: { status: 'APPROVED', categories: { none: {} } },
    select: {
      id: true,
      companyName: true,
      industryRaw: true,
      materials: { select: { category: { select: { slug: true } } } },
    },
  });

  let linked = 0;
  let skipped = 0;

  for (const s of suppliers) {
    const slugs = Array.from(
      new Set([
        ...suggestCategories(s).map((r) => r.slug),
        ...s.materials.map((m) => m.category?.slug).filter((x): x is string => Boolean(x)),
      ]),
    );
    const categoryIds = slugs
      .map((slug) => idBySlug.get(slug))
      .filter((x): x is string => Boolean(x));

    if (categoryIds.length === 0) {
      skipped++;
      continue;
    }

    console.log(`${s.companyName.slice(0, 40)} -> ${slugs.join(', ')}`);

    if (APPLY) {
      await prisma.supplierCategory.createMany({
        data: categoryIds.map((categoryId) => ({ supplierProfileId: s.id, categoryId })),
        skipDuplicates: true,
      });
    }
    linked++;
  }

  console.log(
    `${APPLY ? 'Đã ghi' : 'Chạy thử (CHƯA ghi)'}: ${linked} công ty, bỏ qua ${skipped} công ty chưa rõ`,
  );
}

main().finally(() => prisma.$disconnect());