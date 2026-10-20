import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request);
  if ('response' in auth) return auth.response;

  const { id } = await params;

  // Chỉ chủ bài mới đóng được, và chỉ khi bài đang mở (APPROVED)
  const result = await prisma.sourcingPost.updateMany({
    where: { id, userId: auth.user.id, status: 'APPROVED' },
    data: { status: 'CLOSED', closedAt: new Date() },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { success: false, error: 'Không thể đóng bài này.' },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}