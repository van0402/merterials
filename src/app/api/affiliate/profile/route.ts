import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAffiliate } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { currencySymbolFor } from '@/lib/money';

const optionalUrl = z.union([z.string().trim().url(), z.literal('')]);
const referralCodeSchema = z.string().trim().min(4).max(10).regex(/^[a-zA-Z0-9-]+$/);

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  referralCode: referralCodeSchema.optional(),
  username: z.union([z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/), z.literal('')]).optional(),
  phone: z.union([z.string().trim().min(8).max(20).regex(/^[0-9+() .-]+$/), z.literal('')]).optional(),
  email: z.string().email().optional(),
  company: z.string().trim().max(160).optional(),
  country: z.string().trim().max(80).optional(),
  paymentMethod: z.string().trim().max(80).optional(),
  paymentEmail: z.union([z.string().email(), z.literal('')]).optional(),
  bankName: z.string().trim().max(200).optional(),
  bankAccountNumber: z.union([z.string().trim().regex(/^\d{5,30}$/), z.literal('')]).optional(),
  bankAccountHolder: z.string().trim().max(150).optional(),
  bankBranch: z.string().trim().max(200).optional(),
  bankProvince: z.string().trim().max(120).optional(),
  profilePicture: z.union([z.string().url(), z.literal('')]).optional(),
  facebookUrl: optionalUrl.optional(),
  tiktokUrl: optionalUrl.optional(),
  threadsUrl: optionalUrl.optional(),
  youtubeUrl: optionalUrl.optional(),
  adsSupportRequested: z.boolean().optional(),
});

function jsonObject(value: Prisma.JsonValue): Record<string, Prisma.JsonValue> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, Prisma.JsonValue>
    : {};
}

export async function GET(request: NextRequest) {
  const auth = await requireAffiliate(request);
  if ('response' in auth) return auth.response;
  const affiliate = await prisma.affiliate.findUnique({
    where: { userId: auth.user.id },
    include: { user: true, sellerProfile: { include: { products: true } } },
  });
  if (!affiliate) {
    return NextResponse.json({ success: false, error: 'KOL/KOC profile not found' }, { status: 404 });
  }

  const [referrals, conversions, commissions, totalClicks, programSettings] = await Promise.all([
    prisma.referral.findMany({ where: { affiliateId: affiliate.id }, orderBy: { createdAt: 'desc' } }),
    prisma.conversion.findMany({
      where: {
        OR: [
          { affiliateId: affiliate.id },
          { commissions: { some: { affiliateId: affiliate.id } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.commission.findMany({ where: { affiliateId: affiliate.id }, orderBy: { createdAt: 'desc' } }),
    prisma.attribution.count({ where: { affiliateId: affiliate.id } }),
    prisma.programSettings.findFirst({ select: { currency: true, minPayoutCents: true, minimumPayoutThreshold: true } }),
  ]);
  const currency = programSettings?.currency ?? 'VND';

  const pending = commissions.filter((commission) => commission.status === 'PENDING');
  const nextMaturesAt = pending
    .map((commission) => commission.maturesAt)
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  const totalConversions = conversions.filter((conversion) => conversion.status !== 'REJECTED').length;

  return NextResponse.json({
    success: true,
    user: {
      id: affiliate.user.id,
      name: affiliate.user.name,
      email: affiliate.user.email,
      username: affiliate.user.username,
      phone: affiliate.user.phone,
      role: affiliate.user.role,
      profilePicture: affiliate.user.profilePicture,
    },
    affiliate,
    currency,
    currencySymbol: currencySymbolFor(currency),
    minPayoutCents: programSettings?.minPayoutCents ?? programSettings?.minimumPayoutThreshold ?? 0,
    seller: affiliate.sellerProfile,
    benefits: {
      tier: affiliate.tier,
      referralRatePercent: affiliate.referralRateBps / 100,
      canRequestAdsSupport: affiliate.tier !== 'STANDARD',
      personalCare: affiliate.personalCareEnabled,
      mediaSupport: affiliate.mediaSupportEnabled,
    },
    stats: {
      availableEarnings: affiliate.balanceCents,
      pendingEarnings: pending.reduce((sum, commission) => sum + commission.amountCents, 0),
      totalCommissions: commissions.length,
      totalConversions,
      totalClicks,
      conversionRate: totalClicks ? (totalConversions / totalClicks) * 100 : 0,
      completedOrders: affiliate.completedOrders,
      nextMaturesAt,
    },
    referrals: referrals.map((referral) => {
      const metadata = jsonObject(referral.metadata);
      return {
        ...referral,
        estimatedValue: Number(metadata.estimated_value ?? 0),
        company: String(metadata.company ?? ''),
      };
    }),
    conversions,
    commissions,
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAffiliate(request);
  if ('response' in auth) return auth.response;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid profile', details: parsed.error.issues }, { status: 400 });
  }

  const affiliate = await prisma.affiliate.findUnique({ where: { userId: auth.user.id } });
  if (!affiliate) {
    return NextResponse.json({ success: false, error: 'KOL/KOC profile not found' }, { status: 404 });
  }
  if (parsed.data.adsSupportRequested && affiliate.tier === 'STANDARD') {
    return NextResponse.json({ success: false, error: 'Ads support is available from VIP tier' }, { status: 403 });
  }

  const nextEmail = parsed.data.email?.toLowerCase();
  const nextUsername = parsed.data.username !== undefined
    ? (parsed.data.username ? parsed.data.username.toLowerCase() : null)
    : undefined;
  const nextPhone = parsed.data.phone !== undefined
    ? (parsed.data.phone || null)
    : undefined;
  const nextReferralCode = parsed.data.referralCode !== undefined
    ? parsed.data.referralCode.trim().toUpperCase()
    : undefined;

  if (nextReferralCode) {
    const referralCodeConflict = await prisma.affiliate.findFirst({
      where: {
        id: { not: affiliate.id },
        referralCode: nextReferralCode,
      },
      select: { id: true },
    });
    if (referralCodeConflict) {
      return NextResponse.json({ success: false, error: 'Mã giới thiệu này đã được sử dụng bởi tài khoản khác' }, { status: 409 });
    }
  }

  const uniqueConflictFilters: Prisma.UserWhereInput[] = [
    ...(nextEmail ? [{ email: nextEmail }] : []),
    ...(nextUsername ? [{ username: nextUsername }] : []),
    ...(nextPhone ? [{ phone: nextPhone }] : []),
  ];
  const uniqueConflicts = uniqueConflictFilters.length > 0
    ? await prisma.user.findFirst({
        where: {
          id: { not: auth.user.id },
          OR: uniqueConflictFilters,
        },
        select: { email: true, username: true, phone: true },
      })
    : null;

  if (uniqueConflicts) {
    if (nextPhone && uniqueConflicts.phone === nextPhone) {
      return NextResponse.json({ success: false, error: 'Số điện thoại này đã được sử dụng bởi tài khoản khác' }, { status: 409 });
    }
    if (nextEmail && uniqueConflicts.email === nextEmail) {
      return NextResponse.json({ success: false, error: 'Email này đã được sử dụng bởi tài khoản khác' }, { status: 409 });
    }
    if (nextUsername && uniqueConflicts.username === nextUsername) {
      return NextResponse.json({ success: false, error: 'Username này đã được sử dụng bởi tài khoản khác' }, { status: 409 });
    }
  }

  const payoutDetails = jsonObject(affiliate.payoutDetails);
  const socialLinks = jsonObject(payoutDetails.socialLinks as Prisma.JsonValue);
  const nextPayoutDetails = {
    ...payoutDetails,
    ...(parsed.data.company !== undefined ? { company: parsed.data.company } : {}),
    ...(parsed.data.country !== undefined ? { country: parsed.data.country } : {}),
    ...(parsed.data.paymentMethod !== undefined
      ? { paymentMethod: parsed.data.paymentMethod, method: parsed.data.paymentMethod }
      : {}),
    ...(parsed.data.paymentEmail !== undefined
      ? { paymentEmail: parsed.data.paymentEmail, email: parsed.data.paymentEmail }
      : {}),
    ...(parsed.data.bankName !== undefined ? { bankName: parsed.data.bankName } : {}),
    ...(parsed.data.bankAccountNumber !== undefined
      ? {
          bankAccountNumber: parsed.data.bankAccountNumber,
          accountNumber: parsed.data.bankAccountNumber,
        }
      : {}),
    ...(parsed.data.bankAccountHolder !== undefined ? { bankAccountHolder: parsed.data.bankAccountHolder } : {}),
    ...(parsed.data.bankBranch !== undefined ? { bankBranch: parsed.data.bankBranch } : {}),
    ...(parsed.data.bankProvince !== undefined ? { bankProvince: parsed.data.bankProvince } : {}),
    socialLinks: {
      ...socialLinks,
      ...(parsed.data.facebookUrl !== undefined ? { facebookUrl: parsed.data.facebookUrl } : {}),
      ...(parsed.data.tiktokUrl !== undefined ? { tiktokUrl: parsed.data.tiktokUrl } : {}),
      ...(parsed.data.threadsUrl !== undefined ? { threadsUrl: parsed.data.threadsUrl } : {}),
      ...(parsed.data.youtubeUrl !== undefined ? { youtubeUrl: parsed.data.youtubeUrl } : {}),
    },
  };
  try {
    const [user, updatedAffiliate] = await prisma.$transaction([
    prisma.user.update({
      where: { id: auth.user.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(nextUsername !== undefined ? { username: nextUsername } : {}),
        ...(nextPhone !== undefined ? { phone: nextPhone } : {}),
        ...(nextEmail !== undefined ? { email: nextEmail } : {}),
        ...(parsed.data.profilePicture !== undefined ? { profilePicture: parsed.data.profilePicture || null } : {}),
      },
    }),
    prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        ...(nextReferralCode !== undefined ? { referralCode: nextReferralCode } : {}),
        adsSupportRequested: parsed.data.adsSupportRequested,
        payoutDetails: nextPayoutDetails,
      },
    }),
    ]);

    return NextResponse.json({ success: true, user, affiliate: updatedAffiliate });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta?.target.join(', ') : String(error.meta?.target || 'field');
      return NextResponse.json({ success: false, error: `Thông tin đã được sử dụng: ${target}` }, { status: 409 });
    }
    throw error;
  }
}
