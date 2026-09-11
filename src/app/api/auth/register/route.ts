import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { parseAuthIdentifier, normalizePhone } from '@/lib/auth-identifier';
import { vi } from '@/lib/i18n/vi';
import { sendEmailVerificationCode } from '@/lib/email-verification';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 registration attempts per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rateLimit = await checkRateLimit(ip, 'auth/register', 3, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many registration attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString() } }
      );
    }

    const body = await request.json();
    const emailIdentifier = parseAuthIdentifier(body.email ?? body.identifier);
    const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const phone = rawPhone ? normalizePhone(rawPhone) : undefined;
    const { name, password } = body;

    // Validate required fields. Email is the primary login identifier; phone is optional profile data.
    if (!emailIdentifier || emailIdentifier.type !== 'email' || !name || !password) {
      return NextResponse.json(
        { success: false, message: 'Email, name and password are required' },
        { status: 400 }
      );
    }

    const phoneIdentifier = phone ? parseAuthIdentifier(phone) : null;
    if (phone && phoneIdentifier?.type !== 'phone') {
      return NextResponse.json(
        { success: false, message: 'Phone number is invalid' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: emailIdentifier.value },
    });

    if (existingUserByEmail) {
      if (existingUserByEmail.emailVerifiedAt) {
        return NextResponse.json(
          { success: false, message: 'Email này đã có tài khoản. Vui lòng đăng nhập.' },
          { status: 409 }
        );
      }

      const verificationResult = await sendEmailVerificationCode(existingUserByEmail.email);
      const isCooldown = !verificationResult.success && verificationResult.message.includes('60 giây');
      if (!verificationResult.success && !isCooldown) {
        return NextResponse.json(
          { success: false, message: verificationResult.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: isCooldown
          ? 'Tài khoản đã tồn tại nhưng chưa xác thực. Mã OTP đã được gửi trước đó, vui lòng kiểm tra email hoặc chờ 60 giây để gửi lại.'
          : 'Tài khoản đã tồn tại nhưng chưa xác thực. Mã OTP mới đã được gửi tới email của bạn.',
        requiresEmailVerification: true,
        user: {
          id: existingUserByEmail.id,
          email: existingUserByEmail.email,
          phone: existingUserByEmail.phone,
          name: existingUserByEmail.name,
          role: existingUserByEmail.role,
          status: existingUserByEmail.status,
        },
      });
    }

    if (phone) {
      const existingUserByPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingUserByPhone) {
        return NextResponse.json(
          { success: false, message: 'Số điện thoại này đã được dùng cho tài khoản khác.' },
          { status: 409 }
        );
      }
    }

    // SECURITY: Never allow self-registration as admin
    const userRole = 'AFFILIATE';

    const result = await auth.register({
      email: emailIdentifier.value,
      phone,
      password,
      name: name.trim(),
      role: userRole,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    const verificationResult = await sendEmailVerificationCode(result.user!.email);
    if (!verificationResult.success) {
      return NextResponse.json(
        { success: false, message: verificationResult.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.',
      requiresEmailVerification: true,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        phone: result.user?.phone,
        name: result.user?.name,
        role: result.user?.role,
        status: result.user?.status,
      },
    });
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { success: false, message: vi.auth.registerFailed },
      { status: 500 }
    );
  }
}
