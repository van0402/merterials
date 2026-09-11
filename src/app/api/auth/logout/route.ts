import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getClearAuthCookieOptions } from '@/lib/auth-cookie';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear the auth token cookie
    response.cookies.set(AUTH_COOKIE_NAME, '', getClearAuthCookieOptions());

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}