import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/rate-limit';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth-cookie';
import { createAuthToken } from '@/lib/auth-session';
import { parseAuthIdentifier } from '@/lib/auth-identifier';
import { vi } from '@/lib/i18n/vi';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 login attempts per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rateLimit = await checkRateLimit(ip, 'auth/login', 5, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    const body = await request.json();
    const identifier = parseAuthIdentifier(body.email ?? body.identifier);
    const { password } = body;

    // Validate required fields. Login now uses email as the only identifier.
    if (!identifier || identifier.type !== 'email' || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: identifier.value },
      include: { supplierProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: vi.auth.invalidCredentials },
        { status: 401 }
      );
    }

    // Check user status - use generic message to prevent account status enumeration
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'Unable to log in. Please contact support if you need assistance.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: vi.auth.invalidCredentials },
        { status: 401 }
      );
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        { success: false, code: 'EMAIL_NOT_VERIFIED', message: 'Email chưa được xác thực. Vui lòng nhập mã đã gửi tới email của bạn.' },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = await createAuthToken(user);

    // Return user data (password excluded)
    const { password: _, supplierProfile, ...userData } = user;
    const supplierStatus = supplierProfile?.status ?? null;

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { ...userData, supplierStatus },
    });

    // Set auth cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: vi.auth.invalidCredentials },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}
