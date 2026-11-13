/**
 * Pure rules for Channel Admin delete operations (no Prisma / Next imports so
 * they are unit-testable). The server actions in `lib/actions/admin-delete.ts`
 * load the data, run these rules, and refuse the delete when a rule fails.
 */

export type UserRoleValue = 'partner_user' | 'channel_admin';
export type MembershipRoleValue = 'partner_owner' | 'partner_member';

/** Support-portal tenant id for a partner organization (shared DB, `customer_support` schema). */
export function supportTenantIdForOrg(orgId: string): string {
  return `pp_${orgId}`;
}

/**
 * Typed confirmation for destructive deletes: the admin must type the exact
 * name (surrounding whitespace ignored, case-sensitive).
 */
export function confirmationMatches(typed: string | null | undefined, expected: string): boolean {
  if (typeof typed !== 'string') return false;
  const want = expected.trim();
  return want.length > 0 && typed.trim() === want;
}

export interface UserDeletionMembership {
  orgId: string;
  orgName: string;
  role: MembershipRoleValue;
  /** Number of `partner_owner` memberships in that organization, including this user. */
  ownerCount: number;
}

export interface UserDeletionInput {
  actorUserId: string;
  target: { id: string; role: UserRoleValue };
  memberships: UserDeletionMembership[];
}

export type UserDeletionDecision =
  | { allowed: true }
  | {
      allowed: false;
      code: 'self' | 'channel_admin' | 'sole_owner';
      reason: string;
      /** Organizations where the target is the only owner (code `sole_owner`). */
      orgIds?: string[];
    };

/**
 * Can a Channel Admin delete this user account?
 * - never the admin themself;
 * - never another Channel Admin;
 * - never the only `partner_owner` of an organization (delete the organization
 *   instead, or promote another owner first).
 */
export function evaluatePartnerUserDeletion(input: UserDeletionInput): UserDeletionDecision {
  const { actorUserId, target, memberships } = input;

  if (target.id === actorUserId) {
    return { allowed: false, code: 'self', reason: 'You cannot delete your own account.' };
  }

  if (target.role === 'channel_admin') {
    return {
      allowed: false,
      code: 'channel_admin',
      reason: 'Channel Admin accounts cannot be deleted from the partner console.',
    };
  }

  const soleOwnerOf = memberships.filter((m) => m.role === 'partner_owner' && m.ownerCount <= 1);
  if (soleOwnerOf.length > 0) {
    const names = soleOwnerOf.map((m) => m.orgName).join(', ');
    return {
      allowed: false,
      code: 'sole_owner',
      reason: `This user is the only owner of ${names}. Promote another owner first, or delete the organization instead.`,
      orgIds: soleOwnerOf.map((m) => m.orgId),
    };
  }

  return { allowed: true };
}

export interface ReplacementCandidate {
  userId: string;
  role: MembershipRoleValue;
  joinedAt: Date;
  isActive?: boolean;
}

/**
 * Pick who inherits records (deals, commercial requests) owned by a deleted
 * user inside one organization: an active owner first, then any active member,
 * then anyone left; earliest joiner wins ties. Returns null if nobody is left.
 */
export function pickReplacementMember(
  candidates: ReplacementCandidate[],
  excludedUserIds: string[]
): string | null {
  const excluded = new Set(excludedUserIds);
  const pool = candidates.filter((c) => !excluded.has(c.userId));
  if (pool.length === 0) return null;

  const rank = (c: ReplacementCandidate) =>
    (c.isActive === false ? 2 : 0) + (c.role === 'partner_owner' ? 0 : 1);

  const sorted = [...pool].sort(
    (a, b) => rank(a) - rank(b) || a.joinedAt.getTime() - b.joinedAt.getTime()
  );
  return sorted[0].userId;
}

export interface OrgMemberForDeletion {
  userId: string;
  email: string;
  userRole: UserRoleValue;
  /** Memberships this user holds in organizations other than the one being deleted. */
  otherMembershipCount: number;
  /**
   * Records outside the organization that reference this user with a
   * non-cascading foreign key (deals or commercial requests in another org,
   * lead assignments they made). Such users are kept so nothing fails or is
   * silently reassigned.
   */
  hasExternalRecords: boolean;
}

export type RetainReason = 'channel_admin' | 'other_membership' | 'external_records';

export interface OrgUserSelection {
  toDelete: OrgMemberForDeletion[];
  retained: Array<OrgMemberForDeletion & { reason: RetainReason }>;
}

/**
 * When an organization is deleted, its users are deleted too unless they are a
 * Channel Admin, still belong to another organization, or own records elsewhere.
 */
export function selectOrgUsersForDeletion(members: OrgMemberForDeletion[]): OrgUserSelection {
  const toDelete: OrgMemberForDeletion[] = [];
  const retained: OrgUserSelection['retained'] = [];
  const seen = new Set<string>();

  for (const m of members) {
    if (seen.has(m.userId)) continue;
    seen.add(m.userId);

    if (m.userRole === 'channel_admin') retained.push({ ...m, reason: 'channel_admin' });
    else if (m.otherMembershipCount > 0) retained.push({ ...m, reason: 'other_membership' });
    else if (m.hasExternalRecords) retained.push({ ...m, reason: 'external_records' });
    else toDelete.push(m);
  }

  return { toDelete, retained };
}

/** "3 users", "1 deal" — small helper for confirm-dialog impact lists. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export interface OrgDeletionCounts {
  members: number;
  /** Members whose account is deleted too (no other membership, not a Channel Admin). */
  usersDeleted: number;
  deals: number;
  leadAssignments: number;
  renewals: number;
  commercialRequests: number;
  supportTickets: number;
}

/** Confirm-dialog impact list for deleting a partner organization. */
export function describeOrgDeletionImpact(c: OrgDeletionCounts): string[] {
  const kept = c.members - c.usersDeleted;
  const items = [
    `${pluralize(c.usersDeleted, 'user account')}${
      kept > 0 ? ` (${kept} more ${kept === 1 ? 'member is' : 'members are'} kept: still used elsewhere)` : ''
    }`,
    `${pluralize(c.deals, 'deal registration')} and their status history`,
    pluralize(c.leadAssignments, 'lead assignment'),
  ];
  if (c.renewals > 0) items.push(pluralize(c.renewals, 'renewal'));
  if (c.commercialRequests > 0) items.push(pluralize(c.commercialRequests, 'commercial request'));
  if (c.supportTickets > 0) items.push(pluralize(c.supportTickets, 'support ticket'));
  items.push(
    'Enrollments, certifications, event registrations, business plans, terms acceptances, locator profile, notifications and audit history',
    'Support-portal tenant with its cases, messages and users'
  );
  return items;
}
