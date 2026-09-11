import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@smee.vn';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe-SMEE-2026!';
  const password = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: 'SMEE Administrator', role: 'ADMIN', status: 'ACTIVE' },
    create: {
      email: adminEmail,
      name: 'SMEE Administrator',
      password,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const creatorSeeds = [
    {
      email: 'koc@smee.vn',
      name: 'SMEE KOC Demo',
      referralCode: 'SMEE-KOC',
      creatorType: 'KOC' as const,
      completedOrders: 0,
      tier: 'STANDARD' as const,
      referralRateBps: 500,
    },
    {
      email: 'vip@smee.vn',
      name: 'SMEE VIP Demo',
      referralCode: 'SMEE-VIP',
      creatorType: 'KOL' as const,
      completedOrders: 5,
      tier: 'VIP' as const,
      referralRateBps: 600,
    },
    {
      email: 'seller@smee.vn',
      name: 'SMEE Seller Demo',
      referralCode: 'SMEE-SELLER',
      creatorType: 'KOL' as const,
      completedOrders: 10,
      tier: 'SVIP' as const,
      referralRateBps: 700,
    },
  ];

  for (const seed of creatorSeeds) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: { name: seed.name, status: 'ACTIVE' },
      create: {
        email: seed.email,
        name: seed.name,
        password,
        role: 'AFFILIATE',
        status: 'ACTIVE',
      },
    });
    const affiliate = await prisma.affiliate.upsert({
      where: { userId: user.id },
      update: {
        creatorType: seed.creatorType,
        completedOrders: seed.completedOrders,
        tier: seed.tier,
        referralRateBps: seed.referralRateBps,
        personalCareEnabled: seed.tier !== 'STANDARD',
        mediaSupportEnabled: seed.tier === 'SVIP',
      },
      create: {
        userId: user.id,
        referralCode: seed.referralCode,
        creatorType: seed.creatorType,
        completedOrders: seed.completedOrders,
        tier: seed.tier,
        referralRateBps: seed.referralRateBps,
        personalCareEnabled: seed.tier !== 'STANDARD',
        mediaSupportEnabled: seed.tier === 'SVIP',
      },
    });

    if (seed.email === 'seller@smee.vn') {
      const seller = await prisma.sellerProfile.upsert({
        where: { affiliateId: affiliate.id },
        update: {
          status: 'APPROVED',
          reviewedBy: admin.id,
          platformFeeBps: 2000,
          contactName: 'SMEE Seller Demo',
          contactPhone: '0900000000',
          websiteUrl: 'https://smee.vn',
          contactEmail: 'seller@smee.vn',
          businessService: 'Sản phẩm mẫu',
        },
        create: {
          affiliateId: affiliate.id,
          businessName: 'SMEE Demo Store',
          contactName: 'SMEE Seller Demo',
          contactPhone: '0900000000',
          websiteUrl: 'https://smee.vn',
          contactEmail: 'seller@smee.vn',
          businessService: 'Sản phẩm mẫu',
          productSummary: 'Sản phẩm mẫu dùng để kiểm thử luồng seller của SMEE.',
          status: 'APPROVED',
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          platformFeeBps: 2000,
        },
      });
      await prisma.product.upsert({
        where: { sku: 'SMEE-DEMO-001' },
        update: { sellerProfileId: seller.id, isActive: true },
        create: {
          sellerProfileId: seller.id,
          sku: 'SMEE-DEMO-001',
          name: 'SMEE Demo Product',
          priceCents: 1_000_000,
          currency: 'VND',
        },
      });
    }
  }

  await prisma.programSettings.upsert({
    where: { programId: 'smee-main' },
    update: {
      programName: 'SMEE Creator Commerce',
      productName: 'SMEE',
      currency: 'VND',
      companyLogo: '/images/smee-logo.png',
    },
    create: {
      programId: 'smee-main',
      productName: 'SMEE',
      programName: 'SMEE Creator Commerce',
      websiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
      portalSubdomain: 'partners',
      currency: 'VND',
      companyLogo: '/images/smee-logo.png',
      commissionHoldDays: 30,
      minPayoutCents: 100_000_000,
    },
  });

  console.log(`Seeded SMEE admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

