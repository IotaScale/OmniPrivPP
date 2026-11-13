/**
 * Pure partner-access rules (no Prisma / Next imports so they are unit-testable).
 *
 * A partner session only carries the org id; whether that org may use the
 * workspace is always decided from the database on every request.
 */

/** Only page a partner whose access was revoked (e.g. suspended org) can see. */
export const ACCOUNT_STATUS_PATH = '/partner-portal/account-status';

export type PartnerOrgStatus = 'active' | 'suspended';

export interface PartnerAccessRecord {
  orgStatus: PartnerOrgStatus;
  userActive: boolean;
}

export type PartnerAccessDecision =
  | { allowed: true }
  | { allowed: false; reason: 'suspended' | 'no_membership' | 'user_inactive' };

/**
 * Decide whether a partner may use the operational workspace.
 * `record` is null when the membership (or org) no longer exists.
 */
export function evaluatePartnerAccess(record: PartnerAccessRecord | null): PartnerAccessDecision {
  if (!record) return { allowed: false, reason: 'no_membership' };
  if (!record.userActive) return { allowed: false, reason: 'user_inactive' };
  if (record.orgStatus === 'active') return { allowed: true };
  return { allowed: false, reason: 'suspended' };
}

/** Only members of active organizations may sign in. */
export function canSignInWithOrgStatus(status: PartnerOrgStatus): boolean {
  return status === 'active';
}

/** Pick the membership a user signs in with: the first active organization. */
export function pickSignInMembership<T extends { organization: { status: PartnerOrgStatus } }>(
  memberships: T[]
): T | null {
  return memberships.find((m) => canSignInWithOrgStatus(m.organization.status)) ?? null;
}
