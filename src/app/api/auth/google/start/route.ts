import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthCookieOptions } from '@/lib/auth-cookie';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_STATE_COOKIE = 'google-oauth-state';

function getBaseUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL
    || process.env.NEXT_PUBLIC_SITE_URL
    || request.nextUrl.origin
  ).replace(/\/$/, '');
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ success: false, error: 'Google login is not configured' }, { status: 503 });
  }

  const baseUrl = getBaseUrl(request);
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/auth/google/callback`;
  const state = crypto.randomBytes(24).toString('hex');

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(GOOGLE_STATE_COOKIE, state, {
    ...getAuthCookieOptions(),
    maxAge: 10 * 60,
    expires: new Date(Date.now() + 10 * 60 * 1000),
  });

  return response;
}
