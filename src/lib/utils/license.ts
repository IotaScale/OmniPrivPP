import { randomBytes } from 'node:crypto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ORG_CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]{3,63}$/;

/**
 * Validates an OmniPrive Organization ID pasted into Partner Portal.
 * Accepts standard OmniPrive UUIDs (e.g. `550e8400-e29b-41d4-a716-446655440000`)
 * or structured org codes (e.g. `ORG-1001`).
 */
export function isValidOmniPriveOrgId(raw: string): boolean {
  const trimmed = (raw || '').trim();
  if (!trimmed || trimmed.length < 4 || trimmed.length > 64) {
    return false;
  }
  return UUID_REGEX.test(trimmed) || ORG_CODE_REGEX.test(trimmed);
}

export interface LicenseGenerationValidationInput {
  orgId: string;
  customerName?: string;
  durationValue: number;
  durationUnit: 'days' | 'months' | 'years';
  maxAssets?: number | null;
  maxUsers?: number | null;
}

export function validateLicenseGenerationInput(
  input: LicenseGenerationValidationInput
): { valid: boolean; error?: string } {
  const orgId = (input.orgId || '').trim();
  if (!orgId) {
    return { valid: false, error: 'OmniPrive Organization ID (org_id) is required.' };
  }
  if (!isValidOmniPriveOrgId(orgId)) {
    return {
      valid: false,
      error:
        'Invalid OmniPrive Org ID format. Expected a valid Organization UUID or ORG-XXXX identifier (4–64 chars, no spaces).',
    };
  }

  if (
    typeof input.durationValue !== 'number' ||
    !Number.isInteger(input.durationValue) ||
    input.durationValue <= 0 ||
    input.durationValue > 3650
  ) {
    return {
      valid: false,
      error: 'Duration value must be a positive whole number between 1 and 3650.',
    };
  }

  if (!['days', 'months', 'years'].includes(input.durationUnit)) {
    return {
      valid: false,
      error: 'Duration unit must be days, months, or years.',
    };
  }

  if (
    input.maxAssets !== undefined &&
    input.maxAssets !== null &&
    (!Number.isInteger(input.maxAssets) || input.maxAssets <= 0)
  ) {
    return {
      valid: false,
      error: 'Max Assets limit must be a positive integer or left blank for unlimited.',
    };
  }

  if (
    input.maxUsers !== undefined &&
    input.maxUsers !== null &&
    (!Number.isInteger(input.maxUsers) || input.maxUsers <= 0)
  ) {
    return {
      valid: false,
      error: 'Max Users limit must be a positive integer or left blank for unlimited.',
    };
  }

  return { valid: true };
}

export function generatePpLicenseKeyFormat(): string {
  const seg1 = randomBytes(3).toString('hex').toUpperCase();
  const seg2 = randomBytes(3).toString('hex').toUpperCase();
  const seg3 = randomBytes(3).toString('hex').toUpperCase();
  return `LIC-${seg1}-${seg2}-${seg3}`;
}

export function computeLicenseExpiry(
  from: Date,
  durationValue: number,
  durationUnit: 'days' | 'months' | 'years'
): Date {
  const expiry = new Date(from);
  if (durationUnit === 'days') {
    expiry.setUTCDate(expiry.getUTCDate() + durationValue);
  } else if (durationUnit === 'months') {
    expiry.setUTCMonth(expiry.getUTCMonth() + durationValue);
  } else if (durationUnit === 'years') {
    expiry.setUTCFullYear(expiry.getUTCFullYear() + durationValue);
  }
  return expiry;
}

export function calculateLicenseTimeRemaining(
  expiresAt: Date | string,
  now: Date = new Date()
): {
  expired: boolean;
  remainingDays: number;
  remainingSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  formatted: string;
} {
  const exp = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const diffMs = exp.getTime() - now.getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0) {
    return {
      expired: true,
      remainingDays: 0,
      remainingSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      formatted: 'Expired',
    };
  }

  const remainingSeconds = Math.floor(diffMs / 1000);
  const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const days = Math.floor(remainingSeconds / 86400);
  const hours = Math.floor((remainingSeconds % 86400) / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);

  return {
    expired: false,
    remainingDays,
    remainingSeconds,
    days,
    hours,
    minutes,
    formatted: `${days}d ${hours}h ${minutes}m`,
  };
}

