import { CommissionSource, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PARTNER_TIERS, tierForCompletedOrders } from '@/lib/commission-policy';

export interface RefundInput {
  conversionExternalId: string;
  externalId: string;
  idempotencyKey: string;
  amountCents: number;
  reason?: string;
  actorId?: string | null;
}

export async function processRefund(input: RefundInput) {
  const duplicate = await prisma.refund.findFirst({
    where: { OR: [{ externalId: input.externalId }, { idempotencyKey: input.idempotencyKey }] },
  });
  if (duplicate) return { refund: duplicate, duplicate: true };

  return prisma.$transaction(async (tx) => {
    const conversion = await tx.conversion.findUnique({
      where: { externalId: input.conversionExternalId },
      include: { commissions: true, refunds: true },
    });
    if (!conversion) throw new Error('Conversion not found');
    if (input.amountCents !== conversion.amountCents) {
      throw new Error('Only full refunds are currently supported');
    }

    const refund = await tx.refund.create({
      data: {
        conversionId: conversion.id,
        externalId: input.externalId,
        idempotencyKey: input.idempotencyKey,
        amountCents: input.amountCents,
        reason: input.reason,
      },
    });

    for (const commission of conversion.commissions) {
      if (commission.status === 'CANCELLED' || commission.status === 'CLAWBACK') continue;

      if (commission.status === 'APPROVED' || commission.status === 'PAID') {
        await tx.affiliate.update({
          where: { id: commission.affiliateId },
          data: { balanceCents: { decrement: commission.amountCents } },
        });
      }
      await tx.commission.update({
        where: { id: commission.id },
        data: {
          status: commission.status === 'PAID' ? 'CLAWBACK' : 'CANCELLED',
          clawbackNote: `Refund ${input.externalId}: ${input.reason ?? 'No reason provided'}`,
        },
      });

      if (commission.source === CommissionSource.REFERRAL) {
        const affiliate = await tx.affiliate.findUniqueOrThrow({ where: { id: commission.affiliateId } });
        const completedOrders = Math.max(0, affiliate.completedOrders - 1);
        const tier = tierForCompletedOrders(completedOrders);
        const benefits = PARTNER_TIERS[tier];
        await tx.affiliate.update({
          where: { id: affiliate.id },
          data: {
            completedOrders,
            tier,
            referralRateBps: benefits.referralRateBps,
            personalCareEnabled: benefits.personalCare,
            mediaSupportEnabled: benefits.mediaSupport,
          },
        });
      }
    }

    await tx.conversion.update({ where: { id: conversion.id }, data: { status: 'REJECTED' } });
    await tx.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: 'REFUND_PROCESSED',
        objectType: 'REFUND',
        objectId: refund.id,
        payload: {
          conversionExternalId: input.conversionExternalId,
          externalId: input.externalId,
          amountCents: input.amountCents,
        },
      },
    });
    return { refund, duplicate: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

