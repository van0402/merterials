import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20));

  const where = { status: { not: 'DRAFT' as const } };

  const [companies, total] = await Promise.all([
    prisma.supplierProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supplierProfile.count({ where }),
  ]);

  

  return NextResponse.json({ success: true, companies, total, page, pageSize });
}

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const parsed = bulkDeleteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

  const result = await prisma.supplierProfile.deleteMany({
    where: { id: { in: parsed.data.ids } },
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.user.id,
      action: 'BULK_DELETE_SUPPLIER_PROFILES',
      objectType: 'SUPPLIER_PROFILE',
      objectId: 'bulk',
      payload: { ids: parsed.data.ids, count: result.count },
    },
  });
   return NextResponse.json({ success: true, deleted: result.count });
}