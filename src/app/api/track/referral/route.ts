import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const integration = apiKey
      ? await prisma.integrationSettings.findFirst({ where: { publicKey: apiKey, isActive: true } })
      : null;
    if (!integration) {
      return NextResponse.json({ success: false, error: 'Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode: body.referralCode },
      include: { user: { select: { status: true } } },
    });
    if (!affiliate || affiliate.user.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Invalid referral code' }, { status: 404 });
    }

    const settings = await prisma.programSettings.findFirst();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (settings?.cookieDuration ?? 30));
    const attribution = await prisma.attribution.create({
      data: {
        key: `attr_${crypto.randomUUID()}`,
        affiliateId: affiliate.id,
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent') ?? body.userAgent,
        referer: body.referrer,
        targetUrl: body.url,
        expiresAt,
        metadata: { source: 'tracking_script', clientTimestamp: body.timestamp ?? null },
      },
    });

    return NextResponse.json({
      success: true,
      attributionKey: attribution.key,
      expiresAt: attribution.expiresAt,
    });
  } catch (error) {
    console.error('Referral tracking error:', error);
    return NextResponse.json({ success: false, error: 'Failed to track referral' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
