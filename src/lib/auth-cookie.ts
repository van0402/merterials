import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export const AUTH_COOKIE_NAME = 'auth-token';
export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function getAuthCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.AUTH_COOKIE_SECURE !== 'false',
    sameSite: 'lax',
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    expires: new Date(Date.now() + AUTH_SESSION_MAX_AGE_SECONDS * 1000),
    path: '/',
  };
}

export function getClearAuthCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.AUTH_COOKIE_SECURE !== 'false',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  };
}
