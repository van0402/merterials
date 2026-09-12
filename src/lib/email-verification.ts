import Redis from 'ioredis';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';

const CODE_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;

const CODE_KEY_PREFIX = 'email-verify:code:';
const COOLDOWN_KEY_PREFIX = 'email-verify:cooldown:';

type StoredEmailVerificationCode = {
  email: string;
  codeHash: string;
  attempts: number;
  createdAt: string;
};

let redisClient: Redis | null = null;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redisClient.on('error', (error) => {
      console.error('Redis email verification error:', error.message);
    });
  }

  return redisClient;
}

async function ensureRedisConnected(redis: Redis) {
  if (redis.status === 'wait') {
    await redis.connect();
  }
}

function codeKey(email: string) {
  return `${CODE_KEY_PREFIX}${email}`;
}

function cooldownKey(email: string) {
  return `${COOLDOWN_KEY_PREFIX}${email}`;
}

function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function sendEmailVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return { success: false, message: 'Không tìm thấy tài khoản với email này.' };
  }

  if (user.emailVerifiedAt) {
    return { success: true, message: 'Email này đã được xác thực.' };
  }

  const redis = getRedis();
  await ensureRedisConnected(redis);

  const hasCooldown = await redis.get(cooldownKey(normalizedEmail));
  if (hasCooldown) {
    return { success: false, message: 'Vui lòng chờ 60 giây trước khi gửi lại mã.' };
  }

  const code = generateCode();
  const payload: StoredEmailVerificationCode = {
    email: normalizedEmail,
    codeHash: await bcrypt.hash(code, 10),
    attempts: 0,
    createdAt: new Date().toISOString(),
  };

  await redis
    .multi()
    .set(codeKey(normalizedEmail), JSON.stringify(payload), 'EX', CODE_TTL_SECONDS)
    .set(cooldownKey(normalizedEmail), '1', 'EX', RESEND_COOLDOWN_SECONDS)
    .exec();

  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Email verification code for ${normalizedEmail}: ${code}`);
    return { success: true, message: 'Dev mode: mã xác thực đã được ghi vào server logs.' };
  }

  const emailResult = await emailService.sendEmailVerificationCode({
    email: normalizedEmail,
    name: user.name,
    code,
    expiresInMinutes: Math.floor(CODE_TTL_SECONDS / 60),
  });

  if (!emailResult.success) {
    await redis.del(codeKey(normalizedEmail), cooldownKey(normalizedEmail));
    return { success: false, message: 'Không gửi được email xác thực. Vui lòng thử lại.' };
  }

  return { success: true, message: 'Đã gửi mã xác thực tới email của bạn.' };
}

export async function verifyEmailCode(email: string, code: string): Promise<{ success: boolean; message: string; user?: any }> {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = String(code).trim();

  if (!/^\d{6}$/.test(normalizedCode)) {
    return { success: false, message: 'Mã xác thực phải gồm 6 chữ số.' };
  }

  const redis = getRedis();
  await ensureRedisConnected(redis);

  const rawPayload = await redis.get(codeKey(normalizedEmail));
  if (!rawPayload) {
    return { success: false, message: 'Mã xác thực đã hết hạn hoặc không tồn tại.' };
  }

  const payload = JSON.parse(rawPayload) as StoredEmailVerificationCode;

  if (payload.attempts >= MAX_VERIFY_ATTEMPTS) {
    await redis.del(codeKey(normalizedEmail));
    return { success: false, message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.' };
  }

  const isValid = await bcrypt.compare(normalizedCode, payload.codeHash);
  if (!isValid) {
    payload.attempts += 1;
    const ttl = await redis.ttl(codeKey(normalizedEmail));
    if (ttl > 0) {
      await redis.set(codeKey(normalizedEmail), JSON.stringify(payload), 'EX', ttl);
    }
    return { success: false, message: 'Mã xác thực không đúng.' };
  }

  const user = await prisma.user.update({
    where: { email: normalizedEmail },
    data: { emailVerifiedAt: new Date() },
  });

  await redis.del(codeKey(normalizedEmail), cooldownKey(normalizedEmail));

  return { success: true, message: 'Xác thực email thành công.', user };
}
