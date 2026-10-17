import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { upsertNotification } from '@/lib/notification-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Hai hành động: duyệt (không cần gì thêm) hoặc từ chối (bắt buộc ghi lý do)
const reviewSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({
    action: z.literal('reject'),
    reason: z.string().trim().min(5, 'Cần ghi lý do từ chối (ít nhất 5 ký tự)').max(500),
  }),
]);

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { id } = await context.params;
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
      { status: 400 },
    );
  }
  const review = parsed.data;

  const post = await prisma.sourcingPost.findUnique({
    where: { id },
    select: { id: true, userId: true, title: true, status: true, durationDays: true },
  });
  if (!post) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy bài đăng' }, { status: 404 });
  }
  if (post.status !== 'PENDING') {
    return NextResponse.json({ success: false, error: 'Bài này đã được xử lý rồi' }, { status: 409 });
  }

  const now = new Date();
  const data =
    review.action === 'approve'
      ? {
          status: 'APPROVED' as const,
          reviewedBy: auth.user.id,
          reviewedAt: now,
          // Hạn bài tính từ lúc DUYỆT: hôm nay + số ngày người đăng đã chọn
          expiresAt: new Date(now.getTime() + post.durationDays * 86_400_000),
        }
      : {
          status: 'REJECTED' as const,
          reviewedBy: auth.user.id,
          reviewedAt: now,
          rejectReason: review.reason,
        };

  // updateMany kèm điều kiện status = PENDING: nếu 2 admin bấm cùng lúc thì chỉ 1 người thành công
  const result = await prisma.sourcingPost.updateMany({ where: { id, status: 'PENDING' }, data });
  if (result.count === 0) {
    return NextResponse.json({ success: false, error: 'Bài này vừa được xử lý bởi người khác' }, { status: 409 });
  }

  // Báo cho người đăng. Lỗi thông báo không được làm hỏng việc duyệt.
  try {
    const approved = review.action === 'approve';
    await upsertNotification({
      userId: post.userId,
      type: approved ? 'SOURCING_POST_APPROVED' : 'SOURCING_POST_REJECTED',
      title: approved ? 'Bài "Cần mua" của bạn đã được duyệt' : 'Bài "Cần mua" của bạn chưa được duyệt',
      message: approved ? post.title : `${post.title}. Lý do: ${review.action === 'reject' ? review.reason : ''}`,
      linkUrl: '/can-mua/cua-toi',
      entityType: 'SOURCING_POST',
      entityId: post.id,
    });
  } catch (error) {
    console.error('Gửi thông báo duyệt bài thất bại:', error);
  }

  return NextResponse.json({ success: true });
}