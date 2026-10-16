import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const STATUS_VALUES = ['PENDING', 'RESPONDED', 'CLOSED'] as const;

// Lấy danh sách yêu cầu báo giá (có lọc theo trạng thái + phân trang)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request); // chỉ admin mới vào được
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = STATUS_VALUES.find((s) => s === searchParams.get('status')); // không hợp lệ -> bỏ lọc
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20));
  const where = status ? { status } : {};

  const [inquiries, total, pending] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      include: {
        // lấy kèm thông tin để admin liên hệ chuyển tiếp cho công ty
        supplierProfile: {
          select: { id: true, companyName: true, contactEmail: true, phone: true, userId: true },
        },
        material: { select: { name: true } },
        user: { select: { name: true, email: true } }, // người gửi nếu đã đăng nhập
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inquiry.count({ where }),
    prisma.inquiry.count({ where: { status: 'PENDING' } }), // số yêu cầu đang chờ (luôn đếm tất cả)
  ]);

  return NextResponse.json({ success: true, inquiries, total, pending, page, pageSize });
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(STATUS_VALUES),
});

// Đổi trạng thái 1 yêu cầu (VD: admin đã chuyển tiếp -> "Đã trả lời")
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

  await prisma.inquiry.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  return NextResponse.json({ success: true });
}