import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  companyName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  contactName: z.string().trim().optional(),
  contactEmail: z.string().trim().optional(),
  website: z.string().trim().optional(),
  address: z.string().trim().optional(),
  province: z.string().trim().optional(),
  taxCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
  industryRaw: z.string().trim().optional(),
  categoryIds: z.array(z.string().min(1)).optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

    const { categoryIds, ...fields } = parsed.data;

  const draft = await prisma.supplierProfile.findFirst({
    where: { id, status: 'DRAFT' },
    select: { id: true },
  });
  if (!draft) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy bản nháp' }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(fields).length > 0) {
      await tx.supplierProfile.update({ where: { id }, data: fields });
    }
    if (categoryIds) {
      await tx.supplierCategory.deleteMany({ where: { supplierProfileId: id } });
      await tx.supplierCategory.createMany({
        data: categoryIds.map((categoryId) => ({ supplierProfileId: id, categoryId })),
      });
    }
  });

  return NextResponse.json({ success: true });
}