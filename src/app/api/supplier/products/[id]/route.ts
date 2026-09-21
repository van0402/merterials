import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const materialSchema = z.object({
  name: z.string().trim().min(2).max(200),
  categoryId: z.string().trim().optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  unit: z.string().trim().max(50).optional().or(z.literal('')),
  priceMinCents: z.number().int().min(0).optional().nullable(),
  priceMaxCents: z.number().int().min(0).optional().nullable(),
  currency: z.string().trim().max(10).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
});

async function getOwnProfileId(userId: string) {
  const profile = await prisma.supplierProfile.findUnique({ where: { userId } });
  return profile?.id ?? null;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if ('response' in auth) return auth.response;

  const { id } = await context.params;
  const profileId = await getOwnProfileId(auth.user.id);
  if (!profileId) {
    return NextResponse.json({ success: false, error: 'Chưa có hồ sơ doanh nghiệp' }, { status: 404 });
  }

  const parsed = materialSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Thông tin không hợp lệ', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const result = await prisma.material.updateMany({
    where: { id, supplierProfileId: profileId },
    data: {
      categoryId: d.categoryId || null,
      name: d.name,
      description: d.description || null,
      unit: d.unit || null,
      priceMinCents: d.priceMinCents ?? null,
      priceMaxCents: d.priceMaxCents ?? null,
      currency: d.currency || 'VND',
      images: d.images ?? [],
      specifications: d.specifications ?? {},
      isActive: d.isActive ?? true,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy sản phẩm' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if ('response' in auth) return auth.response;

  const { id } = await context.params;
  const profileId = await getOwnProfileId(auth.user.id);
  if (!profileId) {
    return NextResponse.json({ success: false, error: 'Chưa có hồ sơ doanh nghiệp' }, { status: 404 });
  }

  const result = await prisma.material.deleteMany({
    where: { id, supplierProfileId: profileId },
  });

  if (result.count === 0) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy sản phẩm' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}