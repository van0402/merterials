import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processRefund } from '@/lib/refund-service';

function validSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const supplied = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(supplied, 'hex'));
  } catch {
    return false;
  }
}

async function authorized(request: NextRequest, rawBody: string) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    if (await prisma.apiKey.findFirst({ where: { keyHash, isActive: true } })) return true;
  }
  return validSignature(
    rawBody,
    request.headers.get('x-webhook-signature') ?? request.headers.get('x-refferq-signature'),
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!(await authorized(request, rawBody))) {
      return NextResponse.json({ success: false, error: 'Unauthorized webhook' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const externalId = String(body.external_id ?? body.refund_id ?? '');
    const idempotencyKey =
      request.headers.get('idempotency-key') ?? String(body.idempotency_key ?? externalId);
    if (!externalId || !idempotencyKey || !body.conversion_external_id) {
      return NextResponse.json(
        { success: false, error: 'external_id, conversion_external_id and Idempotency-Key are required' },
        { status: 400 },
      );
    }

    const result = await processRefund({
      conversionExternalId: body.conversion_external_id,
      externalId,
      idempotencyKey,
      amountCents: Number(body.amount_cents),
      reason: body.reason,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process refund';
    return NextResponse.json({ success: false, error: message }, { status: 409 });
  }
}
