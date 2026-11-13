import { describe, it, expect } from 'vitest';
import { SignJWT } from 'jose';
import {
  createPasswordToken,
  verifyPasswordToken,
  verifyPasswordTokenClaims,
  passwordVersion,
  checkTokenAgainstUser,
  PASSWORD_TOKEN_TTL_SECONDS,
  type PasswordTokenUser,
} from '@/lib/auth/password-token';

const user: PasswordTokenUser = {
  id: 'user_1',
  email: 'jane@partner.example',
  full_name: 'Jane Partner',
  password_hash: '$argon2id$v=19$m=19456,t=2,p=1$original',
  is_active: true,
};

const loader = (u: PasswordTokenUser | null) => async (id: string) => (u && u.id === id ? u : null);

describe('password tokens', () => {
  it('passwordVersion is the first 16 hex chars of sha256(hash)', () => {
    const v = passwordVersion(user.password_hash);
    expect(v).toMatch(/^[0-9a-f]{16}$/);
    expect(passwordVersion(user.password_hash)).toBe(v);
    expect(passwordVersion(user.password_hash + 'x')).not.toBe(v);
  });

  it('round-trips a reset token', async () => {
    const token = await createPasswordToken({ userId: user.id, purpose: 'reset', passwordHash: user.password_hash });
    const result = await verifyPasswordToken(token, loader(user), { purposes: ['reset'] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.claims.userId).toBe(user.id);
      expect(result.claims.purpose).toBe('reset');
      expect(result.user.email).toBe(user.email);
    }
  });

  it('carries the org claim on invite tokens', async () => {
    const token = await createPasswordToken({
      userId: user.id,
      purpose: 'invite',
      passwordHash: user.password_hash,
      orgId: 'org_9',
    });
    const result = await verifyPasswordTokenClaims(token, ['invite']);
    expect(result.ok && result.claims.orgId).toBe('org_9');
  });

  it('rejects the wrong purpose', async () => {
    const token = await createPasswordToken({ userId: user.id, purpose: 'invite', passwordHash: user.password_hash });
    const result = await verifyPasswordToken(token, loader(user), { purposes: ['reset'] });
    expect(result).toEqual({ ok: false, reason: 'wrong_purpose' });
  });

  it('rejects expired tokens (reset after 1 hour, invite after 7 days)', async () => {
    const now = Math.floor(Date.now() / 1000);
    const reset = await createPasswordToken({
      userId: user.id,
      purpose: 'reset',
      passwordHash: user.password_hash,
      nowSeconds: now - PASSWORD_TOKEN_TTL_SECONDS.reset - 5,
    });
    expect(await verifyPasswordToken(reset, loader(user))).toEqual({ ok: false, reason: 'expired' });

    const invite = await createPasswordToken({
      userId: user.id,
      purpose: 'invite',
      passwordHash: user.password_hash,
      nowSeconds: now - 6 * 24 * 60 * 60,
    });
    expect((await verifyPasswordToken(invite, loader(user))).ok).toBe(true);
    expect(await verifyPasswordToken(invite, loader(user), { nowSeconds: now + 2 * 24 * 60 * 60 })).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('is single-use: fails once the password hash changes (pwv mismatch)', async () => {
    const token = await createPasswordToken({ userId: user.id, purpose: 'reset', passwordHash: user.password_hash });
    const changed = { ...user, password_hash: '$argon2id$v=19$m=19456,t=2,p=1$new' };
    expect(await verifyPasswordToken(token, loader(changed))).toEqual({ ok: false, reason: 'used' });
  });

  it('fails for missing or inactive users', async () => {
    const token = await createPasswordToken({ userId: user.id, purpose: 'reset', passwordHash: user.password_hash });
    expect(await verifyPasswordToken(token, loader(null))).toEqual({ ok: false, reason: 'inactive' });
    expect(await verifyPasswordToken(token, loader({ ...user, is_active: false }))).toEqual({
      ok: false,
      reason: 'inactive',
    });
  });

  it('rejects tampered, foreign-key and wrong-audience tokens', async () => {
    const token = await createPasswordToken({ userId: user.id, purpose: 'reset', passwordHash: user.password_hash });
    const [h, p, s] = token.split('.');
    const tampered = `${h}.${p}.${s.slice(0, -2)}${s.endsWith('AA') ? 'BB' : 'AA'}`;
    expect(await verifyPasswordTokenClaims(tampered)).toEqual({ ok: false, reason: 'invalid' });
    expect(await verifyPasswordTokenClaims('not-a-jwt')).toEqual({ ok: false, reason: 'invalid' });
    expect(await verifyPasswordTokenClaims('')).toEqual({ ok: false, reason: 'invalid' });

    // Signed directly with the raw session secret (e.g. a session cookie): rejected.
    const raw = new TextEncoder().encode(
      process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32
        ? process.env.SESSION_SECRET
        : 'omnipriv-fallback-development-secret-minimum-32-chars'
    );
    const sessionLike = await new SignJWT({ purpose: 'reset', pwv: passwordVersion(user.password_hash) })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuer('omnipriv-partner-portal')
      .setAudience('omnipriv-partner-portal-password')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(raw);
    expect(await verifyPasswordTokenClaims(sessionLike)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('checkTokenAgainstUser rejects a user id mismatch', () => {
    const claims = { userId: 'someone_else', purpose: 'reset' as const, pwv: passwordVersion(user.password_hash) };
    expect(checkTokenAgainstUser(claims, user)).toBe('inactive');
  });
});
