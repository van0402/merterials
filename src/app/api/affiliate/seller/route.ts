import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAffiliate } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const normalizeExternalUrl = (url?: string | null) => {
  const value = (url || '').trim();
  if (!value) return null;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  return `https://${value.replace(/^\/+/, '')}`;
};

const applicationSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(120),
  contactPhone: z.string().trim().max(30).optional(),
  websiteUrl: z.string().trim().max(300).optional(),
  contactEmail: z.string().trim().email().max(160),
  businessService: z.string().trim().min(2).max(500),
  description: z.string().trim().max(3000).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAffiliate(request);
  if ('response' in auth) return auth.response;

  const affiliate = await prisma.affiliate.findUnique({
    where: { userId: auth.user.id },
    include: { sellerProfile: { include: { products: true } } },
  });

  return NextResponse.json({ success: true, seller: affiliate?.sellerProfile ?? null });
}

export async function POST(request: NextRequest) {
  const auth = await requireAffiliate(request);
  if ('response' in auth) return auth.response;

  const parsed = applicationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid seller application', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const affiliate = await prisma.affiliate.findUnique({ where: { userId: auth.user.id } });
  if (!affiliate) {
    return NextResponse.json({ success: false, error: 'KOL/KOC profile not found' }, { status: 404 });
  }

  const sellerData = {
    ...parsed.data,
    productSummary: parsed.data.businessService,
    websiteUrl: normalizeExternalUrl(parsed.data.websiteUrl),
    contactPhone: parsed.data.contactPhone || null,
    description: parsed.data.description || null,
  };

  const seller = await prisma.sellerProfile.upsert({
    where: { affiliateId: affiliate.id },
    update: {
      ...sellerData,
      status: 'PENDING',
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
    },
    create: {
      affiliateId: affiliate.id,
      ...sellerData,
    },
  });

  return NextResponse.json({ success: true, seller }, { status: 201 });
}

