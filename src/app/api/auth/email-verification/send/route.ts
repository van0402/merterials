import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { parseAuthIdentifier } from '@/lib/auth-identifier';
import { sendEmailVerificationCode } from '@/lib/email-verification';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rateLimit = await checkRateLimit(ip, 'auth/email-verification/send', 3, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString() } }
      );
    }

    const body = await request.json();
    const identifier = parseAuthIdentifier(body.email);
    if (!identifier || identifier.type !== 'email') {
      return NextResponse.json(
        { success: false, message: 'Email không hợp lệ.' },
        { status: 400 }
      );
    }

    const result = await sendEmailVerificationCode(identifier.value);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Send email verification code error:', error);
    return NextResponse.json(
      { success: false, message: 'Không gửi được mã xác thực. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
