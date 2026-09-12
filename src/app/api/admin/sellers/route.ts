import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const reviewSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']),
  reviewNotes: z.string().trim().max(2000).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const sellers = await prisma.supplierProfile.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      materials: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ success: true, sellers });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid review', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const seller = await prisma.$transaction(async (tx) => {
    const updated = await tx.supplierProfile.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.status,
        reviewNotes: parsed.data.reviewNotes,
        reviewedBy: auth.user.id,
        reviewedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: 'REVIEW_SUPPLIER_APPLICATION',
        objectType: 'SUPPLIER_PROFILE',
        objectId: updated.id,
        payload: parsed.data,
      },
    });
    return updated;
  });

  return NextResponse.json({ success: true, seller });
}

