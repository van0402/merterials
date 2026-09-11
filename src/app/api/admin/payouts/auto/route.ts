import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// POST - Process auto-payouts for all eligible affiliates
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const admin = auth.user;

  try {
    const { dryRun = false } = await request.json().catch(() => ({ dryRun: false }));

    // Get program settings for min payout threshold
    const settings = await prisma.programSettings.findFirst();
    const minPayoutCents = settings?.minPayoutCents || 100000; // Default ₹1000

    // Find all affiliates with balance above minimum payout threshold
    // Status check is on User model, not Affiliate
    const eligibleAffiliates = await prisma.affiliate.findMany({
      where: {
        balanceCents: { gte: minPayoutCents },
        user: { status: 'ACTIVE' },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (eligibleAffiliates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No affiliates eligible for auto-payout',
        processed: 0,
        totalAmountCents: 0,
      });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        eligible: eligibleAffiliates.map(a => ({
          id: a.id,
          name: a.user.name,
          email: a.user.email,
          balanceCents: a.balanceCents,
        })),
        totalAffiliates: eligibleAffiliates.length,
        totalAmountCents: eligibleAffiliates.reduce((s, a) => s + a.balanceCents, 0),
      });
    }

    // Process payouts
    const results: Array<{
      affiliateId: string;
      name: string;
      payoutId?: string;
      amountCents?: number;
      status: string;
      error?: string;
    }> = [];
    let totalProcessed = 0;
    let totalAmountCents = 0;

    for (const affiliate of eligibleAffiliates) {
      try {
        const idempotencyKey = `auto-${new Date().toISOString().slice(0, 10)}-${affiliate.id}`;
        const payout = await prisma.$transaction(async (tx) => {
          const duplicate = await tx.payout.findUnique({ where: { idempotencyKey } });
          if (duplicate) return duplicate;

          const commissions = await tx.commission.findMany({
            where: { affiliateId: affiliate.id, status: 'APPROVED', payoutId: null },
          });
          const payoutAmountCents = commissions.reduce((sum, item) => sum + item.amountCents, 0);
          if (payoutAmountCents < minPayoutCents) throw new Error('Balance is no longer eligible');

          const balance = await tx.affiliate.updateMany({
            where: { id: affiliate.id, balanceCents: { gte: payoutAmountCents } },
            data: { balanceCents: { decrement: payoutAmountCents } },
          });
          if (balance.count !== 1) throw new Error('Concurrent balance update');

          const created = await tx.payout.create({
            data: {
              affiliateId: affiliate.id,
              userId: affiliate.user.id,
              amountCents: payoutAmountCents,
              commissionCount: commissions.length,
              status: 'PENDING',
              method: 'AUTO',
              notes: 'Auto-payout processed',
              createdBy: admin.id,
              idempotencyKey,
            },
          });
          await tx.commission.updateMany({
            where: { id: { in: commissions.map((item) => item.id) }, status: 'APPROVED', payoutId: null },
            data: { status: 'PAID', payoutId: created.id, paidAt: new Date() },
          });
          await tx.auditLog.create({
            data: {
              action: 'AUTO_PAYOUT_CREATED',
              actorId: admin.id,
              objectType: 'PAYOUT',
              objectId: created.id,
              payload: { affiliateId: affiliate.id, amountCents: payoutAmountCents, idempotencyKey },
            },
          });
          return created;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        results.push({
          affiliateId: affiliate.id,
          name: affiliate.user.name,
          payoutId: payout.id,
          amountCents: payout.amountCents,
          status: 'CREATED',
        });

        totalProcessed++;
        totalAmountCents += payout.amountCents;
      } catch (err) {
        results.push({
          affiliateId: affiliate.id,
          name: affiliate.user.name,
          status: 'FAILED',
          error: (err as Error).message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-payout processed for ${totalProcessed} affiliates`,
      processed: totalProcessed,
      totalAmountCents,
      results,
    });
  } catch (error) {
    console.error('Auto-payout error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process auto-payouts' }, { status: 500 });
  }
}

// GET - Get auto-payout configuration and status
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const settings = await prisma.programSettings.findFirst();

    // Count eligible affiliates
    const minPayoutCents = settings?.minPayoutCents || 100000;
    const eligibleCount = await prisma.affiliate.count({
      where: {
        balanceCents: { gte: minPayoutCents },
        user: { status: 'ACTIVE' },
      },
    });

    const totalPendingBalance = await prisma.affiliate.aggregate({
      where: {
        balanceCents: { gte: minPayoutCents },
        user: { status: 'ACTIVE' },
      },
      _sum: { balanceCents: true },
    });

    // Recent auto-payouts
    const recentPayouts = await prisma.payout.findMany({
      where: { notes: { contains: 'Auto-payout' } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        affiliate: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        minPayoutCents,
        payoutFrequency: settings?.payoutFrequency || 'MONTHLY',
        autoPayoutsEnabled: settings?.autoApprovePayouts || false,
      },
      stats: {
        eligibleAffiliates: eligibleCount,
        totalPendingCents: totalPendingBalance._sum?.balanceCents || 0,
      },
      recentPayouts,
    });
  } catch (error) {
    console.error('Auto-payout config error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 });
  }
}
