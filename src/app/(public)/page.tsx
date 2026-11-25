import { prisma } from '@/lib/prisma';
import { HomeClient } from '@/components/site/home-client';
import { JsonLd } from '@/components/seo/json-ld';

// Mỗi lần vào trang lấy danh sách mới (và không chạy lúc docker build vì không có DB)
export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://supply.smee.vn';

// Server lấy sẵn danh sách công ty để Google đọc được ngay trong HTML trang chủ
export default async function Home() {
  const companies = await prisma.supplierProfile.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      companyName: true,
      industryRaw: true,
      country: true,
      categories: { take: 2, select: { category: { select: { name: true } } } },
      _count: { select: { materials: true } },
    },
  });

  // Xáo trộn để mỗi lần vào thấy công ty khác nhau (giống API /api/public/companies cũ)
  for (let i = companies.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [companies[i], companies[j]] = [companies[j], companies[i]];
  }

  const siteSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Supply Material – SMEE',
    url: SITE,
    logo: `${SITE}/images/smee-logo.png`,
    description: 'Sàn kết nối doanh nghiệp với nhà cung cấp nguyên vật liệu, nhà máy sản xuất đã được SMEE duyệt hồ sơ.',
  };

  return (
    <>
      <JsonLd data={siteSchema} />
      <HomeClient initialCompanies={companies.slice(0, 24)} />
    </>
  );
}
