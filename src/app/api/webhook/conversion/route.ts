import crypto from 'crypto';
import { ConversionType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { processConversion } from '@/lib/conversion-service';
import { prisma } from '@/lib/prisma';

function verifyWebhookSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const supplied = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  try {
    return crypto.timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

async function isAuthorized(request: NextRequest, rawBody: string): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const key = await prisma.apiKey.findFirst({
      where: { keyHash, isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    });
    if (key) return true;
  }

  const secret = process.env.WEBHOOK_SECRET;
  const signature =
    request.headers.get('x-webhook-signature') ?? request.headers.get('x-refferq-signature');
  return Boolean(secret && verifyWebhookSignature(rawBody, signature, secret));
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!(await isAuthorized(request, rawBody))) {
      return NextResponse.json({ success: false, error: 'Unauthorized webhook' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const externalId = String(body.external_id ?? body.order_id ?? '');
    const idempotencyKey =
      request.headers.get('idempotency-key') ?? String(body.idempotency_key ?? externalId);

    const result = await processConversion({
      externalId,
      idempotencyKey,
      eventType: (body.event_type ?? 'PURCHASE') as ConversionType,
      amountCents: Number(body.amount_cents),
      currency: body.currency,
      customerEmail: body.customer_email,
      customerName: body.customer_name,
      referralCode: body.referral_code,
      attributionKey: body.attribution_key,
      sellerSku: body.seller_sku,
      metadata: body.event_metadata ?? {},
    });

    return NextResponse.json(
      {
        success: true,
        duplicate: result.duplicate,
        conversion: result.conversion,
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process conversion';
    const status = message.includes('required') || message.includes('positive') ? 400 : 500;
    console.error('Conversion webhook error:', error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
