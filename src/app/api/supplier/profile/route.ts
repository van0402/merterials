import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

function isVietnamCountry(country: string) {
  return ['việt nam', 'vietnam', 'vn'].includes(country.trim().toLowerCase());
}

const updateSchema = z
  .object({
    companyName: z.string().trim().min(2).max(200),
    tradingName: z.string().trim().max(200).optional().or(z.literal('')),
    country: z.string().trim().min(2).max(100),
    taxCode: z.string().trim().max(50).optional().or(z.literal('')),
    foundedYear: z.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
    businessTypes: z
      .array(z.enum(['MANUFACTURER', 'DISTRIBUTOR', 'IMPORTER', 'OEM_ODM', 'SYSTEM_INTEGRATOR', 'TECHNICAL_SERVICE']))
      .optional(),
    contactName: z.string().trim().max(150).optional().or(z.literal('')),
    phone: z.string().trim().min(8).max(20),
    contactEmail: z.string().trim().email().optional().or(z.literal('')),
    website: z.string().trim().url().optional().or(z.literal('')),
    address: z.string().trim().max(300).optional().or(z.literal('')),
    province: z.string().trim().max(100).optional().or(z.literal('')),
    district: z.string().trim().max(100).optional().or(z.literal('')),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    mainMarket: z.enum(['NATIONWIDE', 'NORTH', 'CENTRAL', 'SOUTH', 'EXPORT']).optional().nullable(),
    companySize: z
      .enum(['UNDER_10', 'FROM_10_TO_50', 'FROM_51_TO_200', 'FROM_201_TO_500', 'OVER_500'])
      .optional()
      .nullable(),
    categoryIds: z.array(z.string().min(1)).min(1, 'Chọn ít nhất 1 ngành nghề'),
    capabilityIds: z.array(z.string().min(1)).optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    coverImageUrl: z.string().url().optional().or(z.literal('')),
    galleryImages: z.array(z.string().url()).max(20).optional(),
  })
  .superRefine((data, ctx) => {
    if (!isVietnamCountry(data.country)) return;
    if (!data.taxCode) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['taxCode'], message: 'Mã số thuế là bắt buộc với công ty Việt Nam' });
      return;
    }
    if (!/^\d{10}(\d{3})?$/.test(data.taxCode)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['taxCode'], message: 'Mã số thuế phải gồm 10 hoặc 13 chữ số' });
    }
  });

export async function PUT(request: NextRequest) {
  const auth = await requireUser(request);
  if ('response' in auth) return auth.response;

  const profile = await prisma.supplierProfile.findUnique({ where: { userId: auth.user.id } });
  if (!profile) {
    return NextResponse.json({ success: false, error: 'Chưa có hồ sơ doanh nghiệp' }, { status: 404 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Thông tin không hợp lệ', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const d = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.supplierProfile.update({
        where: { id: profile.id },
        data: {
          companyName: d.companyName,
          tradingName: d.tradingName || null,
          country: d.country,
          taxCode: d.taxCode || null,
          foundedYear: d.foundedYear ?? null,
          businessTypes: d.businessTypes ?? [],
          contactName: d.contactName || null,
          phone: d.phone,
          contactEmail: d.contactEmail || null,
          website: d.website || null,
          address: d.address || null,
          province: d.province || null,
          district: d.district || null,
          description: d.description || null,
          mainMarket: d.mainMarket ?? null,
          companySize: d.companySize ?? null,
          logoUrl: d.logoUrl || null,
          coverImageUrl: d.coverImageUrl || null,
          galleryImages: d.galleryImages ?? [],
        },
      });

      await tx.supplierCategory.deleteMany({ where: { supplierProfileId: profile.id } });
      await tx.supplierCategory.createMany({
        data: d.categoryIds.map((categoryId) => ({ supplierProfileId: profile.id, categoryId })),
      });

      await tx.supplierCapability.deleteMany({ where: { supplierProfileId: profile.id } });
      if (d.capabilityIds?.length) {
        await tx.supplierCapability.createMany({
          data: d.capabilityIds.map((capabilityId) => ({ supplierProfileId: profile.id, capabilityId })),
        });
      }

      return result;
    });

    return NextResponse.json({ success: true, supplier: updated });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Mã số thuế này đã được đăng ký bởi công ty khác' },
        { status: 409 },
      );
    }
    console.error('Supplier profile update error:', error);
    return NextResponse.json({ success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' }, { status: 500 });
  }
}
