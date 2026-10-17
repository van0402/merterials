import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const STATUS_VALUES = ['PENDING', 'APPROVED', 'REJECTED', 'CLOSED'] as const;

// Admin lấy danh sách bài "Cần mua" (lọc theo trạng thái, phân trang)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request); // chỉ admin
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = STATUS_VALUES.find((s) => s === searchParams.get('status')); // sai/trống thì không lọc
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20));
  const where = status ? { status } : {};

  const [posts, total, pending] = await Promise.all([
    prisma.sourcingPost.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },     // người đăng (admin thấy tên đầy đủ)
        category: { select: { name: true } },
        _count: { select: { quotes: true } },              // số báo giá
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sourcingPost.count({ where }),
    prisma.sourcingPost.count({ where: { status: 'PENDING' } }), // số bài đang chờ, đếm trên tất cả
  ]);

  return NextResponse.json({ success: true, posts, total, pending, page, pageSize });
}