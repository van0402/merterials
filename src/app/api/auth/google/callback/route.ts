import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Role, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AUTH_COOKIE_NAME, getAuthCookieOptions, getClearAuthCookieOptions } from '@/lib/auth-cookie';
import { createAuthToken } from '@/lib/auth-session';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const GOOGLE_STATE_COOKIE = 'google-oauth-state';

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

function getBaseUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL
    || process.env.NEXT_PUBLIC_SITE_URL
    || request.nextUrl.origin
  ).replace(/\/$/, '');
}

function redirectWithError(request: NextRequest, message: string) {
  const url = new URL('/login', getBaseUrl(request));
  url.searchParams.set('error', message);
  const response = NextResponse.redirect(url);
  response.cookies.set(GOOGLE_STATE_COOKIE, '', getClearAuthCookieOptions());
  return response;
}

async function exchangeCodeForAccessToken(request: NextRequest, code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Google OAuth is not configured');

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${getBaseUrl(request)}/api/auth/google/callback`;
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    console.error('Google token exchange failed:', data);
    throw new Error('Cannot verify Google login');
  }

  return data.access_token as string;
}

async function fetchGoogleUser(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) {
    console.error('Google userinfo failed:', data);
    throw new Error('Cannot load Google profile');
  }
  return data;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return redirectWithError(request, 'Phiên đăng nhập Google không hợp lệ. Vui lòng thử lại.');
  }

  try {
    const accessToken = await exchangeCodeForAccessToken(request, code);
    const googleUser = await fetchGoogleUser(accessToken);
    const email = googleUser.email?.trim().toLowerCase();

    if (!email || !googleUser.email_verified) {
      return redirectWithError(request, 'Google chưa xác thực email này. Vui lòng dùng tài khoản Google khác.');
    }

    const name = googleUser.name?.trim() || email.split('@')[0] || 'SMEE Affiliate';
    const user = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({ where: { email } });
      if (existingUser) {
        return tx.user.update({
          where: { id: existingUser.id },
          data: {
            status: UserStatus.ACTIVE,
            emailVerifiedAt: existingUser.emailVerifiedAt || new Date(),
            profilePicture: existingUser.profilePicture || googleUser.picture || null,
            lastLogin: new Date(),
          },
        });
      }

      const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      const created = await tx.user.create({
        data: {
          email,
          name,
          password: randomPassword,
          role: Role.USER,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
          profilePicture: googleUser.picture || null,
          lastLogin: new Date(),
        },
      });

      return created;
    });

    const token = await createAuthToken(user);
    const redirectPath = user.role === Role.ADMIN ? '/admin' : '/';
    const response = NextResponse.redirect(new URL(redirectPath, getBaseUrl(request)));
    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    response.cookies.set(GOOGLE_STATE_COOKIE, '', getClearAuthCookieOptions());
    return response;
  } catch (error) {
    console.error('Google login callback error:', error);
    return redirectWithError(request, 'Không thể đăng nhập Google. Vui lòng thử lại hoặc dùng email/mật khẩu.');
  }
}
