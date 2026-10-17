import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { upsertNotification } from '@/lib/notification-service';
import { SOURCING_AREAS } from '@/lib/sourcing';

// Kiểm tra dữ liệu người dùng gửi lên
const postSchema = z.object({
  title: z.string().trim().min(10, 'Tiêu đề cần ít nhất 10 ký tự').max(150),
  content: z.string().trim().min(20, 'Nội dung cần ít nhất 20 ký tự').max(3000),
  categoryId: z.string().min(1).optional(),
  province: z.enum(SOURCING_AREAS).optional(),
  durationDays: z.union([z.literal(7), z.literal(15), z.literal(30)]), // chỉ cho 7 / 15 / 30 ngày
});

export async function POST(request: NextRequest) {
  const auth = await requireUser(request); // phải đăng nhập và đã xác thực email
  if ('response' in auth) return auth.response;

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Chống spam: tối đa 3 bài / 24 giờ cho mỗi tài khoản
  const rate = await checkRateLimit(auth.user.id, 'sourcing-post', 3, 24 * 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: 'Bạn đã đăng đủ 3 bài trong 24 giờ, vui lòng thử lại sau.' },
      { status: 429 },
    );
  }

  // Danh mục (nếu chọn) phải có thật và đang bật
  if (d.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: d.categoryId, isActive: true },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json({ success: false, error: 'Danh mục không hợp lệ' }, { status: 400 });
    }
  }

  // Tạo bài. Trạng thái mặc định là PENDING (chờ admin duyệt), chưa có expiresAt
  const post = await prisma.sourcingPost.create({
    data: {
      userId: auth.user.id,
      title: d.title,
      content: d.content,
      categoryId: d.categoryId ?? null,
      province: d.province ?? null,
      durationDays: d.durationDays,
    },
  });

  // Báo cho admin biết có bài chờ duyệt. Lỗi thông báo không được làm hỏng việc đăng bài.
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        upsertNotification({
          userId: admin.id,
          type: 'SOURCING_POST_PENDING',
          title: 'Có bài "Cần mua" chờ duyệt',
          message: d.title,
          linkUrl: '/admin/sourcing',
          entityType: 'SOURCING_POST',
          entityId: post.id,
        }),
      ),
    );
  } catch (error) {
    console.error('Gửi thông báo bài chờ duyệt thất bại:', error);
  }

  return NextResponse.json({ success: true, post: { id: post.id, status: post.status } }, { status: 201 });
}