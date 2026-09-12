import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@smee.vn';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe-SMEE-2026!';
  const password = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: 'Administrator', role: 'ADMIN', status: 'ACTIVE' },
    create: {
      email: adminEmail,
      name: 'Administrator',
      password,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: 'vat-lieu-xay-dung' },
    update: {},
    create: {
      name: 'Vật liệu xây dựng',
      slug: 'vat-lieu-xay-dung',
    },
  });

  const supplierEmail = 'supplier-demo@smee.vn';
  const supplierPassword = await bcrypt.hash('ChangeMe-Supplier-2026!', 12);
  const supplierUser = await prisma.user.upsert({
    where: { email: supplierEmail },
    update: { name: 'Nhà cung cấp mẫu', role: 'SUPPLIER', status: 'ACTIVE' },
    create: {
      email: supplierEmail,
      name: 'Nhà cung cấp mẫu',
      password: supplierPassword,
      role: 'SUPPLIER',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  const supplierProfile = await prisma.supplierProfile.upsert({
    where: { userId: supplierUser.id },
    update: {},
    create: {
      userId: supplierUser.id,
      companyName: 'Công ty Vật liệu Demo',
      taxCode: '0000000000',
      phone: '0900000000',
      contactEmail: supplierEmail,
      address: '123 Đường Demo, Quận 1',
      province: 'TP. Hồ Chí Minh',
      status: 'APPROVED',
      isVerified: true,
    },
  });

  await prisma.supplierCategory.upsert({
    where: {
      supplierProfileId_categoryId: {
        supplierProfileId: supplierProfile.id,
        categoryId: category.id,
      },
    },
    update: {},
    create: {
      supplierProfileId: supplierProfile.id,
      categoryId: category.id,
    },
  });

  await prisma.material.upsert({
    where: { id: `${supplierProfile.id}-demo-material` },
    update: {},
    create: {
      id: `${supplierProfile.id}-demo-material`,
      supplierProfileId: supplierProfile.id,
      categoryId: category.id,
      name: 'Xi măng PCB40',
      unit: 'bao 50kg',
      priceMinCents: 8_000_000,
      priceMaxCents: 9_000_000,
    },
  });

  console.log(`Seeded admin: ${adminEmail}`);
  console.log(`Seeded demo supplier: ${supplierEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
