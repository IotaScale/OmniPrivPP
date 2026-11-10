import { describe, it, expect } from 'vitest';
import {
  isValidOmniPriveOrgId,
  validateLicenseGenerationInput,
  computeLicenseExpiry,
  calculateLicenseTimeRemaining,
  generatePpLicenseKeyFormat,
} from '@/lib/utils/license';

describe('PP License Validation & Time Calculations', () => {
  it('validates OmniPrive Org IDs (UUID v4 and ORG-XXXX formats)', () => {
    expect(isValidOmniPriveOrgId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidOmniPriveOrgId('ORG-1001')).toBe(true);
    expect(isValidOmniPriveOrgId('')).toBe(false);
    expect(isValidOmniPriveOrgId('   ')).toBe(false);
    expect(isValidOmniPriveOrgId('ab')).toBe(false);
    expect(isValidOmniPriveOrgId('bad space id')).toBe(false);
  });

  it('validates license generation input fields and limits', () => {
    const valid = validateLicenseGenerationInput({
      orgId: '  550e8400-e29b-41d4-a716-446655440000  ',
      customerName: 'Acme Corp',
      durationValue: 1,
      durationUnit: 'years',
      maxAssets: 100,
      maxUsers: 25,
    });
    expect(valid.valid).toBe(true);

    const badOrg = validateLicenseGenerationInput({
      orgId: 'x',
      durationValue: 10,
      durationUnit: 'days',
    });
    expect(badOrg.valid).toBe(false);
    expect(badOrg.error).toMatch(/Org ID/i);

    const badDuration = validateLicenseGenerationInput({
      orgId: 'ORG-1001',
      durationValue: 0,
      durationUnit: 'days',
    });
    expect(badDuration.valid).toBe(false);
    expect(badDuration.error).toMatch(/Duration/i);
  });

  it('generates LIC-XXXXXX-XXXXXX-XXXXXX formatted keys', () => {
    const key = generatePpLicenseKeyFormat();
    expect(key).toMatch(/^LIC-[0-9A-F]{6}-[0-9A-F]{6}-[0-9A-F]{6}$/);
  });

  it('computes license expiry and remaining days/seconds accurately', () => {
    const start = new Date('2026-11-11T00:00:00.000Z');
    const exp = computeLicenseExpiry(start, 60, 'days');
    expect(exp.toISOString()).toBe('2027-01-10T00:00:00.000Z');

    const remaining = calculateLicenseTimeRemaining(exp, start);
    expect(remaining.expired).toBe(false);
    expect(remaining.remainingDays).toBe(60);
    expect(remaining.remainingSeconds).toBe(5184000);
  });
});

