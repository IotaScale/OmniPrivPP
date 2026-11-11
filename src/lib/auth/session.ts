import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { redirect } from 'next/navigation';

export interface SessionUser {
  userId: string;
  email: string;
  fullName: string;
  role: 'partner_user' | 'channel_admin';
  partnerOrgId?: string;
  partnerOrgName?: string;
  partnerTier?: string;
  membershipRole?: 'partner_owner' | 'partner_member';
}

const SESSION_COOKIE_NAME = 'omnipriv_pp_session';
const SESSION_EXPIRY_DAYS = 7;

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || 'omnipriv-fallback-development-secret-minimum-32-chars';
  return new TextEncoder().encode(secret);
}

/**
 * Sign session user into a JWT token and set HTTP-only cookie.
 */
export async function createSession(user: SessionUser): Promise<void> {
  const secret = getSecretKey();
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY_DAYS}d`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * SESSION_EXPIRY_DAYS,
  });
}

/**
 * Read and verify session from HTTP-only cookie.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      role: payload.role as 'partner_user' | 'channel_admin',
      partnerOrgId: payload.partnerOrgId as string | undefined,
      partnerOrgName: payload.partnerOrgName as string | undefined,
      partnerTier: payload.partnerTier as string | undefined,
      membershipRole: payload.membershipRole as 'partner_owner' | 'partner_member' | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Destroy the current session cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Enforce partner session guard for server components and actions.
 * Redirects to /sign-in if unauthenticated, or /channel-admin if user is an admin.
 */
export async function requirePartnerSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in');
  }

  if (session.role === 'channel_admin') {
    redirect('/channel-admin');
  }

  if (!session.partnerOrgId) {
    redirect('/sign-in');
  }

  return session;
}

/**
 * Enforce channel admin session guard.
 * Returns 403 or redirects to /channel-admin/login.
 */
export async function requireAdminSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect('/channel-admin/login');
  }

  if (session.role !== 'channel_admin') {
    // If a partner user attempts to access admin route, redirect to 403 screen
    redirect('/channel-admin/access-denied');
  }

  return session;
}
