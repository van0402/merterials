import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAffiliate } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { SMEE_CONTRACT_COMPANY } from '@/lib/affiliate-contract';

const imageDataUrl = z.string()
  .max(4_500_000, 'Ảnh không được vượt quá 3 MB')
  .regex(/^data:image\/(png|jpeg|webp);base64,/, 'Ảnh phải có định dạng PNG, JPEG hoặc WebP');

const contractSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(9).max(20),
  contractEmail: z.string().email(),
  address: z.string().trim().min(10).max(500),
  position: z.string().trim().max(100).optional().nullable(),
  citizenId: z.string().trim().regex(/^\d{9,12}$/, 'CCCD phải gồm 9 đến 12 chữ số'),
  citizenIdIssuedAt: z.string().date(),
  citizenIdIssuedBy: z.string().trim().min(2).max(200),
  bankName: z.string().trim().min(2).max(200),
  bankBranch: z.string().trim().max(200).optional().nullable(),
  bankProvince: z.string().trim().max(120).optional().nullable(),
  bankAccountNumber: z.string().trim().regex(/^\d{5,30}$/, 'Số tài khoản chỉ gồm chữ số'),
  bankAccountHolder: z.string().trim().min(2).max(150),
  citizenIdFrontData: imageDataUrl,
  citizenIdBackData: imageDataUrl,
  signatureData: imageDataUrl,
  action: z.enum(['save', 'generate']).default('save'),
});

export async function GET(request: NextRequest) {
  const auth = await requireAffiliate(request);
  if ('response' in auth) return auth.response;

  const affiliate = await prisma.affiliate.findUnique({
    where: { userId: auth.user.id },
    include: { user: true, contract: true },
  });
  if (!affiliate) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ KOL/KOC' }, { status: 404 });
  }

  const settings = await prisma.programSettings.findFirst({
    select: { cookieDuration: true, commissionHoldDays: true },
  });

  return NextResponse.json({
    success: true,
    contract: affiliate.contract,
    defaults: {
      fullName: affiliate.user.name,
      phone: '',
      contractEmail: affiliate.user.email,
      loginEmail: affiliate.user.email,
      affiliateCode: affiliate.referralCode,
      creatorType: affiliate.creatorType,
      tier: affiliate.tier,
      referralRatePercent: affiliate.referralRateBps / 100,
      cookieDurationDays: settings?.cookieDuration ?? 30,
      commissionHoldDays: settings?.commissionHoldDays ?? 30,
    },
    company: SMEE_CONTRACT_COMPANY,
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAffiliate(request);
  if ('response' in auth) return auth.response;

  const parsed = contractSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Thông tin hợp đồng chưa hợp lệ', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { userId: auth.user.id },
    include: { contract: true },
  });
  if (!affiliate) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ KOL/KOC' }, { status: 404 });
  }

  const { action, citizenIdIssuedAt, ...data } = parsed.data;
  const contractNumber = affiliate.contract?.contractNumber
    ?? `SMEE-AFF-${new Date().getFullYear()}-${affiliate.referralCode.replace(/[^A-Z0-9-]/gi, '').toUpperCase()}`;
  const generatedAt = action === 'generate' ? new Date() : affiliate.contract?.generatedAt;

  const contract = await prisma.affiliateContract.upsert({
    where: { affiliateId: affiliate.id },
    create: {
      ...data,
      affiliateId: affiliate.id,
      contractNumber,
      citizenIdIssuedAt: new Date(`${citizenIdIssuedAt}T00:00:00.000Z`),
      status: action === 'generate' ? 'GENERATED' : 'DRAFT',
      generatedAt,
    },
    update: {
      ...data,
      citizenIdIssuedAt: new Date(`${citizenIdIssuedAt}T00:00:00.000Z`),
      status: action === 'generate' ? 'GENERATED' : 'DRAFT',
      generatedAt,
    },
  });

  return NextResponse.json({
    success: true,
    message: action === 'generate' ? 'Đã tạo hợp đồng' : 'Đã lưu bản nháp',
    contract,
  });
}
