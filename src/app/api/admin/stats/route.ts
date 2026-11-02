import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [total, approved, pendingCompanies, inquiriesThisMonth, pendingInquiries, pendingSourcing, recent] =
    await Promise.all([
      prisma.supplierProfile.count({ where: { status: { not: 'DRAFT' } } }),
      prisma.supplierProfile.count({ where: { status: 'APPROVED' } }),
      prisma.supplierProfile.count({ where: { status: 'PENDING', userId: { not: null } } }),
      prisma.inquiry.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.inquiry.count({ where: { status: 'PENDING' } }),
      prisma.sourcingPost.count({ where: { status: 'PENDING' } }),
      prisma.supplierProfile.findMany({
        where: { status: { not: 'DRAFT' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          companyName: true,
          businessTypes: true,
          province: true,
          status: true,
          createdAt: true,
          categories: { take: 1, select: { category: { select: { name: true } } } },
        },
      }),
    ]);

  return NextResponse.json({
    success: true,
    counts: { total, approved, pendingCompanies, inquiriesThisMonth, pendingInquiries, pendingSourcing },
    recent: recent.map((c) => ({
      id: c.id,
      companyName: c.companyName,
      businessTypes: c.businessTypes,
      province: c.province,
      status: c.status,
      createdAt: c.createdAt,
      categoryName: c.categories[0]?.category.name ?? null,
    })),
  });
}