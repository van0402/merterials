import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const affiliate = await prisma.affiliate.findUniqueOrThrow({
    where: { referralCode: 'SMEE-KOC' },
  });

  const payoutConversion = await prisma.conversion.upsert({
    where: { externalId: 'e2e-payout-fixture' },
    update: {},
    create: {
      externalId: 'e2e-payout-fixture',
      idempotencyKey: 'e2e-payout-fixture',
      affiliateId: affiliate.id,
      eventType: 'PURCHASE',
      amountCents: 1_000_000,
      currency: 'VND',
      status: 'APPROVED',
      eventMetadata: { fixture: true },
    },
  });
  let payoutCommission = await prisma.commission.findFirst({
    where: { conversionId: payoutConversion.id, source: 'REFERRAL' },
  });
  if (!payoutCommission) {
    payoutCommission = await prisma.commission.create({
      data: {
        conversionId: payoutConversion.id,
        affiliateId: affiliate.id,
        userId: affiliate.userId,
        amountCents: 50_000,
        rate: 5,
        rateBps: 500,
        source: 'REFERRAL',
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { balanceCents: { increment: payoutCommission.amountCents } },
    });
  }

  const refundConversion = await prisma.conversion.upsert({
    where: { externalId: 'e2e-refund-fixture' },
    update: {},
    create: {
      externalId: 'e2e-refund-fixture',
      idempotencyKey: 'e2e-refund-fixture',
      affiliateId: affiliate.id,
      eventType: 'PURCHASE',
      amountCents: 2_000_000,
      currency: 'VND',
      status: 'APPROVED',
      eventMetadata: { fixture: true },
    },
  });
  const refundCommission = await prisma.commission.findFirst({
    where: { conversionId: refundConversion.id },
  });
  if (!refundCommission) {
    await prisma.commission.create({
      data: {
        conversionId: refundConversion.id,
        affiliateId: affiliate.id,
        userId: affiliate.userId,
        amountCents: 100_000,
        rate: 5,
        rateBps: 500,
        source: 'REFERRAL',
        status: 'PENDING',
        maturesAt: new Date(Date.now() + 86_400_000),
      },
    });
  }

  const matureConversion = await prisma.conversion.upsert({
    where: { externalId: 'e2e-mature-fixture' },
    update: {},
    create: {
      externalId: 'e2e-mature-fixture',
      idempotencyKey: 'e2e-mature-fixture',
      affiliateId: affiliate.id,
      eventType: 'PURCHASE',
      amountCents: 3_000_000,
      currency: 'VND',
      status: 'APPROVED',
      eventMetadata: { fixture: true },
    },
  });
  if (!(await prisma.commission.findFirst({ where: { conversionId: matureConversion.id } }))) {
    await prisma.commission.create({
      data: {
        conversionId: matureConversion.id,
        affiliateId: affiliate.id,
        userId: affiliate.userId,
        amountCents: 150_000,
        rate: 5,
        rateBps: 500,
        source: 'REFERRAL',
        status: 'PENDING',
        maturesAt: new Date(Date.now() - 86_400_000),
      },
    });
  }

  console.log(JSON.stringify({
    affiliateId: affiliate.id,
    commissionId: payoutCommission.id,
    referralCode: affiliate.referralCode,
    refundConversionExternalId: refundConversion.externalId,
    refundConversionAmountCents: refundConversion.amountCents,
  }));
}

main()
  .finally(async () => prisma.$disconnect());
