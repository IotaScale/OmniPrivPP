import 'server-only';
import { prisma } from '@/lib/db';
import {
  createPasswordToken,
  verifyPasswordToken,
  type PasswordTokenPurpose,
  type VerifyResult,
  type PasswordTokenUser,
} from '@/lib/auth/password-token';
import { getAppBaseUrl, renderBrandedEmail, sendEmail, type SendEmailResult } from '@/lib/email/mailer';

// Server-side glue for invite / password-reset flows: DB lookups, link
// building, email copy, and the audit-event based "pending invite" and rate
// limit checks (no schema change).

/** Events proving the user has set or used a password of their own. */
export const PASSWORD_ESTABLISHED_EVENTS = [
  'team.invite_accepted',
  'user.password_reset',
  'user.authenticated',
  'channel_admin.authenticated',
] as const;

export const INVITE_SENT_EVENTS = ['team.member_invited', 'team.invite_resent'] as const;
export const RESEND_INVITE_COOLDOWN_MS = 60 * 1000;
export const RESET_REQUESTS_PER_HOUR = 3;

export async function loadPasswordTokenUser(userId: string): Promise<PasswordTokenUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, full_name: true, password_hash: true, is_active: true },
  });
}

export type ResolvedPasswordToken = VerifyResult<PasswordTokenUser> & { orgName?: string };

/**
 * Verify a token against the live user. For invite tokens, also require that
 * the user still belongs to the inviting organization (an invite revoked by
 * removing the member stops working) and resolve the org name for wording.
 */
export async function resolvePasswordToken(token: string): Promise<ResolvedPasswordToken> {
  const result = await verifyPasswordToken(token, loadPasswordTokenUser);
  if (!result.ok || result.claims.purpose !== 'invite' || !result.claims.orgId) return result;

  const membership = await prisma.partnerMembership.findUnique({
    where: {
      user_id_partner_organization_id: {
        user_id: result.user.id,
        partner_organization_id: result.claims.orgId,
      },
    },
    select: { organization: { select: { display_name: true } } },
  });
  if (!membership) return { ok: false, reason: 'invalid' };
  return { ...result, orgName: membership.organization.display_name };
}

export function buildPasswordLink(token: string, purpose: PasswordTokenPurpose): string {
  const url = new URL('/reset-password', getAppBaseUrl());
  url.searchParams.set('token', token);
  if (purpose === 'invite') url.searchParams.set('invite', '1');
  return url.toString();
}

export async function createInviteLink(user: { id: string; password_hash: string }, orgId: string) {
  const token = await createPasswordToken({
    userId: user.id,
    purpose: 'invite',
    passwordHash: user.password_hash,
    orgId,
  });
  return buildPasswordLink(token, 'invite');
}

function roleLabel(role?: string): string | null {
  if (role === 'partner_owner') return 'Partner Owner';
  if (role === 'partner_member') return 'Partner Member';
  return null;
}

function invitedByLabel(name: string, email?: string): string {
  return email ? `${name} (${email})` : name;
}

export function sendNewUserInviteEmail(input: {
  to: string;
  inviteeName: string;
  inviterName: string;
  inviterEmail?: string;
  orgName: string;
  role?: string;
  inviteUrl: string;
}): Promise<SendEmailResult> {
  const role = roleLabel(input.role);
  const subject = `${input.inviterName} from ${input.orgName} invited you to join ${input.orgName} on OmniPriv`;
  const { html, text } = renderBrandedEmail({
    preheader: `Join ${input.orgName} on the OmniPriv Partner Portal. Accept within 7 days.`,
    heading: `Join ${input.orgName} on OmniPriv`,
    paragraphs: [
      `Hi ${input.inviteeName},`,
      `${input.inviterName} from ${input.orgName} invited you to join ${input.orgName} on the OmniPriv Partner Portal.`,
      `As part of the ${input.orgName} team you can register customer deals, work leads OmniPriv routes to your organization, track renewals and requests, access sales and technical enablement, and open support cases.`,
      'Accept the invitation to set your password and activate your account.',
    ],
    details: [
      { label: 'Organization', value: input.orgName },
      { label: 'Invited by', value: invitedByLabel(input.inviterName, input.inviterEmail) },
      ...(role ? [{ label: 'Your role', value: role }] : []),
      { label: 'Invitation expires', value: 'In 7 days (single use)' },
    ],
    cta: { label: 'Accept invitation', url: input.inviteUrl },
    footnote: `You received this because ${input.inviterName} invited ${input.to} to ${input.orgName}. If you weren't expecting it, you can ignore this email.`,
  });
  return sendEmail({ to: input.to, subject, text, html });
}

export function sendExistingUserAddedEmail(input: {
  to: string;
  inviteeName: string;
  inviterName: string;
  inviterEmail?: string;
  orgName: string;
  role?: string;
}): Promise<SendEmailResult> {
  const role = roleLabel(input.role);
  const subject = `${input.inviterName} from ${input.orgName} added you to ${input.orgName} on OmniPriv`;
  const signInUrl = new URL('/sign-in', getAppBaseUrl()).toString();
  const { html, text } = renderBrandedEmail({
    preheader: `You now have access to ${input.orgName} on the OmniPriv Partner Portal.`,
    heading: `You've joined ${input.orgName} on OmniPriv`,
    paragraphs: [
      `Hi ${input.inviteeName},`,
      `${input.inviterName} from ${input.orgName} added you to ${input.orgName} on the OmniPriv Partner Portal.`,
      'Sign in with your existing OmniPriv Partner Portal password to get started.',
    ],
    details: [
      { label: 'Organization', value: input.orgName },
      { label: 'Added by', value: invitedByLabel(input.inviterName, input.inviterEmail) },
      ...(role ? [{ label: 'Your role', value: role }] : []),
    ],
    cta: { label: 'Sign in to the Partner Portal', url: signInUrl },
    footnote: 'Forgot your password? Use "Forgot password?" on the sign-in page.',
  });
  return sendEmail({ to: input.to, subject, text, html });
}

export function sendPasswordResetEmail(input: { to: string; name: string; resetUrl: string }) {
  const subject = 'Reset your OmniPriv Partner Portal password';
  const { html, text } = renderBrandedEmail({
    preheader: 'Reset link inside. It expires in 1 hour.',
    heading: 'Reset your password',
    paragraphs: [
      `Hi ${input.name},`,
      'We received a request to reset the password for your OmniPriv Partner Portal account. This link expires in 1 hour and can be used once.',
    ],
    cta: { label: 'Reset your password', url: input.resetUrl },
    footnote: "If you didn't request this, you can ignore this email — your password won't change.",
  });
  return sendEmail({ to: input.to, subject, text, html });
}

/**
 * Of the given users, which invited ones have never set a password?
 * Pending = invited into this org (`team.member_invited`) and no event shows
 * they ever set/used a password of their own.
 */
export async function findPendingInviteUserIds(orgId: string, userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const [invited, established] = await Promise.all([
    prisma.auditEvent.findMany({
      where: { partner_organization_id: orgId, event_type: 'team.member_invited', entity_id: { in: userIds } },
      select: { entity_id: true },
      distinct: ['entity_id'],
    }),
    prisma.auditEvent.findMany({
      where: {
        entity_type: 'user',
        entity_id: { in: userIds },
        event_type: { in: [...PASSWORD_ESTABLISHED_EVENTS] },
      },
      select: { entity_id: true },
      distinct: ['entity_id'],
    }),
  ]);
  const done = new Set(established.map((e) => e.entity_id));
  return new Set(invited.map((e) => e.entity_id).filter((id) => !done.has(id)));
}

export async function hasEstablishedPassword(userId: string): Promise<boolean> {
  const event = await prisma.auditEvent.findFirst({
    where: { entity_type: 'user', entity_id: userId, event_type: { in: [...PASSWORD_ESTABLISHED_EVENTS] } },
    select: { id: true },
  });
  return Boolean(event);
}

/** Most recent invite (or resend) for this user in this org. */
export async function lastInviteSentAt(orgId: string, userId: string): Promise<Date | null> {
  const event = await prisma.auditEvent.findFirst({
    where: { partner_organization_id: orgId, entity_id: userId, event_type: { in: [...INVITE_SENT_EVENTS] } },
    orderBy: { created_at: 'desc' },
    select: { created_at: true },
  });
  return event?.created_at ?? null;
}

export async function countRecentResetRequests(userId: string, sinceMs = 60 * 60 * 1000): Promise<number> {
  return prisma.auditEvent.count({
    where: {
      entity_type: 'user',
      entity_id: userId,
      event_type: 'user.password_reset_requested',
      created_at: { gte: new Date(Date.now() - sinceMs) },
    },
  });
}
