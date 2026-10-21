import { prisma } from '@/lib/db';
import { DealStatus } from '@prisma/client';

/**
 * Normalizes a customer domain string for uniform storage and conflict comparison.
 * - Strips protocols (http, https)
 * - Strips trailing paths, queries, fragments, ports
 * - Strips leading 'www.'
 * - Converts to lowercase and trims
 */
export function normalizeDomain(rawInput: string): string {
  if (!rawInput) return '';

  let cleaned = rawInput.trim().toLowerCase();

  // Strip protocol
  cleaned = cleaned.replace(/^[a-z]+:\/\//i, '');

  // Strip userinfo if present (e.g., user@domain)
  if (cleaned.includes('@') && !cleaned.includes('/')) {
    cleaned = cleaned.split('@').pop() || cleaned;
  }

  // Strip path, query params, fragments
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split('?')[0];
  cleaned = cleaned.split('#')[0];

  // Strip port
  cleaned = cleaned.split(':')[0];

  // Strip leading www.
  cleaned = cleaned.replace(/^www\d?\./, '');

  // Strip trailing dots
  cleaned = cleaned.replace(/\.+$/, '');

  return cleaned.trim();
}

export interface DomainConflictResult {
  hasConflict: boolean;
  reason?: string;
  conflictingDealId?: string;
  conflictingReference?: string;
  conflictingPartnerOrgId?: string;
  conflictingPartnerOrgName?: string;
  isSamePartner?: boolean;
}

/**
 * Detects domain conflict across active and protected deals in PostgreSQL.
 * A conflict exists if another deal registration has the same normalized domain and:
 * - is awaiting approval, OR
 * - is approved and its 90-day protection period has not expired.
 */
export async function detectDomainConflict(
  domain: string,
  currentPartnerOrgId: string,
  excludeDealId?: string
): Promise<DomainConflictResult> {
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    return { hasConflict: false };
  }

  const now = new Date();

  const conflictingDeals = await prisma.dealRegistration.findMany({
    where: {
      customer_domain: normalized,
      id: excludeDealId ? { not: excludeDealId } : undefined,
      OR: [
        { status: DealStatus.awaiting_approval },
        {
          status: DealStatus.approved,
          OR: [
            { protection_expires_at: null },
            { protection_expires_at: { gt: now } },
          ],
        },
      ],
    },
    include: {
      organization: {
        select: {
          id: true,
          display_name: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (conflictingDeals.length === 0) {
    return { hasConflict: false };
  }

  const match = conflictingDeals[0];
  const isSamePartner = match.partner_organization_id === currentPartnerOrgId;

  let reason = '';
  if (match.status === DealStatus.approved) {
    const expiryStr = match.protection_expires_at
      ? match.protection_expires_at.toISOString().split('T')[0]
      : 'indefinite';
    reason = isSamePartner
      ? `Your company already has an approved, protected deal (${match.public_reference}) for domain ${normalized} valid until ${expiryStr}.`
      : `Active 90-day deal protection is currently held for domain ${normalized} until ${expiryStr} under reference ${match.public_reference}.`;
  } else {
    reason = isSamePartner
      ? `Your company already has a pending deal registration (${match.public_reference}) awaiting review for domain ${normalized}.`
      : `Another partner submitted a deal registration (${match.public_reference}) currently awaiting OmniPriv Channel review for domain ${normalized}.`;
  }

  return {
    hasConflict: true,
    reason,
    conflictingDealId: match.id,
    conflictingReference: match.public_reference,
    conflictingPartnerOrgId: match.partner_organization_id,
    conflictingPartnerOrgName: match.organization.display_name,
    isSamePartner,
  };
}
