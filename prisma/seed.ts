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

 const categoriesData = [
  { name: 'Tự động hóa, Robot & Smart Factory', slug: 'tu-dong-hoa', icon: '/icon/robotic-arm.png' },
  { name: 'Nhựa & Polymer', slug: 'nhua-polymer', icon: '/icon/layers.png' },
  { name: 'Máy móc & Thiết bị công nghiệp', slug: 'may-moc-thiet-bi', icon: '/icon/water-pump.png' },
  { name: 'Hóa chất & Hóa dầu', slug: 'hoa-chat-hoa-dau', icon: '/icon/molecule.png' },
  { name: 'Vật liệu mới & Vật liệu đặc biệt', slug: 'vat-lieu-moi', icon: '/icon/recycle.png' },
  { name: 'Khuôn mẫu & Gia công cơ khí chính xác', slug: 'khuon-mau-co-khi', icon: '/icon/mechanical.png' },
  { name: 'Điện, Điện tử & Cáp', slug: 'dien-dien-tu-cap', icon: '/icon/electric-panel.png' },
  { name: 'In ấn & Vật liệu in', slug: 'in-an', icon: '/icon/print.png' },
  { name: 'CNTT, Phần mềm & AI', slug: 'cntt-phan-mem-ai', icon: '/icon/technology.png' },
  { name: 'An toàn công nghiệp & Năng lượng', slug: 'an-toan-nang-luong', icon: '/icon/energy-storage.png' },
  { name: 'Đo lường, Kiểm tra & Machine Vision', slug: 'do-luong-kiem-tra', icon: '/icon/vision.png' },
  { name: 'Kho vận & Thiết bị nâng hạ', slug: 'kho-van-nang-ha', icon: '/icon/scissor-lift.png' },
];

const categories = await Promise.all(
  categoriesData.map((data) =>
    prisma.category.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    }),
  ),
);
const category = categories[0];

    const capabilityNames = [
    'OEM', 'ODM', 'CNC', 'Injection Moulding', 'Extrusion', 'Tooling',
    'Mold Design', 'Automation Integration', 'Machine Vision',
    'Robot Integration', 'Smart Factory', 'R&D',
  ];

  function slugify(text: string) {
    return text.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  for (const name of capabilityNames) {
    await prisma.capability.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }

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
