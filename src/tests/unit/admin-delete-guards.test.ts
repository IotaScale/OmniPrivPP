import { describe, it, expect } from 'vitest';
import {
  confirmationMatches,
  describeOrgDeletionImpact,
  evaluatePartnerUserDeletion,
  pickReplacementMember,
  pluralize,
  selectOrgUsersForDeletion,
  supportTenantIdForOrg,
  type OrgMemberForDeletion,
} from '@/lib/utils/admin-delete-guards';

describe('evaluatePartnerUserDeletion', () => {
  const base = {
    actorUserId: 'admin-1',
    target: { id: 'user-1', role: 'partner_user' as const },
    memberships: [],
  };

  it('allows deleting a plain partner member', () => {
    expect(
      evaluatePartnerUserDeletion({
        ...base,
        memberships: [{ orgId: 'o1', orgName: 'Acme', role: 'partner_member', ownerCount: 1 }],
      })
    ).toEqual({ allowed: true });
  });

  it('allows deleting a user with no memberships', () => {
    expect(evaluatePartnerUserDeletion(base)).toEqual({ allowed: true });
  });

  it('blocks the admin deleting themself', () => {
    const d = evaluatePartnerUserDeletion({ ...base, target: { id: 'admin-1', role: 'partner_user' } });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe('self');
  });

  it('blocks deleting a channel admin', () => {
    const d = evaluatePartnerUserDeletion({ ...base, target: { id: 'admin-2', role: 'channel_admin' } });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe('channel_admin');
  });

  it('blocks deleting the only owner of an organization', () => {
    const d = evaluatePartnerUserDeletion({
      ...base,
      memberships: [
        { orgId: 'o1', orgName: 'Acme', role: 'partner_owner', ownerCount: 1 },
        { orgId: 'o2', orgName: 'Beta', role: 'partner_member', ownerCount: 1 },
      ],
    });
    expect(d.allowed).toBe(false);
    if (!d.allowed) {
      expect(d.code).toBe('sole_owner');
      expect(d.orgIds).toEqual(['o1']);
      expect(d.reason).toContain('Acme');
    }
  });

  it('allows deleting an owner when another owner remains', () => {
    expect(
      evaluatePartnerUserDeletion({
        ...base,
        memberships: [{ orgId: 'o1', orgName: 'Acme', role: 'partner_owner', ownerCount: 2 }],
      })
    ).toEqual({ allowed: true });
  });
});

describe('pickReplacementMember', () => {
  const t = (d: number) => new Date(2026, 0, d);

  it('prefers an owner over earlier members', () => {
    expect(
      pickReplacementMember(
        [
          { userId: 'm1', role: 'partner_member', joinedAt: t(1) },
          { userId: 'o1', role: 'partner_owner', joinedAt: t(5) },
        ],
        []
      )
    ).toBe('o1');
  });

  it('skips excluded users and prefers active accounts', () => {
    expect(
      pickReplacementMember(
        [
          { userId: 'gone', role: 'partner_owner', joinedAt: t(1) },
          { userId: 'inactive-owner', role: 'partner_owner', joinedAt: t(2), isActive: false },
          { userId: 'm2', role: 'partner_member', joinedAt: t(3) },
        ],
        ['gone']
      )
    ).toBe('m2');
  });

  it('returns null when nobody is left', () => {
    expect(pickReplacementMember([{ userId: 'x', role: 'partner_owner', joinedAt: t(1) }], ['x'])).toBeNull();
    expect(pickReplacementMember([], [])).toBeNull();
  });
});

describe('selectOrgUsersForDeletion', () => {
  const m = (over: Partial<OrgMemberForDeletion>): OrgMemberForDeletion => ({
    userId: 'u',
    email: 'u@example.com',
    userRole: 'partner_user',
    otherMembershipCount: 0,
    hasExternalRecords: false,
    ...over,
  });

  it('deletes single-org partner users and keeps everyone else', () => {
    const res = selectOrgUsersForDeletion([
      m({ userId: 'solo' }),
      m({ userId: 'multi', otherMembershipCount: 1 }),
      m({ userId: 'admin', userRole: 'channel_admin' }),
      m({ userId: 'ext', hasExternalRecords: true }),
      m({ userId: 'solo' }),
    ]);
    expect(res.toDelete.map((u) => u.userId)).toEqual(['solo']);
    expect(res.retained.map((u) => [u.userId, u.reason])).toEqual([
      ['multi', 'other_membership'],
      ['admin', 'channel_admin'],
      ['ext', 'external_records'],
    ]);
  });

  it('never deletes a channel admin even without other memberships', () => {
    const res = selectOrgUsersForDeletion([m({ userId: 'a', userRole: 'channel_admin' })]);
    expect(res.toDelete).toHaveLength(0);
  });
});

describe('confirmation and helpers', () => {
  it('requires the exact organization name, ignoring outer whitespace', () => {
    expect(confirmationMatches('  Acme Security ', 'Acme Security')).toBe(true);
    expect(confirmationMatches('acme security', 'Acme Security')).toBe(false);
    expect(confirmationMatches('', 'Acme')).toBe(false);
    expect(confirmationMatches(undefined, 'Acme')).toBe(false);
    expect(confirmationMatches('', '   ')).toBe(false);
  });

  it('derives the support tenant id', () => {
    expect(supportTenantIdForOrg('cm123')).toBe('pp_cm123');
  });

  it('describes organization deletion impact with counts', () => {
    const items = describeOrgDeletionImpact({
      members: 4,
      usersDeleted: 3,
      deals: 5,
      leadAssignments: 1,
      renewals: 0,
      commercialRequests: 2,
      supportTickets: 0,
    });
    expect(items[0]).toBe('3 user accounts (1 more member is kept: still used elsewhere)');
    expect(items).toContain('5 deal registrations and their status history');
    expect(items).toContain('1 lead assignment');
    expect(items).toContain('2 commercial requests');
    expect(items.some((i) => i.includes('renewal'))).toBe(false);
  });

  it('pluralizes counts', () => {
    expect(pluralize(1, 'user')).toBe('1 user');
    expect(pluralize(3, 'user')).toBe('3 users');
    expect(pluralize(0, 'activity', 'activities')).toBe('0 activities');
  });
});
