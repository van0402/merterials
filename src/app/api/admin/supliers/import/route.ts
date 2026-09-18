import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const rowSchema = z.object({
  companyName: z.string().trim().min(1),
  contactName: z.string().trim().optional(),
  phone: z.string().trim().min(1),
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

  const created = await prisma.$transaction(
    parsed.data.rows.map((row) =>
      prisma.supplierProfile.create({
        data: {
          userId: null,
          companyName: row.companyName,
          contactName: row.contactName || null,
          phone: row.phone,
          country: row.country || 'Việt Nam',
          industryRaw: row.industryRaw || null,
          status: 'DRAFT',
          isVerified: false,
        },
      }),
    ),
  );

  await prisma.auditLog.create({
    data: {
      actorId: auth.user.id,
      action: 'BULK_IMPORT_SUPPLIERS',
      objectType: 'SUPPLIER_PROFILE',
      objectId: 'bulk',
      payload: { count: created.length },
    },
  });

  return NextResponse.json({ success: true, created: created.length });
}