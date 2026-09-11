import { NextRequest, NextResponse } from 'next/server';
import { processConversion } from '@/lib/conversion-service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key is required' }, { status: 401 });
    }

    const integration = await prisma.integrationSettings.findFirst({
      where: { publicKey: apiKey, isActive: true },
    });
    if (!integration) {
      return NextResponse.json({ success: false, error: 'Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const externalId = String(body.externalId ?? body.orderId ?? '');
    const idempotencyKey =
      request.headers.get('idempotency-key') ?? String(body.idempotencyKey ?? externalId);
    const amountCents = Number.isInteger(body.amountCents)
      ? body.amountCents
      : Math.round(Number(body.amount ?? 0) * 100);

    const result = await processConversion({
      externalId,
      idempotencyKey,
      amountCents,
      currency: body.currency,
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      referralCode: body.referralCode,
      attributionKey: body.attributionKey,
      sellerSku: body.sellerSku,
      metadata: body.metadata ?? {},
    });

    return NextResponse.json(
      { success: true, duplicate: result.duplicate, conversion: result.conversion },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to track conversion';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Idempotency-Key',
    },
  });
}
