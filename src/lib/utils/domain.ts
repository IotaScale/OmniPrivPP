import { prisma } from '@/lib/db';
import { DealStatus, Prisma } from '@prisma/client';
import {
  CLOSED_WON_BLOCK_DAYS,
  createDealMatcher,
  matchDeals,
  normalizeDomain,
  type DealMatch,
  type MatchCandidate,
  type MatchSubject,
} from '@/lib/utils/deal-matching';

export { normalizeDomain };

/** Upper bound on candidate deals loaded for live matching (most recent first). */
export const MATCH_CANDIDATE_LIMIT = 2000;

const DAY_MS = 24 * 60 * 60 * 1000;

const candidateSelect = {
  id: true,
  public_reference: true,
  partner_organization_id: true,
  customer_legal_name: true,
  customer_domain: true,
  customer_contact_email: true,
  status: true,
  protection_expires_at: true,
  closed_at: true,
  created_at: true,
  organization: { select: { display_name: true } },
} satisfies Prisma.DealRegistrationSelect;

/**
 * Loads deals that can collide with a registration: awaiting approval,
 * approved with active protection, or closed-won in the last 90 days.
 */
export async function loadDealMatchCandidates(
  options: { excludeDealId?: string; now?: Date } = {}
): Promise<MatchCandidate[]> {
  const now = options.now ?? new Date();
  const wonSince = new Date(now.getTime() - CLOSED_WON_BLOCK_DAYS * DAY_MS);

  const rows = await prisma.dealRegistration.findMany({
    where: {
      id: options.excludeDealId ? { not: options.excludeDealId } : undefined,
      OR: [
        { status: DealStatus.awaiting_approval },
        {
          status: DealStatus.approved,
          OR: [{ protection_expires_at: null }, { protection_expires_at: { gt: now } }],
        },
        { status: DealStatus.closed_won, closed_at: { gte: wonSince } },
      ],
    },
    select: candidateSelect,
    orderBy: { created_at: 'desc' },
    take: MATCH_CANDIDATE_LIMIT,
  });

  return rows.map(({ organization, ...row }) => ({
    ...row,
    partner_organization_name: organization.display_name,
  }));
}

/**
 * Live duplicate / conflict matches for a stored deal or an unsaved submission.
 * Reads only; never writes.
 */
export async function findDealMatches(
  dealOrInput: MatchSubject,
  options: { excludeDealId?: string; now?: Date } = {}
): Promise<DealMatch[]> {
  const now = options.now ?? new Date();
  const excludeDealId = options.excludeDealId ?? dealOrInput.id ?? undefined;
  const candidates = await loadDealMatchCandidates({ excludeDealId, now });
  return matchDeals(dealOrInput, candidates, { now });
}

/**
 * Live matches for many deals at once (one candidate query), keyed by deal id.
 */
export async function findMatchesForDeals(
  deals: Array<MatchSubject & { id: string }>,
  options: { now?: Date } = {}
): Promise<Record<string, DealMatch[]>> {
  const result: Record<string, DealMatch[]> = {};
  if (deals.length === 0) return result;

  const now = options.now ?? new Date();
  const matcher = createDealMatcher(await loadDealMatchCandidates({ now }), { now });
  for (const deal of deals) {
    result[deal.id] = matcher(deal);
  }
  return result;
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
 * Exact-domain conflict check (kept for existing callers): another deal with
 * the same normalized domain that is awaiting approval, approved with active
 * protection, or closed-won in the last 90 days.
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

  const matches = await findDealMatches(
    { customer_legal_name: '', customer_domain: normalized, partner_organization_id: currentPartnerOrgId },
    { excludeDealId }
  );
  const sameDomain = matches
    .filter((m) => m.reasons.includes('same_domain'))
    .sort((a, b) => new Date(b.candidate.created_at).getTime() - new Date(a.candidate.created_at).getTime());

  if (sameDomain.length === 0) {
    return { hasConflict: false };
  }

  const match = sameDomain[0].candidate;
  const isSamePartner = match.partner_organization_id === currentPartnerOrgId;

  let reason: string;
  if (match.status === DealStatus.awaiting_approval) {
    reason = isSamePartner
      ? `Your company already has a pending deal registration (${match.public_reference}) awaiting review for domain ${normalized}.`
      : `Another partner submitted a deal registration (${match.public_reference}) currently awaiting OmniPriv Channel review for domain ${normalized}.`;
  } else {
    const expiryStr = match.protection_expires_at
      ? new Date(match.protection_expires_at).toISOString().split('T')[0]
      : 'indefinite';
    reason = isSamePartner
      ? `Your company already has an approved, protected deal (${match.public_reference}) for domain ${normalized} valid until ${expiryStr}.`
      : `Active deal protection is currently held for domain ${normalized} until ${expiryStr} under reference ${match.public_reference}.`;
  }

  return {
    hasConflict: true,
    reason,
    conflictingDealId: match.id,
    conflictingReference: match.public_reference,
    conflictingPartnerOrgId: match.partner_organization_id,
    conflictingPartnerOrgName: match.partner_organization_name ?? undefined,
    isSamePartner,
  };
}
