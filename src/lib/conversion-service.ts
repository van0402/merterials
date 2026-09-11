import {
  AttributionMethod,
  type Commission,
  CommissionSource,
  ConversionType,
  Prisma,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  PARTNER_TIERS,
  referralRateForCompletedOrders,
  sellerPlatformFeeBpsForRevenue,
  shouldCreateReferralCommission,
  tierForCompletedOrders,
} from '@/lib/commission-policy';

export interface ConversionInput {
  externalId: string;
  idempotencyKey: string;
  eventType?: ConversionType;
  amountCents: number;
  currency?: string;
  customerEmail: string;
  customerName?: string;
  referralCode?: string;
  attributionKey?: string;
  sellerSku?: string;
  metadata?: Prisma.InputJsonObject;
}

export async function processConversion(input: ConversionInput) {
  if (!input.externalId || !input.idempotencyKey) {
    throw new Error('externalId and idempotencyKey are required');
  }
  if (!input.customerEmail || !input.customerEmail.includes('@')) {
    throw new Error('customerEmail is required');
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('amountCents must be a positive integer');
  }

  const existing = await prisma.conversion.findFirst({
    where: {
      OR: [{ externalId: input.externalId }, { idempotencyKey: input.idempotencyKey }],
    },
    include: { commissions: true },
  });
  if (existing) return { conversion: existing, duplicate: true };

  return prisma.$transaction(async (tx) => {
    const product = input.sellerSku
      ? await tx.product.findUnique({
          where: { sku: input.sellerSku },
          include: { sellerProfile: { include: { affiliate: true } } },
        })
      : null;
    const seller = product?.sellerProfile;
    if (product && !product.isActive) {
      throw new Error('Product is inactive');
    }
    if (seller && seller.status !== 'APPROVED') {
      throw new Error('Seller is not approved by SMEE');
    }

    let referrer = input.referralCode
      ? await tx.affiliate.findUnique({
          where: { referralCode: input.referralCode },
          include: { user: { select: { status: true } } },
        })
      : null;
    const attribution = input.attributionKey
      ? await tx.attribution.findFirst({
          where: { key: input.attributionKey, expiresAt: { gt: new Date() } },
          include: { affiliate: { include: { user: { select: { status: true } } } } },
        })
      : null;
    if (!referrer && attribution) referrer = attribution.affiliate;
    if (referrer && referrer.user.status !== 'ACTIVE') {
      throw new Error('Referrer is not active');
    }
    let referral: { id: string } | null = null;

    const sellerAffiliate = seller?.affiliate ?? null;
    const beneficiary = sellerAffiliate ?? referrer;
    if (!beneficiary) throw new Error('No seller or referrer attribution found');

    if (!referral && referrer) {
      referral = await tx.referral.findFirst({
        where: { affiliateId: referrer.id, leadEmail: input.customerEmail.toLowerCase() },
      });
      if (!referral) {
        referral = await tx.referral.create({
          data: {
            affiliateId: referrer.id,
            leadName: input.customerName || 'Customer',
            leadEmail: input.customerEmail.toLowerCase(),
            status: 'APPROVED',
            metadata: { source: 'conversion' },
          },
        });
      }
    }

    const sellerGross = seller
      ? await tx.conversion.aggregate({
          where: { sellerProfileId: seller.id, status: { not: 'REJECTED' } },
          _sum: { amountCents: true },
        })
      : null;
    const sellerFeeBps = seller
      ? sellerPlatformFeeBpsForRevenue((sellerGross?._sum.amountCents ?? 0) + input.amountCents)
      : null;
    const platformFeeCents = sellerFeeBps
      ? Math.floor((input.amountCents * sellerFeeBps) / 10_000)
      : 0;
    const attributionMethod = seller
      ? AttributionMethod.SELLER_DIRECT
      : input.attributionKey
        ? AttributionMethod.ATTRIBUTION_KEY
        : AttributionMethod.REFERRAL_CODE;

    const conversion = await tx.conversion.create({
      data: {
        affiliateId: beneficiary.id,
        referralId: referral?.id,
        attributionId: attribution?.id,
        sellerProfileId: seller?.id,
        productId: product?.id,
        eventType: input.eventType ?? ConversionType.PURCHASE,
        amountCents: input.amountCents,
        currency: (input.currency ?? 'VND').toUpperCase(),
        status: 'APPROVED',
        externalId: input.externalId,
        idempotencyKey: input.idempotencyKey,
        attributionMethod,
        platformFeeBps: sellerFeeBps,
        platformFeeCents,
        eventMetadata: {
          ...(input.metadata ?? {}),
          customerEmail: input.customerEmail.toLowerCase(),
          ...(input.referralCode ? { referralCode: input.referralCode } : {}),
          ...(input.attributionKey ? { attributionKey: input.attributionKey } : {}),
          ...(input.sellerSku ? { sellerSku: input.sellerSku } : {}),
        },
      },
    });

    const settings = await tx.programSettings.findFirst();
    const maturesAt = new Date();
    maturesAt.setDate(maturesAt.getDate() + (settings?.commissionHoldDays ?? 30));
    const commissions: Commission[] = [];

    if (seller && sellerAffiliate && sellerFeeBps) {
      commissions.push(
        await tx.commission.create({
          data: {
            conversionId: conversion.id,
            affiliateId: sellerAffiliate.id,
            userId: sellerAffiliate.userId,
            amountCents: input.amountCents - platformFeeCents,
            rate: (10_000 - sellerFeeBps) / 100,
            rateBps: 10_000 - sellerFeeBps,
            source: CommissionSource.SELLER,
            status: 'PENDING',
            maturesAt,
          },
        }),
      );
      if (seller.platformFeeBps !== sellerFeeBps) {
        await tx.sellerProfile.update({
          where: { id: seller.id },
          data: { platformFeeBps: sellerFeeBps },
        });
      }
    }

    // A seller may also arrive through another KOL/KOC's link. The same person
    // never receives both seller and referral earnings for one order.
    if (referrer && shouldCreateReferralCommission(referrer.id, sellerAffiliate?.id)) {
      const rateBps = referralRateForCompletedOrders(referrer.completedOrders);
      commissions.push(
        await tx.commission.create({
          data: {
            conversionId: conversion.id,
            affiliateId: referrer.id,
            userId: referrer.userId,
            amountCents: Math.floor((input.amountCents * rateBps) / 10_000),
            rate: rateBps / 100,
            rateBps,
            source: CommissionSource.REFERRAL,
            status: 'PENDING',
            maturesAt,
          },
        }),
      );

      const completedOrders = referrer.completedOrders + 1;
      const tier = tierForCompletedOrders(completedOrders);
      const benefits = PARTNER_TIERS[tier];
      await tx.affiliate.update({
        where: { id: referrer.id },
        data: {
          completedOrders,
          tier,
          referralRateBps: benefits.referralRateBps,
          personalCareEnabled: benefits.personalCare,
          mediaSupportEnabled: benefits.mediaSupport,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: null,
        action: 'CONVERSION_PROCESSED',
        objectType: 'CONVERSION',
        objectId: conversion.id,
        payload: {
          externalId: input.externalId,
          commissionSources: commissions.map((commission) => commission.source),
        },
      },
    });

    return { conversion: { ...conversion, commissions }, duplicate: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
