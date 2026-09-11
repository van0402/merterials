import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAffiliate } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const productSchema = z.object({
  sku: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(3000).optional(),
  priceCents: z.number().int().positive(),
  currency: z.string().trim().length(3).default('VND'),
});

export async function GET(request: NextRequest) {
  const auth = await requireAffiliate(request);
  if ('response' in auth) return auth.response;

  const products = await prisma.product.findMany({
    where: { sellerProfile: { affiliate: { userId: auth.user.id } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ success: true, products });
}

export async function POST(request: NextRequest) {
  const auth = await requireAffiliate(request);
  if ('response' in auth) return auth.response;

  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid product', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const seller = await prisma.sellerProfile.findFirst({
    where: { affiliate: { userId: auth.user.id }, status: 'APPROVED' },
  });
  if (!seller) {
    return NextResponse.json(
      { success: false, error: 'SMEE must approve the seller application first' },
      { status: 403 },
    );
  }

  const product = await prisma.product.create({
    data: { ...parsed.data, currency: parsed.data.currency.toUpperCase(), sellerProfileId: seller.id },
  });
  return NextResponse.json({ success: true, product }, { status: 201 });
}

