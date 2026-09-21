import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { upsertNotification } from '@/lib/notification-service';

const reviewSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']),
  reviewNotes: z.string().trim().max(2000).optional(),
});

const STATUS_VALUES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status');
  const status = STATUS_VALUES.find((s) => s === statusParam);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20));

  const baseWhere = { userId: { not: null } } as const;
  const where = status ? { ...baseWhere, status } : baseWhere;

  const [sellers, total, grouped] = await Promise.all([
    prisma.supplierProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        categories: { include: { category: true } },
        capabilities: { include: { capability: true } },
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supplierProfile.count({ where }),
    prisma.supplierProfile.groupBy({ by: ['status'], where: baseWhere, _count: true }),
  ]);

  const counts = Object.fromEntries(STATUS_VALUES.map((s) => [s, 0])) as Record<(typeof STATUS_VALUES)[number], number>;
  for (const g of grouped) {
    if (STATUS_VALUES.includes(g.status as (typeof STATUS_VALUES)[number])) {
      counts[g.status as (typeof STATUS_VALUES)[number]] = g._count;
    }
  }

  return NextResponse.json({ success: true, sellers, total, page, pageSize, counts });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid review', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const seller = await prisma.$transaction(async (tx) => {
  const updated = await tx.supplierProfile.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      reviewNotes: parsed.data.reviewNotes,
      reviewedBy: auth.user.id,
      reviewedAt: new Date(),
    },
  });
  if (parsed.data.status === 'APPROVED' && updated.userId) {
    await tx.user.update({
      where: { id: updated.userId },
      data: { role: 'SUPPLIER' },
    });
  }
  await tx.auditLog.create({
    data: {
      actorId: auth.user.id,
      action: 'REVIEW_SUPPLIER_APPLICATION',
      objectType: 'SUPPLIER_PROFILE',
      objectId: updated.id,
      payload: parsed.data,
    },
  });
  return updated;
});

  const NOTIFICATION_CONTENT: Record<typeof parsed.data.status, { title: string; message: string }> = {
    APPROVED: {
      title: 'Hồ sơ đã được duyệt',
      message: `Chúc mừng! Hồ sơ doanh nghiệp "${seller.companyName}" đã được duyệt và kích hoạt trạng thái Nhà cung cấp.`,
    },
    REJECTED: {
      title: 'Hồ sơ bị từ chối',
      message: parsed.data.reviewNotes || 'Hồ sơ chưa đủ điều kiện. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.',
    },
    SUSPENDED: {
      title: 'Tài khoản tạm khoá',
      message: parsed.data.reviewNotes || 'Tài khoản nhà cung cấp của bạn đã bị tạm khoá. Vui lòng liên hệ hỗ trợ.',
    },
  };

  if (seller.userId) {
    await upsertNotification({
      userId: seller.userId,
      type: `SUPPLIER_${parsed.data.status}`,
      title: NOTIFICATION_CONTENT[parsed.data.status].title,
      message: NOTIFICATION_CONTENT[parsed.data.status].message,
      linkUrl: '/',
      entityType: 'SUPPLIER_PROFILE',
      entityId: seller.id,
    });
  }

  return NextResponse.json({ success: true, seller });
}

