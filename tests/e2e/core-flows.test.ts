import assert from 'node:assert/strict';
import test from 'node:test';

const baseUrl = process.env.TEST_BASE_URL;
const adminCookie = process.env.TEST_ADMIN_COOKIE;
const run = Boolean(baseUrl && adminCookie);

function headers(extra: Record<string, string> = {}) {
  return { Cookie: adminCookie ?? '', 'Content-Type': 'application/json', ...extra };
}

test('auth cookie reaches /api/auth/me through middleware', { skip: !run }, async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`, { headers: headers() });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.user.id);
});

test('payout retry returns the same payout', { skip: !run || !process.env.TEST_AFFILIATE_ID || !process.env.TEST_COMMISSION_ID }, async () => {
  const key = `e2e-payout-${Date.now()}`;
  const payload = JSON.stringify({
    affiliateId: process.env.TEST_AFFILIATE_ID,
    commissionIds: [process.env.TEST_COMMISSION_ID],
  });
  const first = await fetch(`${baseUrl}/api/admin/payouts`, {
    method: 'POST',
    headers: headers({ 'Idempotency-Key': key }),
    body: payload,
  });
  assert.equal(first.status, 201);
  const firstBody = await first.json();
  const retry = await fetch(`${baseUrl}/api/admin/payouts`, {
    method: 'POST',
    headers: headers({ 'Idempotency-Key': key }),
    body: payload,
  });
  const retryBody = await retry.json();
  assert.equal(retry.status, 200);
  assert.equal(retryBody.payout.id, firstBody.payout.id);
});

test('refund webhook retry is idempotent', { skip: !run || !process.env.TEST_WEBHOOK_SECRET || !process.env.TEST_CONVERSION_EXTERNAL_ID }, async () => {
  const crypto = await import('node:crypto');
  const externalId = `e2e-refund-${Date.now()}`;
  const payload = JSON.stringify({
    external_id: externalId,
    conversion_external_id: process.env.TEST_CONVERSION_EXTERNAL_ID,
    amount_cents: Number(process.env.TEST_CONVERSION_AMOUNT_CENTS),
  });
  const signature = crypto
    .createHmac('sha256', process.env.TEST_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
  const request = () => fetch(`${baseUrl}/api/webhook/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': externalId,
      'X-Webhook-Signature': signature,
    },
    body: payload,
  });
  assert.equal((await request()).status, 200);
  const retryBody = await (await request()).json();
  assert.equal(retryBody.duplicate, true);
});

test('commission maturation retry does not credit twice', { skip: !run || !process.env.TEST_CRON_SECRET }, async () => {
  const key = `e2e-mature-${Date.now()}`;
  const request = () => fetch(`${baseUrl}/api/admin/commissions/mature`, {
    method: 'POST',
    headers: {
      'X-Cron-Secret': process.env.TEST_CRON_SECRET!,
      'Idempotency-Key': key,
    },
  });
  assert.equal((await request()).status, 200);
  const retryBody = await (await request()).json();
  assert.equal(retryBody.duplicate, true);
});

test('conversion webhook retry returns one conversion', { skip: !run || !process.env.TEST_WEBHOOK_SECRET }, async () => {
  const crypto = await import('node:crypto');
  const externalId = `e2e-conversion-${Date.now()}`;
  const payload = JSON.stringify({
    external_id: externalId,
    event_type: 'PURCHASE',
    amount_cents: 1_000_000,
    currency: 'VND',
    customer_email: `buyer-${Date.now()}@example.com`,
    referral_code: process.env.TEST_REFERRAL_CODE ?? 'SMEE-KOC',
  });
  const signature = crypto
    .createHmac('sha256', process.env.TEST_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
  const request = () => fetch(`${baseUrl}/api/webhook/conversion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': externalId,
      'X-Webhook-Signature': signature,
    },
    body: payload,
  });
  assert.equal((await request()).status, 201);
  const retryBody = await (await request()).json();
  assert.equal(retryBody.duplicate, true);
});

