import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { processRefund } from '@/lib/refund-service';

const refundSchema = z.object({
  conversionExternalId: z.string().min(1),
  externalId: z.string().min(1),
  amountCents: z.number().int().positive(),
  reason: z.string().trim().max(1000).optional(),
  idempotencyKey: z.string().min(8).max(200).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const parsed = refundSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid refund', details: parsed.error.issues }, { status: 400 });
  }
  const idempotencyKey = request.headers.get('idempotency-key') ?? parsed.data.idempotencyKey;
  if (!idempotencyKey) {
    return NextResponse.json({ success: false, error: 'Idempotency-Key is required' }, { status: 400 });
  }

  try {
    const result = await processRefund({ ...parsed.data, idempotencyKey, actorId: auth.user.id });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process refund';
    return NextResponse.json({ success: false, error: message }, { status: 409 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const refunds = await prisma.refund.findMany({
    include: { conversion: { include: { commissions: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ success: true, refunds });
}
