import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20));

  const where = { status: { not: 'DRAFT' as const } };

  const [companies, total] = await Promise.all([
    prisma.supplierProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supplierProfile.count({ where }),
  ]);

  return NextResponse.json({ success: true, companies, total, page, pageSize });
}
