import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const materialSchema = z.object({
  name: z.string().trim().min(2).max(200),
  categoryId: z.string().trim().optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  function: z.string().trim().max(2000).optional().or(z.literal('')),
  unit: z.string().trim().max(50).optional().or(z.literal('')),
  priceMinCents: z.number().int().min(0).max(2147483647, 'Giá tối đa 2.147.483.647đ').optional().nullable(),
  priceMaxCents: z.number().int().min(0).max(2147483647, 'Giá tối đa 2.147.483.647đ').optional().nullable(),
  currency: z.string().trim().max(10).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest,context: RouteContext) {
  const auth = await requireAdmin(request);

  if ('response' in auth) return auth.response;
 
 const { id } = await context.params;

const profile = await prisma.supplierProfile.findUnique({
  where: { id },
});
  if (!profile) {
    return NextResponse.json({ success: false, error: 'Chưa có hồ sơ doanh nghiệp' }, { status: 404 });
  }

  const materials = await prisma.material.findMany({
    where: { supplierProfileId: profile.id },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, materials });
}

export async function POST(request: NextRequest,context: RouteContext) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { id } = await context.params;

const profile = await prisma.supplierProfile.findUnique({
  where: { id },
});
  if (!profile) {
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
  const material = await prisma.material.create({
    data: {
      supplierProfileId: profile.id,
      categoryId: d.categoryId || null,
      name: d.name,
      description: d.description || null,
      function: d.function || null,
      unit: d.unit || null,
      priceMinCents: d.priceMinCents ?? null,
      priceMaxCents: d.priceMaxCents ?? null,
      currency: d.currency || 'VND',
      images: d.images ?? [],
      specifications: d.specifications ?? {},
      isActive: d.isActive ?? false,
    },
  });

  return NextResponse.json({ success: true, material }, { status: 201 });
}