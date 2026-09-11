import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { checkRateLimit } from '@/lib/rate-limit';
import { parseAuthIdentifier } from '@/lib/auth-identifier';
import { verifyEmailCode } from '@/lib/email-verification';
import { AUTH_COOKIE_NAME, AUTH_SESSION_MAX_AGE_SECONDS, getAuthCookieOptions } from '@/lib/auth-cookie';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rateLimit = await checkRateLimit(ip, 'auth/email-verification/verify', 8, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Bạn nhập mã quá nhiều lần. Vui lòng thử lại sau.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString() } }
      );
    }

    const body = await request.json();
    const identifier = parseAuthIdentifier(body.email);
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!identifier || identifier.type !== 'email' || !code) {
      return NextResponse.json(
        { success: false, message: 'Email và mã xác thực là bắt buộc.' },
        { status: 400 }
      );
    }

    const result = await verifyEmailCode(identifier.value, code);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    const user = result.user;
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${AUTH_SESSION_MAX_AGE_SECONDS}s`)
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      message: result.message,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.status,
        hasAffiliate: !!user.affiliate,
        contractStatus: user.affiliate?.contract?.status ?? null,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    return response;
  } catch (error) {
    console.error('Verify email code error:', error);
    return NextResponse.json(
      { success: false, message: 'Không xác thực được email. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
