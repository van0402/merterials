import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

const RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;

function passwordResetOtpKey(email: string) {
  return `${email.toLowerCase()}::password_reset`;
}

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function passwordResetEmailTemplate(code: string, userName: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mã đặt lại mật khẩu</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; background: #f8fafc; padding: 24px;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 16px; color: #111827;">Mã đặt lại mật khẩu</h2>
          <p>Xin chào ${userName || 'bạn'},</p>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu. Nhập mã dưới đây để xác nhận:</p>
          <div style="margin: 28px 0; padding: 20px; text-align: center; background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 10px;">
            <div style="font-size: 34px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</div>
            <div style="margin-top: 8px; color: #6b7280; font-size: 14px;">Mã có hiệu lực trong 10 phút</div>
          </div>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 6px;">
            <strong>Lưu ý bảo mật:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
          </div>
          <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">${process.env.PLATFORM_NAME || 'SMEE'} Team</p>
        </div>
      </body>
    </html>
  `;
}

function genericSuccess() {
  return NextResponse.json({
    success: true,
    message: 'Nếu email tồn tại trong hệ thống, mã OTP đặt lại mật khẩu đã được gửi.',
    cooldownSeconds: 60,
    expiresInSeconds: 600,
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rateLimit = await checkRateLimit(ip, 'auth/password-reset/request', 5, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString() } },
      );
    }

    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập email' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ success: false, error: 'Email không hợp lệ' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.status !== 'ACTIVE') return genericSuccess();

    const otpKey = passwordResetOtpKey(normalizedEmail);
    const recentOtp = await prisma.otp.findFirst({
      where: {
        email: otpKey,
        isUsed: false,
        createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recentOtp) {
      const retryAfter = Math.max(1, Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - recentOtp.createdAt.getTime())) / 1000));
      return NextResponse.json(
        { success: false, error: `Vui lòng chờ ${retryAfter}s trước khi gửi lại mã`, retryAfter },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } },
      );
    }

    await prisma.otp.updateMany({
      where: { email: otpKey, isUsed: false },
      data: { isUsed: true },
    });

    const code = generateOTP();
    await prisma.otp.create({
      data: {
        email: otpKey,
        code,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    const { Resend } = await import('resend');
    const resendClient = new Resend(process.env.RESEND_API_KEY);
    const emailResult = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: normalizedEmail,
      subject: 'Mã đặt lại mật khẩu',
      html: passwordResetEmailTemplate(code, user.name),
    });

    if (emailResult.error) {
      await prisma.otp.updateMany({ where: { email: otpKey, code, isUsed: false }, data: { isUsed: true } });
      console.error('Password reset OTP email error:', emailResult.error);
      return NextResponse.json({ success: false, error: 'Không thể gửi email OTP. Vui lòng thử lại.' }, { status: 502 });
    }

    return genericSuccess();
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ success: false, error: 'Không thể gửi mã đặt lại mật khẩu' }, { status: 500 });
  }
}
