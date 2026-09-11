import { AffiliateContractStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { logAuditAction } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['approve']),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const status = request.nextUrl.searchParams.get('status') as AffiliateContractStatus | null;
  const where = status && Object.values(AffiliateContractStatus).includes(status)
    ? { status }
    : undefined;

  const [contracts, settings] = await Promise.all([
    prisma.affiliateContract.findMany({
      where,
      include: {
        affiliate: {
          include: {
            user: { select: { id: true, name: true, email: true, status: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.programSettings.findFirst({
      select: { cookieDuration: true, commissionHoldDays: true },
    }),
  ]);

  return NextResponse.json({
    success: true,
    contracts: contracts.map((contract) => ({
      ...contract,
      defaults: {
        loginEmail: contract.affiliate.user.email,
        affiliateCode: contract.affiliate.referralCode,
        creatorType: contract.affiliate.creatorType,
        tier: contract.affiliate.tier,
        referralRatePercent: contract.affiliate.referralRateBps / 100,
        cookieDurationDays: settings?.cookieDuration ?? 30,
        commissionHoldDays: settings?.commissionHoldDays ?? 30,
      },
      affiliate: {
        id: contract.affiliate.id,
        referralCode: contract.affiliate.referralCode,
        creatorType: contract.affiliate.creatorType,
        tier: contract.affiliate.tier,
        referralRateBps: contract.affiliate.referralRateBps,
        completedOrders: contract.affiliate.completedOrders,
        user: contract.affiliate.user,
      },
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Yêu cầu cập nhật hợp đồng chưa hợp lệ', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const contract = await prisma.affiliateContract.findUnique({
    where: { id: parsed.data.id },
    include: { affiliate: { include: { user: true } } },
  });

  if (!contract) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy hợp đồng' }, { status: 404 });
  }
  if (contract.status === 'DRAFT') {
    return NextResponse.json(
      { success: false, error: 'KOL/KOC cần tạo bản hợp đồng trước khi SMEE duyệt' },
      { status: 409 },
    );
  }

  const updated = await prisma.affiliateContract.update({
    where: { id: contract.id },
    data: { status: 'APPROVED' },
  });

  await logAuditAction({
    actorId: auth.user.id,
    action: 'APPROVE_AFFILIATE_CONTRACT',
    objectType: 'AFFILIATE_CONTRACT',
    objectId: updated.id,
    payload: {
      contractNumber: updated.contractNumber,
      affiliateId: contract.affiliateId,
      affiliateEmail: contract.affiliate.user.email,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Đã duyệt hợp đồng KOL/KOC',
    contract: updated,
  });
}
