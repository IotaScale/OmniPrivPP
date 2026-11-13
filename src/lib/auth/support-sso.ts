import { randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';
import type { SessionUser } from '@/lib/auth/session';
import { SUPPORT_SSO_PATH } from '@/lib/auth/support-sso-path';

// One-time handoff from the Partner Portal to the customer support portal
// (support.omnipriv.com). The support app verifies the token with the same
// SUPPORT_SSO_SECRET, burns its jti, re-checks the user/org in the shared
// database, and signs the user in. Keep these constants in sync with
// omnipriv-customer-support/customer-support/backend/lib/partner-sso.ts.
const SSO_ISSUER = 'omnipriv-partner-portal';
const SSO_AUDIENCE = 'omnipriv-customer-support';
const SSO_TTL_SECONDS = 60;

export { SUPPORT_SSO_PATH };

export function getSupportPortalUrl(): string {
  return (process.env.SUPPORT_PORTAL_URL || 'https://support.omnipriv.com').replace(/\/+$/, '');
}

function getSsoKey(): Uint8Array {
  const secret = process.env.SUPPORT_SSO_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('SUPPORT_SSO_SECRET must contain at least 32 bytes.');
  }
  return new TextEncoder().encode(secret);
}

/** Default support-portal landing page for Channel Admins. */
export const SUPPORT_ADMIN_DEFAULT_NEXT = '/support-console';

/**
 * Mint the one-time handoff token. Partner tokens carry the `org` claim; a
 * Channel Admin token carries none (the support app resolves the admin by
 * `sub` and checks the `channel_admin` role in the shared database).
 */
export async function createSupportHandoffToken(session: SessionUser): Promise<string> {
  const claims =
    session.role === 'channel_admin' ? {} : { org: session.partnerOrgId };
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.userId)
    .setIssuer(SSO_ISSUER)
    .setAudience(SSO_AUDIENCE)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${SSO_TTL_SECONDS}s`)
    .sign(getSsoKey());
}

/** Only allow the support handoff path as a post-sign-in destination. */
export function safePostSignInPath(next: unknown): string | null {
  if (typeof next !== 'string') return null;
  return next === SUPPORT_SSO_PATH || next.startsWith(`${SUPPORT_SSO_PATH}?`) ? next : null;
}
