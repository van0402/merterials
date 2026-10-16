import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { upsertNotification } from '@/lib/notification-service';

const inquirySchema = z.object({
  supplierProfileId: z.string().min(1),
  materialId: z.string().min(1).optional(),
  message: z.string().trim().min(5).max(2000),
  guestName: z.string().trim().min(2).max(150).optional(),
  guestPhone: z.string().trim().min(8).max(20).optional(),
  guestEmail: z.string().trim().email().optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  const parsed = inquirySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Thông tin không hợp lệ', details: parsed.error.issues },
      { status: 400 },
    );
  }
  const d = parsed.data;

  if (!userId && !d.guestName) {
    return NextResponse.json(
      { success: false, error: 'Vui lòng nhập họ tên liên hệ' },
      { status: 400 },
    );
  }
  if (!userId && !d.guestPhone && !d.guestEmail) {
    return NextResponse.json(
      { success: false, error: 'Vui lòng nhập số điện thoại hoặc email liên hệ' },
      { status: 400 },
    );
  }

  const supplier = await prisma.supplierProfile.findUnique({
    where: { id: d.supplierProfileId },
    select: { id: true, status: true, userId: true, companyName: true },
  });
  if (!supplier || supplier.status !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Không tìm thấy nhà cung cấp' }, { status: 404 });
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      supplierProfileId: d.supplierProfileId,
      materialId: d.materialId || null,
      userId: userId || null,
      message: d.message,
      guestName: userId ? null : d.guestName,
      guestPhone: userId ? null : d.guestPhone || null,
      guestEmail: userId ? null : d.guestEmail || null,
    },
  });

  if (supplier.userId) {
    await upsertNotification({
      userId: supplier.userId,
      type: 'NEW_INQUIRY',
      title: 'Có yêu cầu báo giá mới',
      message: d.message.length > 120 ? `${d.message.slice(0, 117)}...` : d.message,
      linkUrl: '/supplier/dashboard/inquiries',
      entityType: 'INQUIRY',
      entityId: inquiry.id,
    });
  }  else {
    // Công ty chưa có tài khoản (admin nhập/import): báo cho TẤT CẢ admin để xử lý thay
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        upsertNotification({
          userId: admin.id,
          type: 'NEW_INQUIRY',
          title: `Yêu cầu báo giá cho ${supplier.companyName}`,
          message: d.message.length > 120 ? `${d.message.slice(0, 117)}...` : d.message,
          linkUrl: '/admin/inquiries', // bấm thông báo -> mở trang RFQ của admin
          entityType: 'INQUIRY',
          entityId: inquiry.id,
        }),
      ),
    );
  }

  return NextResponse.json({ success: true, inquiry }, { status: 201 });
}