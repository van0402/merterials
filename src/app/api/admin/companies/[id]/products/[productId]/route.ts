import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{
    id: string;
    productId: string;
  }>;
}

const materialSchema = z.object({
  name: z.string().trim().min(2).max(200),
  categoryId: z.string().trim().optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  function: z.string().trim().max(2000).optional().or(z.literal('')),
  unit: z.string().trim().max(50).optional().or(z.literal('')),
  priceMinCents: z.number().int().min(0).max(2147483647, 'Giá tối đa 2.147.483.647đ').optional().nullable(),
  priceMaxCents: z.number().int().min(0).max(2147483647, 'Giá tối đa 2.147.483.647đ').optional().nullable(),
  currency: z.string().trim().max(10).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
});

async function updateProduct(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const { id: companyId, productId } = await context.params;

const profile = await prisma.supplierProfile.findUnique({
  where: { id: companyId },
  select: { id: true },
});

if (!profile) {
  return NextResponse.json(
    { success: false, error: 'Không tìm thấy doanh nghiệp' },
    { status: 404 },
  );
}

  const parsed = materialSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Thông tin không hợp lệ', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const result = await prisma.material.updateMany({
   where: {
  id: productId,
  supplierProfileId: companyId,
},
    data: {
      categoryId: d.categoryId || null,
      name: d.name,
      description: d.description || null,
      function: d.function || null,
      unit: d.unit || null,
      priceMinCents: d.priceMinCents ?? null,
      priceMaxCents: d.priceMaxCents ?? null,
      currency: d.currency || 'VND',
      images: d.images ?? [],
      specifications: d.specifications ?? {},
      isActive: d.isActive ?? false,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy sản phẩm' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    return await updateProduct(request, context);
  } catch (error) {
    console.error('Admin product update failed:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu gửi lên không đúng định dạng JSON.' },
        { status: 400 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { success: false, error: 'Danh mục hoặc doanh nghiệp không còn tồn tại. Vui lòng tải lại trang.' },
          { status: 400 },
        );
      }
      if (error.code === 'P2022') {
        return NextResponse.json(
          { success: false, error: 'Cấu trúc dữ liệu máy chủ chưa đồng bộ với phiên bản ứng dụng. Vui lòng kiểm tra cập nhật database.' },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Máy chủ gặp lỗi khi lưu sản phẩm. Vui lòng kiểm tra Terminal máy chủ để biết nguyên nhân.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

 const { id: companyId, productId } = await context.params;

const profile = await prisma.supplierProfile.findUnique({
  where: { id: companyId },
  select: { id: true },
});

if (!profile) {
  return NextResponse.json(
    { success: false, error: 'Không tìm thấy doanh nghiệp' },
    { status: 404 },
  );
}

  const result = await prisma.material.deleteMany({
    where: {
  id: productId,
  supplierProfileId: companyId,
},
  });

  if (result.count === 0) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy sản phẩm' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
