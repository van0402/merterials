import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const cronToken =
    request.headers.get('x-cron-secret') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const cronAuthorized =
    Boolean(process.env.CRON_SECRET) &&
    cronToken === process.env.CRON_SECRET;
  let actorId: string | null = null;
  if (!cronAuthorized) {
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    actorId = auth.user.id;
  }

  const idempotencyKey =
    request.headers.get('idempotency-key') ?? `mature-${new Date().toISOString().slice(0, 10)}`;
  const duplicate = await prisma.maturationRun.findUnique({ where: { idempotencyKey } });
  if (duplicate) return NextResponse.json({ success: true, duplicate: true, run: duplicate });

  try {
    const run = await prisma.$transaction(async (tx) => {
      const commissions = await tx.commission.findMany({
        where: { status: 'PENDING', maturesAt: { lte: new Date() } },
      });
      const totals = new Map<string, number>();
      for (const commission of commissions) {
        totals.set(
          commission.affiliateId,
          (totals.get(commission.affiliateId) ?? 0) + commission.amountCents,
        );
      }

      const updated = await tx.commission.updateMany({
        where: { id: { in: commissions.map((item) => item.id) }, status: 'PENDING' },
        data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: actorId ?? 'SMEE_CRON' },
      });
      if (updated.count !== commissions.length) throw new Error('Concurrent maturation conflict');

      for (const [affiliateId, totalCents] of totals) {
        await tx.affiliate.update({
          where: { id: affiliateId },
          data: { balanceCents: { increment: totalCents } },
        });
      }

      const totalCents = commissions.reduce((sum, item) => sum + item.amountCents, 0);
      const created = await tx.maturationRun.create({
        data: { idempotencyKey, commissionCount: commissions.length, totalCents },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'MATURE_COMMISSIONS',
          objectType: 'MATURATION_RUN',
          objectId: created.id,
          payload: { idempotencyKey, commissionCount: commissions.length, totalCents },
        },
      });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({ success: true, duplicate: false, run });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mature commissions';
    return NextResponse.json({ success: false, error: message }, { status: 409 });
  }
}

// Vercel Cron invokes configured paths with GET.
export async function GET(request: NextRequest) {
  return POST(request);
}
