import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

function isVietnamCountry(country: string) {
  return ['việt nam', 'vietnam', 'vn'].includes(country.trim().toLowerCase());
}

const applySchema = z.object({
  companyName: z.string().trim().min(2).max(200),
  tradingName: z.string().trim().max(200).optional(),
  country: z.string().trim().min(2).max(100).default('Việt Nam'),
  taxCode: z.string().trim().max(50).optional(),
  foundedYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  businessType: z.enum(['MANUFACTURER', 'DISTRIBUTOR', 'IMPORTER', 'OEM_ODM', 'SYSTEM_INTEGRATOR', 'TECHNICAL_SERVICE']).optional(),
  phone: z.string().trim().min(8).max(20),
  contactEmail: z.string().trim().email(),
  website: z.string().trim().url().optional().or(z.literal('')),
  address: z.string().trim().min(5).max(300),
  province: z.string().trim().min(2).max(100),
  district: z.string().trim().max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  mainMarket: z.enum(['NATIONWIDE', 'NORTH', 'CENTRAL', 'SOUTH', 'EXPORT']).optional(),
  companySize: z.enum(['UNDER_10', 'FROM_10_TO_50', 'FROM_51_TO_200', 'FROM_201_TO_500', 'OVER_500']).optional(),
  categoryIds: z.array(z.string().min(1)).min(1, 'Chọn ít nhất 1 ngành nghề'),
  capabilityIds: z.array(z.string().min(1)).optional(),
  logoUrl: z.string().url().optional(),
  documents: z.array(z.object({
    type: z.enum(['BUSINESS_LICENSE', 'QUALITY_CERT', 'OTHER']),
    fileUrl: z.string().url(),
  })).optional(),
}).superRefine((data, ctx) => {
  if (!isVietnamCountry(data.country)) return;
  if (!data.taxCode) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['taxCode'], message: 'Mã số thuế là bắt buộc với công ty Việt Nam' });
    return;
  }
  if (!/^\d{10}(\d{3})?$/.test(data.taxCode)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['taxCode'], message: 'Mã số thuế phải gồm 10 hoặc 13 chữ số' });
  }
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
          tradingName: parsed.data.tradingName,
          country: parsed.data.country,
          taxCode: parsed.data.taxCode,
          foundedYear: parsed.data.foundedYear,
          businessType: parsed.data.businessType,
          mainMarket: parsed.data.mainMarket,
          companySize: parsed.data.companySize,
          logoUrl: parsed.data.logoUrl,
          phone: parsed.data.phone,
          contactEmail: parsed.data.contactEmail,
          website: parsed.data.website || undefined,
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
      if (parsed.data.capabilityIds?.length) {
        await tx.supplierCapability.createMany({
          data: parsed.data.capabilityIds.map((capabilityId) => ({
            supplierProfileId: created.id,
            capabilityId,
          })),
        });
      }
      if (parsed.data.documents?.length) {
        await tx.supplierDocument.createMany({
          data: parsed.data.documents.map((doc) => ({
            supplierProfileId: created.id,
            type: doc.type,
            fileUrl: doc.fileUrl,
          })),
        });
      }
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