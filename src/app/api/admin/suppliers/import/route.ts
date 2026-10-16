import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { suggestCategories } from '@/lib/category-rules';
const rowSchema = z.object({
  companyName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  contactName: z.string().trim().optional(),
  contactEmail: z.string().trim().optional(),
  website: z.string().trim().optional(),
  address: z.string().trim().optional(),
  province: z.string().trim().optional(),
  taxCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
  industryRaw: z.string().trim().optional(),
});

const importSchema = z.object({
  rows: z.array(rowSchema).min(1).max(1000),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const parsed = importSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Dữ liệu không hợp lệ', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const dedupeKey = (companyName: string, phone: string) => `${companyName}|${phone}`;

  // Bỏ trùng ngay trong file (2 dòng cùng tên công ty + SĐT)
  const seen = new Set<string>();
  const dedupedRows = parsed.data.rows.filter((row) => {
    const key = dedupeKey(row.companyName, row.phone);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const duplicatesInFile = parsed.data.rows.length - dedupedRows.length;

  // Bỏ những dòng đã tồn tại sẵn trong DB (cùng tên công ty + SĐT)
  const existing = await prisma.supplierProfile.findMany({
    where: { OR: dedupedRows.map((row) => ({ companyName: row.companyName, phone: row.phone })) },
    select: { companyName: true, phone: true },
  });
  const existingKeys = new Set(existing.map((e) => dedupeKey(e.companyName, e.phone)));
  const newRows = dedupedRows.filter((row) => !existingKeys.has(dedupeKey(row.companyName, row.phone)));
  const alreadyExists = dedupedRows.length - newRows.length;
  const skipped = duplicatesInFile + alreadyExists;

  if (newRows.length === 0) {
    return NextResponse.json({ success: true, created: 0, skipped });
  }

    const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const idBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const created = await prisma.$transaction(
    newRows.map((row) => {
      const categoryIds = suggestCategories(row)
        .map((r) => idBySlug.get(r.slug))
        .filter((id): id is string => Boolean(id));

      return prisma.supplierProfile.create({
        data: {
          userId: null,
          companyName: row.companyName,
          contactName: row.contactName || null,
          contactEmail: row.contactEmail || null,
          website: row.website || null,
          address: row.address || null,
          province: row.province || null,
          taxCode: row.taxCode || null,
          phone: row.phone,
          country: row.country || 'Việt Nam',
          industryRaw: row.industryRaw || null,
          status: 'DRAFT',
          isVerified: false,
          categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
        },
      });
    }),
  );

  await prisma.auditLog.create({
    data: {
      actorId: auth.user.id,
      action: 'BULK_IMPORT_SUPPLIERS',
      objectType: 'SUPPLIER_PROFILE',
      objectId: 'bulk',
      payload: { count: created.length, skipped },
    },
  });

  return NextResponse.json({ success: true, created: created.length, skipped });
}
