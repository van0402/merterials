import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAffiliate } from '@/lib/api-auth';
import { formatMinorUnits } from '@/lib/money';
import { createPayoutRequestNotifications } from '@/lib/notification-service';

function requestedAmountFromBody(body: unknown) {
  if (!body || typeof body !== 'object') return null;
  const value = (body as { amountCents?: unknown }).amountCents;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) return Number(value);
  return null;
}

function payoutDetailsObject(payoutDetails: unknown): Record<string, unknown> {
  return payoutDetails && typeof payoutDetails === 'object' && !Array.isArray(payoutDetails)
    ? payoutDetails as Record<string, unknown>
    : {};
}

function stringField(details: Record<string, unknown>, key: string) {
  const value = details[key];
  return typeof value === 'string' ? value.trim() : '';
}

function getPayoutMethod(payoutDetails: unknown) {
  const details = payoutDetailsObject(payoutDetails);
  return stringField(details, 'paymentMethod') || stringField(details, 'method') || 'BANK_TRANSFER_VN';
}

function getPaymentInfo(payoutDetails: unknown) {
  const details = payoutDetailsObject(payoutDetails);
  const method = getPayoutMethod(details);
  return {
    method,
    paymentEmail: stringField(details, 'paymentEmail') || stringField(details, 'email'),
    bankName: stringField(details, 'bankName'),
    bankAccountNumber: stringField(details, 'bankAccountNumber') || stringField(details, 'accountNumber'),
    bankAccountHolder: stringField(details, 'bankAccountHolder'),
    bankBranch: stringField(details, 'bankBranch'),
    bankProvince: stringField(details, 'bankProvince'),
  };
}

function validatePaymentInfo(paymentInfo: ReturnType<typeof getPaymentInfo>) {
  const method = paymentInfo.method.toUpperCase();
  const missing: string[] = [];
  const requireBankDetails = method.includes('BANK') || method.includes('WIRE');
  const requirePaymentEmail = ['PAYPAL', 'STRIPE', 'WISE'].some((item) => method.includes(item));

  if (!paymentInfo.method) missing.push('Phương thức nhận tiền');
  if (requireBankDetails) {
    if (!paymentInfo.bankName) missing.push('Tên ngân hàng');
    if (!paymentInfo.bankAccountNumber) missing.push('Số tài khoản');
    if (!paymentInfo.bankAccountHolder) missing.push('Chủ tài khoản');
  }
  if (requirePaymentEmail && !paymentInfo.paymentEmail) missing.push('Email nhận tiền');

  return missing;
}

function formatPaymentInfo(paymentInfo: ReturnType<typeof getPaymentInfo>) {
  const parts = [
    `Phương thức: ${paymentInfo.method}`,
    paymentInfo.paymentEmail ? `Email nhận tiền: ${paymentInfo.paymentEmail}` : null,
    paymentInfo.bankName ? `Ngân hàng: ${paymentInfo.bankName}` : null,
    paymentInfo.bankAccountNumber ? `Số tài khoản: ${paymentInfo.bankAccountNumber}` : null,
    paymentInfo.bankAccountHolder ? `Chủ tài khoản: ${paymentInfo.bankAccountHolder}` : null,
    paymentInfo.bankBranch ? `Chi nhánh: ${paymentInfo.bankBranch}` : null,
    paymentInfo.bankProvince ? `Tỉnh/TP: ${paymentInfo.bankProvince}` : null,
  ].filter(Boolean);
  return parts.join(' | ');
}

export async function GET(request: NextRequest) {
  try {
    const affiliateAuth = await requireAffiliate(request);
    if ('response' in affiliateAuth) return affiliateAuth.response;
    const userId = affiliateAuth.user.id;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        affiliate: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'AFFILIATE') {
      return NextResponse.json(
        { error: 'Access denied. Affiliate role required.' },
        { status: 403 }
      );
    }

    if (!user.affiliate) {
      return NextResponse.json(
        { error: 'Affiliate profile not found' },
        { status: 404 }
      );
    }

    // Get payouts for this affiliate
    const payouts = await prisma.payout.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        commissions: true
      }
    });

    return NextResponse.json({
      success: true,
      payouts: payouts.map(p => ({
        id: p.id,
        amount: p.amountCents,
        status: p.status,
        method: p.method,
        createdAt: p.createdAt.toISOString(),
        paidAt: p.processedAt?.toISOString() || null
      }))
    });
  } catch (error) {
    console.error('Affiliate payouts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const affiliateAuth = await requireAffiliate(request);
    if ('response' in affiliateAuth) return affiliateAuth.response;

    const body = await request.json().catch(() => null);
    const requestedAmountCents = requestedAmountFromBody(body);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: affiliateAuth.user.id },
        include: { affiliate: true },
      });
      if (!user || user.role !== 'AFFILIATE' || !user.affiliate) {
        throw new Error('Affiliate profile not found');
      }

      const existingPending = await tx.payout.findFirst({
        where: {
          affiliateId: user.affiliate.id,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      });
      if (existingPending) {
        throw new Error('Bạn đã có một yêu cầu rút tiền đang chờ xử lý');
      }

      const settings = await tx.programSettings.findFirst({
        select: { minPayoutCents: true, minimumPayoutThreshold: true },
      });
      const minPayoutCents = settings?.minPayoutCents ?? settings?.minimumPayoutThreshold ?? 0;
      const availableBalance = user.affiliate.balanceCents;
      if (availableBalance <= 0) throw new Error('Số dư hiện tại chưa có tiền để rút');

      const amountCents = requestedAmountCents ?? availableBalance;
      if (!Number.isInteger(amountCents) || amountCents <= 0) {
        throw new Error('Số tiền rút không hợp lệ');
      }
      if (amountCents < minPayoutCents) {
        throw new Error('Số dư chưa đủ điều kiện rút tiền');
      }
      if (amountCents > availableBalance) {
        throw new Error('Số tiền rút vượt quá số dư khả dụng');
      }

      const paymentInfo = getPaymentInfo(user.affiliate.payoutDetails);
      const missingPaymentFields = validatePaymentInfo(paymentInfo);
      if (missingPaymentFields.length > 0) {
        const error = new Error(`Vui lòng bổ sung thông tin thanh toán trong Cài đặt trước khi yêu cầu rút tiền: ${missingPaymentFields.join(', ')}`);
        (error as Error & { code?: string; missingPaymentFields?: string[] }).code = 'PAYMENT_INFO_REQUIRED';
        (error as Error & { code?: string; missingPaymentFields?: string[] }).missingPaymentFields = missingPaymentFields;
        throw error;
      }

      const balanceUpdate = await tx.affiliate.updateMany({
        where: { id: user.affiliate.id, balanceCents: { gte: amountCents } },
        data: { balanceCents: { decrement: amountCents } },
      });
      if (balanceUpdate.count !== 1) throw new Error('Số dư không đủ hoặc đã thay đổi, vui lòng thử lại');

      const payout = await tx.payout.create({
        data: {
          affiliateId: user.affiliate.id,
          userId: user.id,
          amountCents,
          commissionCount: 0,
          method: paymentInfo.method,
          notes: JSON.stringify({
            type: 'affiliate_payout_request',
            label: 'KOC requested payout from affiliate portal',
            requestedAmountCents: amountCents,
            paymentInfo,
            paymentSummary: formatPaymentInfo(paymentInfo),
          }),
          createdBy: user.id,
          idempotencyKey: `affiliate-${user.affiliate.id}-${Date.now()}`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'REQUEST_PAYOUT',
          objectType: 'PAYOUT',
          objectId: payout.id,
          payload: { amountCents, minPayoutCents },
        },
      });

      return {
        payout,
        requesterName: user.name,
        requesterEmail: user.email,
        amountCents,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    try {
      await createPayoutRequestNotifications({
        payoutId: result.payout.id,
        requesterName: result.requesterName,
        requesterEmail: result.requesterEmail,
        amountLabel: formatMinorUnits(result.amountCents, 'VND'),
      });
    } catch (notificationError) {
      console.error('Payout request notification error:', notificationError);
    }

    return NextResponse.json({ success: true, payout: result.payout }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể tạo yêu cầu rút tiền';
    const typedError = error as Error & { code?: string; missingPaymentFields?: string[] };
    const status = typedError.code === 'PAYMENT_INFO_REQUIRED'
      || message.includes('chưa đủ')
      || message.includes('chưa có')
      || message.includes('đang chờ')
      || message.includes('không hợp lệ')
      || message.includes('vượt quá')
      ? 409
      : 500;
    return NextResponse.json({
      success: false,
      error: message,
      code: typedError.code,
      missingPaymentFields: typedError.missingPaymentFields,
      settingsUrl: typedError.code === 'PAYMENT_INFO_REQUIRED' ? '/affiliate/settings' : undefined,
    }, { status });
  }
}
