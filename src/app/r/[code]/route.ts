import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const SMEE_REFERRAL_TARGET_URL = 'https://smee.vn';
const ATTRIBUTION_DEDUPE_MINUTES = 30;
const MAX_UNIQUE_ATTRIBUTIONS_PER_IP_AFFILIATE_DAY = 8;

function buildSmeeTargetUrl(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUrl = new URL(SMEE_REFERRAL_TARGET_URL);

  // Keep marketing/source params, but never allow the referral link to redirect
  // away from smee.vn via target/dest/ref/attr injection.
  searchParams.forEach((value, key) => {
    if (!['ref', 'attr', 'dest', 'target'].includes(key)) {
      redirectUrl.searchParams.set(key, value);
    }
  });

  return redirectUrl;
}

function metadataObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const redirectUrl = buildSmeeTargetUrl(request);

  try {
    const { code } = await params;
    const referralCode = code;
    const searchParams = request.nextUrl.searchParams;

    // Find affiliate by referral code using Prisma
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode },
      include: { user: true }
    });

    if (!affiliate || affiliate.user.status !== 'ACTIVE') {
      // Invalid/inactive referral code still goes to SMEE, but without attribution.
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const cleanIP = clientIP.split(',')[0].trim();
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || null;

    const settings = await prisma.programSettings.findFirst();
    const cookieDurationDays = settings?.cookieDuration ?? 30;
    const attributionExpiry = new Date();
    attributionExpiry.setDate(attributionExpiry.getDate() + cookieDurationDays);

    const dedupeSince = new Date(Date.now() - ATTRIBUTION_DEDUPE_MINUTES * 60 * 1000);
    const existingRecentAttribution = await prisma.attribution.findFirst({
      where: {
        affiliateId: affiliate.id,
        ipAddress: cleanIP,
        userAgent,
        expiresAt: { gt: new Date() },
        createdAt: { gte: dedupeSince },
      },
      orderBy: { createdAt: 'desc' },
    });

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAttributionCount = await prisma.attribution.count({
      where: {
        affiliateId: affiliate.id,
        ipAddress: cleanIP,
        createdAt: { gte: dayAgo },
      },
    });
    const isSpammyClick = recentAttributionCount >= MAX_UNIQUE_ATTRIBUTIONS_PER_IP_AFFILIATE_DAY;

    let attribution = existingRecentAttribution;
    if (!attribution) {
      attribution = await prisma.attribution.create({
        data: {
          key: `attr_${crypto.randomUUID()}`,
          affiliateId: affiliate.id,
          ipAddress: cleanIP,
          userAgent,
          referer,
          targetUrl: SMEE_REFERRAL_TARGET_URL,
          expiresAt: attributionExpiry,
          metadata: {
            source: 'smee_referral_redirect',
            parameters: Object.fromEntries(searchParams.entries()),
            spam_check: {
              is_duplicate: false,
              is_spammy: isSpammyClick,
              attribution_count_24h: recentAttributionCount,
              max_unique_attributions_per_day: MAX_UNIQUE_ATTRIBUTIONS_PER_IP_AFFILIATE_DAY,
            },
          },
        },
      });
    } else {
      const metadata = metadataObject(attribution.metadata);
      attribution = await prisma.attribution.update({
        where: { id: attribution.id },
        data: {
          metadata: {
            ...metadata,
            last_duplicate_click_at: new Date().toISOString(),
            duplicate_click_count: Number(metadata.duplicate_click_count ?? 0) + 1,
            spam_check: {
              ...(metadataObject(metadata.spam_check)),
              is_duplicate: true,
              is_spammy: isSpammyClick,
              attribution_count_24h: recentAttributionCount,
              dedupe_minutes: ATTRIBUTION_DEDUPE_MINUTES,
            },
          },
        },
      });
    }

    redirectUrl.searchParams.set('ref', referralCode);
    redirectUrl.searchParams.set('attr', attribution.key);

    const response = NextResponse.redirect(redirectUrl.toString());

    response.cookies.set('affiliate_attribution', JSON.stringify({
      referral_code: referralCode,
      attribution_key: attribution.key,
      affiliate_id: affiliate.id,
      timestamp: new Date().toISOString(),
    }), {
      expires: attributionExpiry,
      httpOnly: false, // Allow smee.vn/client-side code to forward attribution into lead/conversion forms.
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Referral tracking error:', error);

    // Fallback redirect on error: always go to SMEE.
    return NextResponse.redirect(redirectUrl.toString());
  }
}
