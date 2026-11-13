import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { SUPPORT_SSO_PATH } from '@/lib/auth/support-sso-path';

const SESSION_COOKIE_NAME = 'omnipriv_pp_session';

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    // Never sign or accept sessions with a guessable key in production.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set to at least 32 characters.');
    }
    return new TextEncoder().encode('omnipriv-fallback-development-secret-minimum-32-chars');
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let sessionPayload: Record<string, unknown> | null = null;

  if (token) {
    try {
      const secret = getSecretKey();
      const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
      sessionPayload = payload;
    } catch {
      // Invalid/expired token
      sessionPayload = null;
    }
  }

  // 1. Channel Admin routes boundary
  if (pathname.startsWith('/channel-admin')) {
    // Allow public access to login and 403 screen
    if (
      pathname === '/channel-admin/login' ||
      pathname === '/channel-admin/access-denied'
    ) {
      if (sessionPayload && sessionPayload.role === 'channel_admin' && pathname === '/channel-admin/login') {
        return NextResponse.redirect(new URL('/channel-admin', request.url));
      }
      return NextResponse.next();
    }

    if (!sessionPayload) {
      return NextResponse.redirect(new URL('/channel-admin/login', request.url));
    }

    if (sessionPayload.role !== 'channel_admin') {
      return NextResponse.redirect(new URL('/channel-admin/access-denied', request.url));
    }

    return NextResponse.next();
  }

  // 2. Partner Portal routes boundary
  if (pathname.startsWith('/partner-portal')) {
    if (!sessionPayload) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    if (sessionPayload.role === 'channel_admin') {
      return NextResponse.redirect(new URL('/channel-admin', request.url));
    }

    return NextResponse.next();
  }

  // 3. Auth pages (sign-in, sign-up) for already logged-in users
  if (pathname === '/sign-in' || pathname === '/sign-up') {
    if (sessionPayload) {
      const next = request.nextUrl.searchParams.get('next');
      if (
        sessionPayload.role === 'partner_user' &&
        next &&
        (next === SUPPORT_SSO_PATH || next.startsWith(`${SUPPORT_SSO_PATH}?`))
      ) {
        return NextResponse.redirect(new URL(next, request.url));
      }
      if (sessionPayload.role === 'channel_admin') {
        return NextResponse.redirect(new URL('/channel-admin', request.url));
      }
      return NextResponse.redirect(new URL('/partner-portal', request.url));
    }
  }

  // 4. Root path redirect
  if (pathname === '/') {
    if (sessionPayload) {
      return NextResponse.redirect(
        new URL(sessionPayload.role === 'channel_admin' ? '/channel-admin' : '/partner-portal', request.url)
      );
    }
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/sign-in',
    '/sign-up',
    '/partner-portal/:path*',
    '/channel-admin/:path*',
  ],
};
