'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { logAuditEvent } from '@/lib/audit';
import {
  createPasswordToken,
  describePasswordTokenFailure,
  MIN_PASSWORD_LENGTH,
} from '@/lib/auth/password-token';
import {
  buildPasswordLink,
  countRecentResetRequests,
  resolvePasswordToken,
  RESET_REQUESTS_PER_HOUR,
  sendPasswordResetEmail,
} from '@/lib/auth/password-flows';

const GENERIC_RESET_MESSAGE =
  'If an active account exists for that email, a password reset link is on its way. The link expires in 1 hour.';

/**
 * Start a password reset. Always returns the same message (no account
 * enumeration). Works for partner users and Channel Admins alike.
 */
export async function requestPasswordResetAction(email: string): Promise<{ success: true; message: string }> {
  const parsed = z.string().trim().toLowerCase().email().max(320).safeParse(email);
  if (!parsed.success) return { success: true, message: GENERIC_RESET_MESSAGE };

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data },
      select: { id: true, email: true, full_name: true, password_hash: true, is_active: true },
    });
    if (!user || !user.is_active) return { success: true, message: GENERIC_RESET_MESSAGE };

    if ((await countRecentResetRequests(user.id)) >= RESET_REQUESTS_PER_HOUR) {
      console.info('[PASSWORD_RESET] Rate limited for user', user.id);
      return { success: true, message: GENERIC_RESET_MESSAGE };
    }

    const token = await createPasswordToken({ userId: user.id, purpose: 'reset', passwordHash: user.password_hash });
    const mail = await sendPasswordResetEmail({
      to: user.email,
      name: user.full_name,
      resetUrl: buildPasswordLink(token, 'reset'),
    });

    await logAuditEvent({
      actorUserId: user.id,
      entityType: 'user',
      entityId: user.id,
      eventType: 'user.password_reset_requested',
      metadata: { email_sent: mail.sent },
    });
  } catch (err) {
    console.error('[PASSWORD_RESET_REQUEST_ERROR]', err);
  }

  return { success: true, message: GENERIC_RESET_MESSAGE };
}

export type ResetPasswordState = { error?: string; expired?: boolean } | undefined;

/**
 * Redeem an invite / reset token and set the password. The token is
 * re-verified here (it may have been used or expired since the page loaded);
 * changing the hash makes it unusable afterwards.
 */
export async function resetPasswordAction(
  token: string,
  password: string,
  confirm: string
): Promise<ResetPasswordState> {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` };
  }
  if (password.length > 256) {
    return { error: 'Password is too long.' };
  }
  if (password !== confirm) {
    return { error: 'Passwords do not match' };
  }

  const verified = await resolvePasswordToken(typeof token === 'string' ? token : '');
  if (!verified.ok) {
    return {
      error: `${describePasswordTokenFailure(verified.reason)} Request a new link to continue.`,
      expired: true,
    };
  }

  const { user, claims } = verified;
  const passwordHash = await hashPassword(password);

  // Compare-and-set on the old hash so two concurrent submissions of the same
  // token can't both succeed.
  const updated = await prisma.user.updateMany({
    where: { id: user.id, password_hash: user.password_hash, is_active: true },
    data: {
      password_hash: passwordHash,
      ...(claims.purpose === 'invite' ? { email_verified_at: new Date() } : {}),
    },
  });
  if (updated.count !== 1) {
    return { error: 'This link has already been used. Request a new link to continue.', expired: true };
  }

  await logAuditEvent({
    actorUserId: user.id,
    partnerOrgId: claims.purpose === 'invite' ? claims.orgId : null,
    entityType: 'user',
    entityId: user.id,
    eventType: claims.purpose === 'invite' ? 'team.invite_accepted' : 'user.password_reset',
  });

  redirect('/sign-in?reset=1');
}

/** useActionState adapter for the reset-password form. */
export async function resetPasswordFormAction(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  return resetPasswordAction(
    String(formData.get('token') ?? ''),
    String(formData.get('password') ?? ''),
    String(formData.get('confirmPassword') ?? '')
  );
}
