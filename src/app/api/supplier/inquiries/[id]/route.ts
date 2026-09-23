import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const statusSchema = z.object({
  status: z.enum(['PENDING', 'RESPONDED', 'CLOSED']),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if ('response' in auth) return auth.response;

  const profile = await prisma.supplierProfile.findUnique({ where: { userId: auth.user.id } });
  if (!profile) {
    return NextResponse.json({ success: false, error: 'Chưa có hồ sơ doanh nghiệp' }, { status: 404 });
  }

  const { id } = await context.params;
  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Trạng thái không hợp lệ' }, { status: 400 });
  }

  const result = await prisma.inquiry.updateMany({
    where: { id, supplierProfileId: profile.id },
    data: { status: parsed.data.status },
  });

  if (result.count === 0) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy yêu cầu' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}