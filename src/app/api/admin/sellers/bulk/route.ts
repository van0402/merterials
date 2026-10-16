import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(['publish', 'delete']),
});

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const parsed = bulkSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

  if (parsed.data.action === 'publish') {
        const withoutCategory = await prisma.supplierProfile.findMany({
      where: { id: { in: parsed.data.ids }, status: 'DRAFT', categories: { none: {} } },
      select: { companyName: true },
    });
    if (withoutCategory.length > 0) {
      const names = withoutCategory.slice(0, 3).map((c) => c.companyName).join(', ');
      const more = withoutCategory.length > 3 ? '…' : '';
      return NextResponse.json(
        { success: false, error: `Còn ${withoutCategory.length} công ty chưa chọn danh mục: ${names}${more}` },
        { status: 400 },
      );
    }
    const result = await prisma.supplierProfile.updateMany({
      where: { id: { in: parsed.data.ids }, status: 'DRAFT' },
      data: { status: 'APPROVED', isVerified: false, reviewedBy: auth.user.id, reviewedAt: new Date() },
    });
    return NextResponse.json({ success: true, updated: result.count });
  }

  // action === 'delete' — chỉ cho xoá hồ sơ đang DRAFT, không đụng tới hồ sơ đã publish
  const result = await prisma.supplierProfile.deleteMany({
    where: { id: { in: parsed.data.ids }, status: 'DRAFT' },
  });
  return NextResponse.json({ success: true, deleted: result.count });
}