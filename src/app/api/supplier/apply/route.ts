import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const applySchema = z.object({
  companyName: z.string().trim().min(2).max(200),
  taxCode: z.string().trim().regex(/^\d{10}(\d{3})?$/, 'Mã số thuế phải gồm 10 hoặc 13 chữ số'),
  phone: z.string().trim().min(8).max(20),
  contactEmail: z.string().trim().email(),
  address: z.string().trim().min(5).max(300),
  province: z.string().trim().min(2).max(100),
  district: z.string().trim().max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  categoryIds: z.array(z.string().min(1)).min(1, 'Chọn ít nhất 1 ngành nghề'),
});

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ('response' in auth) return auth.response;

  const parsed = applySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Thông tin không hợp lệ', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const existing = await prisma.supplierProfile.findUnique({ where: { userId: auth.user.id } });
  if (existing) {
    return NextResponse.json(
      { success: false, error: 'Tài khoản này đã có hồ sơ đăng ký supplier rồi' },
      { status: 409 },
    );
  }

  try {
    const supplier = await prisma.$transaction(async (tx) => {
      const created = await tx.supplierProfile.create({
        data: {
          userId: auth.user.id,
          companyName: parsed.data.companyName,
          taxCode: parsed.data.taxCode,
          phone: parsed.data.phone,
          contactEmail: parsed.data.contactEmail,
          address: parsed.data.address,
          province: parsed.data.province,
          district: parsed.data.district,
          description: parsed.data.description,
          status: 'PENDING',
        },
      });
      await tx.supplierCategory.createMany({
        data: parsed.data.categoryIds.map((categoryId) => ({
          supplierProfileId: created.id,
          categoryId,
        })),
      });
      await tx.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: 'SUPPLIER_APPLY',
          objectType: 'SUPPLIER_PROFILE',
          objectId: created.id,
          payload: { companyName: created.companyName },
        },
      });
      return created;
    });

    return NextResponse.json({ success: true, supplier }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Mã số thuế này đã được đăng ký bởi công ty khác' },
        { status: 409 },
      );
    }
    console.error('Supplier apply error:', error);
    return NextResponse.json({ success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' }, { status: 500 });
  }
}