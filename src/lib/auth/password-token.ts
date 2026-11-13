import { createHash } from 'node:crypto';
import { SignJWT, jwtVerify, errors as joseErrors } from 'jose';

// Single-use "set your password" tokens for team invites and password resets.
// No schema change: a token carries `pwv`, a fingerprint of the user's current
// password hash, so it stops verifying as soon as the password changes (which
// is exactly what redeeming it does). Signed with a key derived from
// SESSION_SECRET (domain-separated, so a session cookie can never pass as a
// password token or vice versa).
//
// This module is pure (no database / Next.js imports) so it can be unit
// tested; callers pass a `loadUser` function to `verifyPasswordToken`.

export const PASSWORD_TOKEN_ISSUER = 'omnipriv-partner-portal';
export const PASSWORD_TOKEN_AUDIENCE = 'omnipriv-partner-portal-password';

export type PasswordTokenPurpose = 'invite' | 'reset';

export const PASSWORD_TOKEN_TTL_SECONDS: Record<PasswordTokenPurpose, number> = {
  invite: 7 * 24 * 60 * 60,
  reset: 60 * 60,
};

export const MIN_PASSWORD_LENGTH = 8;

const DEV_FALLBACK_SECRET = 'omnipriv-fallback-development-secret-minimum-32-chars';

function getPasswordTokenKey(): Uint8Array {
  let secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    // Same rule as session.ts: never sign with a guessable key in production.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set to at least 32 characters.');
    }
    secret = DEV_FALLBACK_SECRET;
  }
  // Domain-separate from the session-cookie key.
  return new Uint8Array(createHash('sha256').update(`password-token:v1:${secret}`).digest());
}

/** First 16 hex chars of sha256(password_hash). */
export function passwordVersion(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
}

export interface CreatePasswordTokenInput {
  userId: string;
  purpose: PasswordTokenPurpose;
  /** The user's current password_hash (only its fingerprint goes in the token). */
  passwordHash: string;
  /** Invite tokens: the organization the user was invited to (for page wording). */
  orgId?: string;
  /** Override the clock (seconds since epoch); tests only. */
  nowSeconds?: number;
}

export async function createPasswordToken(input: CreatePasswordTokenInput): Promise<string> {
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const claims: Record<string, string> = {
    purpose: input.purpose,
    pwv: passwordVersion(input.passwordHash),
  };
  if (input.orgId) claims.org = input.orgId;

  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.userId)
    .setIssuer(PASSWORD_TOKEN_ISSUER)
    .setAudience(PASSWORD_TOKEN_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + PASSWORD_TOKEN_TTL_SECONDS[input.purpose])
    .sign(getPasswordTokenKey());
}

export interface PasswordTokenClaims {
  userId: string;
  purpose: PasswordTokenPurpose;
  pwv: string;
  orgId?: string;
}

export type PasswordTokenFailure =
  /** Bad signature, malformed, wrong issuer/audience. */
  | 'invalid'
  | 'expired'
  | 'wrong_purpose'
  /** Password already changed since the token was issued (token was used). */
  | 'used'
  /** User missing or deactivated. */
  | 'inactive';

export type ClaimsResult =
  | { ok: true; claims: PasswordTokenClaims }
  | { ok: false; reason: PasswordTokenFailure };

/** Signature, issuer/audience, expiry and purpose checks only (no user lookup). */
export async function verifyPasswordTokenClaims(
  token: string,
  allowedPurposes: PasswordTokenPurpose[] = ['invite', 'reset'],
  nowSeconds?: number
): Promise<ClaimsResult> {
  if (typeof token !== 'string' || token.length === 0 || token.length > 4096) {
    return { ok: false, reason: 'invalid' };
  }
  try {
    const { payload } = await jwtVerify(token, getPasswordTokenKey(), {
      algorithms: ['HS256'],
      issuer: PASSWORD_TOKEN_ISSUER,
      audience: PASSWORD_TOKEN_AUDIENCE,
      currentDate: nowSeconds !== undefined ? new Date(nowSeconds * 1000) : undefined,
    });
    const purpose = payload.purpose;
    if (purpose !== 'invite' && purpose !== 'reset') return { ok: false, reason: 'invalid' };
    if (!allowedPurposes.includes(purpose)) return { ok: false, reason: 'wrong_purpose' };
    if (typeof payload.sub !== 'string' || !payload.sub) return { ok: false, reason: 'invalid' };
    if (typeof payload.pwv !== 'string' || !payload.pwv) return { ok: false, reason: 'invalid' };
    return {
      ok: true,
      claims: {
        userId: payload.sub,
        purpose,
        pwv: payload.pwv,
        orgId: typeof payload.org === 'string' ? payload.org : undefined,
      },
    };
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) return { ok: false, reason: 'expired' };
    return { ok: false, reason: 'invalid' };
  }
}

export interface PasswordTokenUser {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  is_active: boolean;
}

/** Checks the claims against the live user row. */
export function checkTokenAgainstUser(
  claims: PasswordTokenClaims,
  user: PasswordTokenUser | null
): PasswordTokenFailure | null {
  if (!user || user.id !== claims.userId || !user.is_active) return 'inactive';
  if (passwordVersion(user.password_hash) !== claims.pwv) return 'used';
  return null;
}

export type VerifyResult<U extends PasswordTokenUser> =
  | { ok: true; claims: PasswordTokenClaims; user: U }
  | { ok: false; reason: PasswordTokenFailure };

/** Full verification: signature, purpose, expiry, user exists + active, pwv matches. */
export async function verifyPasswordToken<U extends PasswordTokenUser>(
  token: string,
  loadUser: (userId: string) => Promise<U | null>,
  options: { purposes?: PasswordTokenPurpose[]; nowSeconds?: number } = {}
): Promise<VerifyResult<U>> {
  const result = await verifyPasswordTokenClaims(token, options.purposes, options.nowSeconds);
  if (!result.ok) return result;
  const user = await loadUser(result.claims.userId);
  const failure = checkTokenAgainstUser(result.claims, user);
  if (failure || !user) return { ok: false, reason: failure ?? 'inactive' };
  return { ok: true, claims: result.claims, user };
}

/** User-facing explanation for a failed token. */
export function describePasswordTokenFailure(reason: PasswordTokenFailure): string {
  switch (reason) {
    case 'expired':
      return 'This link has expired.';
    case 'used':
      return 'This link has already been used.';
    case 'inactive':
      return 'This account is no longer active.';
    default:
      return 'This link is invalid.';
  }
}
