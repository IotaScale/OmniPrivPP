import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  createSupportHandoffToken,
  getSupportPortalUrl,
  SUPPORT_ADMIN_DEFAULT_NEXT,
  SUPPORT_SSO_PATH,
} from '@/lib/auth/support-sso';

export const runtime = 'nodejs';

/**
 * GET /api/support-sso[?next=/cases]
 * "Support" link target: hands the signed-in partner user (or Channel Admin,
 * via "Support console") to support.omnipriv.com with a single-use, 60-second
 * token so they arrive already signed in.
 */
export async function GET(request: NextRequest) {
  const supportUrl = getSupportPortalUrl();
  const next = request.nextUrl.searchParams.get('next');
  const session = await getSession();

  if (!session) {
    const selfPath = next
      ? `${SUPPORT_SSO_PATH}?next=${encodeURIComponent(next)}`
      : SUPPORT_SSO_PATH;
    const signIn = new URL('/sign-in', request.url);
    signIn.searchParams.set('next', selfPath);
    return NextResponse.redirect(signIn, 303);
  }

  const isAdmin = session.role === 'channel_admin';

  // Partner users without a partner org have no customer workspace.
  if (!isAdmin && (session.role !== 'partner_user' || !session.partnerOrgId)) {
    return NextResponse.redirect(`${supportUrl}/sign-in`, 303);
  }

  try {
    const target = new URL('/api/customer/auth/partner-sso', supportUrl);
    target.searchParams.set('token', await createSupportHandoffToken(session));
    // Admins land on the support console unless a destination was requested.
    const destination = next || (isAdmin ? SUPPORT_ADMIN_DEFAULT_NEXT : null);
    if (destination) target.searchParams.set('next', destination);

    const response = NextResponse.redirect(target, 303);
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch (error) {
    console.error('[SUPPORT_SSO_ERROR]', error instanceof Error ? error.message : error);
    return NextResponse.redirect(`${supportUrl}/sign-in`, 303);
  }
}
