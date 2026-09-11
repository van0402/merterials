import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAffiliate } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { AUTH_COOKIE_NAME, getClearAuthCookieOptions } from '@/lib/auth-cookie';

function passwordChangeOtpKey(email: string, userId: string) {
  return `${email.toLowerCase()}::password_change::${userId}`;
}

function validateNewPassword(password: unknown, confirmPassword: unknown) {
  if (!password || typeof password !== 'string') return 'Vui lòng nhập mật khẩu mới';
  if (password.length < 8) return 'Mật khẩu mới phải có ít nhất 8 ký tự';
  if (password.length > 128) return 'Mật khẩu mới quá dài';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Mật khẩu mới cần có cả chữ và số';
  if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAffiliate(request);
    if ('response' in auth) return auth.response;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rateLimit = await checkRateLimit(`${auth.user.id}:${ip}`, 'affiliate/password-change/confirm', 8, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Bạn nhập mã quá nhiều lần. Vui lòng thử lại sau.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString() } },
      );
    }

    const { currentPassword, newPassword, confirmPassword, otpCode } = await request.json();
    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập mật khẩu hiện tại' }, { status: 400 });
    }
    if (!otpCode || typeof otpCode !== 'string') {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập mã OTP' }, { status: 400 });
    }

    const passwordError = validateNewPassword(newPassword, confirmPassword);
    if (passwordError) {
      return NextResponse.json({ success: false, error: passwordError }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    const currentPasswordOk = await bcrypt.compare(currentPassword, user.password);
    if (!currentPasswordOk) {
      return NextResponse.json({ success: false, error: 'Mật khẩu hiện tại không đúng' }, { status: 400 });
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
      return NextResponse.json({ success: false, error: 'Mật khẩu mới không được trùng mật khẩu hiện tại' }, { status: 400 });
    }

    const otpKey = passwordChangeOtpKey(user.email, user.id);
    const otp = await prisma.otp.findFirst({
      where: {
        email: otpKey,
        code: otpCode.trim(),
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      await prisma.otp.updateMany({
        where: { email: otpKey, isUsed: false },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ success: false, error: 'Mã OTP không đúng hoặc đã hết hạn' }, { status: 400 });
    }

    if (otp.attempts >= 3) {
      await prisma.otp.update({ where: { id: otp.id }, data: { isUsed: true } });
      return NextResponse.json({ success: false, error: 'Bạn nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.otp.updateMany({
        where: { email: otpKey, isUsed: false },
        data: { isUsed: true },
      }),
    ]);

    const response = NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
      requireLogin: true,
    });
    response.cookies.set(AUTH_COOKIE_NAME, '', getClearAuthCookieOptions());
    return response;
  } catch (error) {
    console.error('Password change confirm error:', error);
    return NextResponse.json({ success: false, error: 'Không thể đổi mật khẩu' }, { status: 500 });
  }
}
