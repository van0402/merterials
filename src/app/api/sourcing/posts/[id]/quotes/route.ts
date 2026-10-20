import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { upsertNotification } from '@/lib/notification-service';
import { emailService } from '@/lib/email';

const quoteSchema = z.object({
  message: z.string().trim().min(10, 'Nội dung báo giá cần ít nhất 10 ký tự').max(2000),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request);
  if ('response' in auth) return auth.response;

  const { id: postId } = await params;

  const parsed = quoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
      { status: 400 },
    );
  }

  // Chỉ nhà cung cấp đã được duyệt mới báo giá được
  const supplier = await prisma.supplierProfile.findUnique({
    where: { userId: auth.user.id },
    select: { id: true, companyName: true, status: true },
  });
  if (!supplier || supplier.status !== 'APPROVED') {
    return NextResponse.json(
      { success: false, error: 'Chỉ nhà cung cấp đã được duyệt mới gửi được báo giá.' },
      { status: 403 },
    );
  }

  // Chống spam: tối đa 20 báo giá / giờ cho mỗi tài khoản
  const rate = await checkRateLimit(auth.user.id, 'sourcing-quote', 20, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: 'Bạn gửi quá nhiều báo giá, vui lòng thử lại sau.' },
      { status: 429 },
    );
  }

  // Bài phải đã duyệt và còn hạn
  const post = await prisma.sourcingPost.findUnique({
    where: { id: postId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!post || post.status !== 'APPROVED' || !post.expiresAt || post.expiresAt <= new Date()) {
    return NextResponse.json(
      { success: false, error: 'Bài đăng không tồn tại hoặc đã hết hạn.' },
      { status: 404 },
    );
  }
  if (post.userId === auth.user.id) {
    return NextResponse.json(
      { success: false, error: 'Bạn không thể báo giá cho bài của chính mình.' },
      { status: 400 },
    );
  }

  // Tạo báo giá. Mỗi công ty chỉ báo 1 lần cho 1 bài (unique postId + supplierProfileId)
  let quote;
  try {
    quote = await prisma.sourcingQuote.create({
      data: {
        postId: post.id,
        supplierProfileId: supplier.id,
        userId: auth.user.id,
        message: parsed.data.message,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Công ty bạn đã gửi báo giá cho bài này rồi.' },
        { status: 409 },
      );
    }
    throw error;
  }

  // Báo cho người đăng (chuông + email). Lỗi ở đây không được làm hỏng việc gửi báo giá.
  try {
    await upsertNotification({
      userId: post.userId,
      type: 'SOURCING_QUOTE_RECEIVED',
      title: 'Bạn có báo giá mới',
      message: `${supplier.companyName} báo giá cho: ${post.title}`,
      linkUrl: '/can-mua/cua-toi',
      entityType: 'SOURCING_QUOTE',
      entityId: quote.id,
    });
  } catch (error) {
    console.error('Gửi thông báo báo giá thất bại:', error);
  }
  try {
    await emailService.sendNewSourcingQuoteEmail({
      to: post.user.email,
      posterName: post.user.name,
      postTitle: post.title,
      companyName: supplier.companyName,
      message: parsed.data.message,
    });
  } catch (error) {
    console.error('Gửi email báo giá thất bại:', error);
  }

  return NextResponse.json({ success: true, quote: { id: quote.id } }, { status: 201 });
}