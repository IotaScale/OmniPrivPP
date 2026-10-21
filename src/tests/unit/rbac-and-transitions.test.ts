import { describe, it, expect } from 'vitest';
import { DealStatus, MembershipRole, UserRole } from '@prisma/client';
import {
  isValidDealTransition,
  canAccessChannelAdmin,
  canManageTeam,
  canViewDeal,
  canModifyDeal,
} from '@/lib/utils/deal-state';

describe('Deal Status Transitions', () => {
  it('allows draft to awaiting_approval', () => {
    expect(isValidDealTransition(DealStatus.draft, DealStatus.awaiting_approval)).toBe(true);
  });

  it('allows awaiting_approval to approved or declined', () => {
    expect(isValidDealTransition(DealStatus.awaiting_approval, DealStatus.approved)).toBe(true);
    expect(isValidDealTransition(DealStatus.awaiting_approval, DealStatus.declined)).toBe(true);
  });

  it('allows approved to closed_won, closed_lost, or expired', () => {
    expect(isValidDealTransition(DealStatus.approved, DealStatus.closed_won)).toBe(true);
    expect(isValidDealTransition(DealStatus.approved, DealStatus.closed_lost)).toBe(true);
    expect(isValidDealTransition(DealStatus.approved, DealStatus.expired)).toBe(true);
  });

  it('prevents illegal transitions like draft directly to approved', () => {
    expect(isValidDealTransition(DealStatus.draft, DealStatus.approved)).toBe(false);
    expect(isValidDealTransition(DealStatus.closed_won, DealStatus.draft)).toBe(false);
  });
});

describe('RBAC & Multi-Tenant Access Checks', () => {
  const adminUser = { role: UserRole.channel_admin };
  const partnerOwnerA = {
    role: UserRole.partner_user,
    partnerOrgId: 'org-aaa',
    membershipRole: MembershipRole.partner_owner,
  };
  const partnerMemberA = {
    role: UserRole.partner_user,
    partnerOrgId: 'org-aaa',
    membershipRole: MembershipRole.partner_member,
  };
  const partnerOwnerB = {
    role: UserRole.partner_user,
    partnerOrgId: 'org-bbb',
    membershipRole: MembershipRole.partner_owner,
  };

  it('enforces Channel Admin route boundaries', () => {
    expect(canAccessChannelAdmin(adminUser)).toBe(true);
    expect(canAccessChannelAdmin(partnerOwnerA)).toBe(false);
    expect(canAccessChannelAdmin(partnerMemberA)).toBe(false);
  });

  it('enforces team management permissions (only owner of that org)', () => {
    expect(canManageTeam(partnerOwnerA, 'org-aaa')).toBe(true);
    expect(canManageTeam(partnerMemberA, 'org-aaa')).toBe(false);
    expect(canManageTeam(partnerOwnerB, 'org-aaa')).toBe(false);
    expect(canManageTeam(adminUser, 'org-aaa')).toBe(true);
  });

  it('enforces tenant isolation on deal viewing', () => {
    expect(canViewDeal(partnerOwnerA, 'org-aaa')).toBe(true);
    expect(canViewDeal(partnerMemberA, 'org-aaa')).toBe(true);
    expect(canViewDeal(partnerOwnerB, 'org-aaa')).toBe(false);
    expect(canViewDeal(adminUser, 'org-aaa')).toBe(true);
  });

  it('forbids partner modifying deals once submitted', () => {
    expect(canModifyDeal(partnerOwnerA, 'org-aaa', DealStatus.draft)).toBe(true);
    expect(canModifyDeal(partnerOwnerA, 'org-aaa', DealStatus.awaiting_approval)).toBe(false);
    expect(canModifyDeal(partnerOwnerA, 'org-aaa', DealStatus.approved)).toBe(false);
  });
});
