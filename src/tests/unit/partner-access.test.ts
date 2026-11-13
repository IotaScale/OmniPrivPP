import { describe, it, expect } from 'vitest';
import {
  ACCOUNT_STATUS_PATH,
  canSignInWithOrgStatus,
  evaluatePartnerAccess,
  pickSignInMembership,
  type PartnerOrgStatus,
} from '@/lib/auth/partner-access';
import { maskLicenseKey } from '@/lib/utils/license';

describe('Partner workspace access guard', () => {
  it('allows only active organizations with an active user', () => {
    expect(evaluatePartnerAccess({ orgStatus: 'active', userActive: true })).toEqual({ allowed: true });
  });

  it('blocks suspended organizations', () => {
    expect(evaluatePartnerAccess({ orgStatus: 'suspended', userActive: true })).toEqual({
      allowed: false,
      reason: 'suspended',
    });
  });

  it('blocks deactivated users even in an active organization', () => {
    expect(evaluatePartnerAccess({ orgStatus: 'active', userActive: false })).toEqual({
      allowed: false,
      reason: 'user_inactive',
    });
  });

  it('blocks sessions whose membership no longer exists', () => {
    expect(evaluatePartnerAccess(null)).toEqual({ allowed: false, reason: 'no_membership' });
  });

  it('routes blocked partners to the account status page', () => {
    expect(ACCOUNT_STATUS_PATH).toBe('/partner-portal/account-status');
  });
});

describe('Partner sign-in eligibility', () => {
  it('lets only active org members sign in', () => {
    expect(canSignInWithOrgStatus('active')).toBe(true);
    expect(canSignInWithOrgStatus('suspended')).toBe(false);
  });

  const m = (id: string, status: PartnerOrgStatus) => ({ id, organization: { status } });

  it('picks the active organization', () => {
    expect(pickSignInMembership([m('s', 'suspended'), m('a', 'active')])?.id).toBe('a');
  });

  it('returns null when every organization is suspended', () => {
    expect(pickSignInMembership([m('s', 'suspended')])).toBeNull();
    expect(pickSignInMembership([])).toBeNull();
  });
});

describe('License key masking', () => {
  it('keeps only the last 6 characters visible', () => {
    const masked = maskLicenseKey('LIC-1A2B3C-4D5E6F-7A8B9C');
    expect(masked.endsWith('7A8B9C')).toBe(true);
    expect(masked).not.toContain('1A2B3C');
    expect(masked).not.toContain('4D5E6F');
  });

  it('leaves very short keys unchanged and handles empty input', () => {
    expect(maskLicenseKey('ABC')).toBe('ABC');
    expect(maskLicenseKey('')).toBe('');
  });
});
