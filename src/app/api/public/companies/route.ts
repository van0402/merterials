import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const companies = await prisma.supplierProfile.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      companyName: true,
      industryRaw: true,
      businessTypes: true,
      country: true,
      _count: { select: { materials: true } },
    },
  });

  for (let i = companies.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [companies[i], companies[j]] = [companies[j], companies[i]];
  }

  return NextResponse.json({ success: true, companies: companies.slice(0, 24) });
}
