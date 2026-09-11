import { Prisma, TransactionStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { processConversion } from '@/lib/conversion-service';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  externalId: z.string().min(1),
  referralId: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default('VND'),
  description: z.string().max(2000).optional(),
  invoiceId: z.string().optional(),
  paymentMethod: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const referralId = request.nextUrl.searchParams.get('referralId') ?? undefined;
  const affiliateId = request.nextUrl.searchParams.get('affiliateId') ?? undefined;
  const where: Prisma.TransactionWhereInput = { referralId, affiliateId };
  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      referral: true,
      affiliate: { include: { user: true, partnerGroup: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ success: true, transactions });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid transaction', details: parsed.error.issues }, { status: 400 });
  }

  const referral = await prisma.referral.findUnique({
    where: { id: parsed.data.referralId },
    include: { affiliate: true },
  });
  if (!referral) {
    return NextResponse.json({ success: false, error: 'Referral not found' }, { status: 404 });
  }

  const conversionResult = await processConversion({
    externalId: parsed.data.externalId,
    idempotencyKey: request.headers.get('idempotency-key') ?? `manual-${parsed.data.externalId}`,
    amountCents: parsed.data.amountCents,
    currency: parsed.data.currency,
    customerEmail: referral.leadEmail,
    customerName: referral.leadName,
    referralCode: referral.affiliate.referralCode,
    metadata: { createdBy: auth.user.id, source: 'admin_transaction' },
  });

  const transaction = await prisma.transaction.upsert({
    where: { id: conversionResult.conversion.id },
    update: {},
    create: {
      id: conversionResult.conversion.id,
      referralId: referral.id,
      affiliateId: referral.affiliateId,
      customerId: referral.subscriptionId,
      customerName: referral.leadName,
      customerEmail: referral.leadEmail,
      amountCents: parsed.data.amountCents,
      commissionCents: conversionResult.conversion.commissions
        .filter((commission) => commission.source === 'REFERRAL')
        .reduce((sum, commission) => sum + commission.amountCents, 0),
      commissionRate: referral.affiliate.referralRateBps / 10_000,
      status: 'COMPLETED',
      description: parsed.data.description,
      invoiceId: parsed.data.invoiceId,
      paymentMethod: parsed.data.paymentMethod,
      paidAt: new Date(),
      createdBy: auth.user.id,
    },
  });

  return NextResponse.json(
    { success: true, duplicate: conversionResult.duplicate, transaction, conversion: conversionResult.conversion },
    { status: conversionResult.duplicate ? 200 : 201 },
  );
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const body = await request.json();
  if (!body.id) return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
  const status = body.status && Object.values(TransactionStatus).includes(body.status)
    ? body.status as TransactionStatus
    : undefined;
  const transaction = await prisma.transaction.update({
    where: { id: body.id },
    data: {
      status,
      description: body.description,
      invoiceId: body.invoiceId,
      paymentMethod: body.paymentMethod,
      paidAt: body.paidAt ? new Date(body.paidAt) : undefined,
    },
  });
  return NextResponse.json({ success: true, transaction });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
  return NextResponse.json(
    { success: false, error: 'Transactions are financial records and cannot be deleted; refund the conversion instead.' },
    { status: 409 },
  );
}
