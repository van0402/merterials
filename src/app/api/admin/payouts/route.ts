import { PayoutStatus, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { currencySymbolFor } from '@/lib/money';

const createSchema = z.object({
  affiliateId: z.string().min(1),
  commissionIds: z.array(z.string().min(1)).min(1),
  method: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2000).optional(),
  idempotencyKey: z.string().min(8).max(200).optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(PayoutStatus).optional(),
  method: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2000).optional(),
});

function parsePayoutNotes(notes: string | null) {
  if (!notes) return { noteText: null, paymentInfo: null, paymentSummary: null };
  try {
    const parsed = JSON.parse(notes) as {
      label?: string;
      paymentInfo?: unknown;
      paymentSummary?: string;
    };
    return {
      noteText: parsed.label || null,
      paymentInfo: parsed.paymentInfo && typeof parsed.paymentInfo === 'object' ? parsed.paymentInfo : null,
      paymentSummary: typeof parsed.paymentSummary === 'string' ? parsed.paymentSummary : null,
    };
  } catch {
    return { noteText: notes, paymentInfo: null, paymentSummary: null };
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const affiliateId = request.nextUrl.searchParams.get('affiliateId') ?? undefined;
  const settings = await prisma.programSettings.findFirst({
    select: { currency: true }
  });
  const currency = settings?.currency || 'VND';
  const payouts = await prisma.payout.findMany({
    where: { affiliateId },
    include: {
      affiliate: {
        select: { id: true, referralCode: true, user: { select: { name: true, email: true } } },
      },
      commissions: { select: { id: true, source: true, amountCents: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    currency,
    currencySymbol: currencySymbolFor(currency),
    payouts: payouts.map((payout) => {
      const parsedNotes = parsePayoutNotes(payout.notes);
      return {
        ...payout,
        notes: parsedNotes.noteText,
        paymentInfo: parsedNotes.paymentInfo,
        paymentSummary: parsedNotes.paymentSummary,
        affiliateName: payout.affiliate.user.name,
        affiliateEmail: payout.affiliate.user.email,
      };
    }),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid payout', details: parsed.error.issues }, { status: 400 });
  }

  const idempotencyKey =
    request.headers.get('idempotency-key') ?? parsed.data.idempotencyKey;
  if (!idempotencyKey) {
    return NextResponse.json({ success: false, error: 'Idempotency-Key is required' }, { status: 400 });
  }

  const existing = await prisma.payout.findUnique({ where: { idempotencyKey } });
  if (existing) return NextResponse.json({ success: true, duplicate: true, payout: existing });

  try {
    const payout = await prisma.$transaction(async (tx) => {
      const affiliate = await tx.affiliate.findUnique({
        where: { id: parsed.data.affiliateId },
        include: { user: true },
      });
      if (!affiliate) throw new Error('Affiliate not found');

      const commissions = await tx.commission.findMany({
        where: {
          id: { in: parsed.data.commissionIds },
          affiliateId: affiliate.id,
          status: 'APPROVED',
          payoutId: null,
        },
      });
      if (commissions.length !== parsed.data.commissionIds.length) {
        throw new Error('One or more commissions are not payable');
      }

      const amountCents = commissions.reduce((total, item) => total + item.amountCents, 0);
      const balanceUpdate = await tx.affiliate.updateMany({
        where: { id: affiliate.id, balanceCents: { gte: amountCents } },
        data: { balanceCents: { decrement: amountCents } },
      });
      if (balanceUpdate.count !== 1) throw new Error('Insufficient affiliate balance');

      const created = await tx.payout.create({
        data: {
          affiliateId: affiliate.id,
          userId: affiliate.userId,
          amountCents,
          commissionCount: commissions.length,
          method: parsed.data.method ?? 'BANK_TRANSFER',
          notes: parsed.data.notes,
          createdBy: auth.user.id,
          idempotencyKey,
        },
      });

      const paid = await tx.commission.updateMany({
        where: { id: { in: commissions.map((item) => item.id) }, status: 'APPROVED', payoutId: null },
        data: { status: 'PAID', payoutId: created.id, paidAt: new Date() },
      });
      if (paid.count !== commissions.length) throw new Error('Concurrent payout conflict');

      await tx.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: 'CREATE_PAYOUT',
          objectType: 'PAYOUT',
          objectId: created.id,
          payload: { amountCents, commissionIds: parsed.data.commissionIds, idempotencyKey },
        },
      });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({ success: true, duplicate: false, payout }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create payout';
    return NextResponse.json({ success: false, error: message }, { status: 409 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid payout update', details: parsed.error.issues }, { status: 400 });
  }

  const payout = await prisma.$transaction(async (tx) => {
    const updated = await tx.payout.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.status,
        method: parsed.data.method,
        notes: parsed.data.notes,
        processedAt: parsed.data.status === 'COMPLETED'
          ? new Date()
          : parsed.data.status === undefined
            ? undefined
            : null,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: 'UPDATE_PAYOUT',
        objectType: 'PAYOUT',
        objectId: updated.id,
        payload: parsed.data,
      },
    });
    return updated;
  });
  return NextResponse.json({ success: true, payout });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Payout ID is required' }, { status: 400 });

  try {
    await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({ where: { id }, include: { commissions: true } });
      if (!payout) throw new Error('Payout not found');
      if (!['PENDING', 'FAILED'].includes(payout.status)) {
        throw new Error('Only pending or failed payouts can be cancelled');
      }

      await tx.commission.updateMany({
        where: { payoutId: payout.id },
        data: { status: 'APPROVED', payoutId: null, paidAt: null },
      });
      await tx.affiliate.update({
        where: { id: payout.affiliateId },
        data: { balanceCents: { increment: payout.amountCents } },
      });
      await tx.payout.delete({ where: { id: payout.id } });
      await tx.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: 'CANCEL_PAYOUT',
          objectType: 'PAYOUT',
          objectId: payout.id,
          payload: { restoredCents: payout.amountCents },
        },
      });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel payout';
    return NextResponse.json({ success: false, error: message }, { status: 409 });
  }
}
