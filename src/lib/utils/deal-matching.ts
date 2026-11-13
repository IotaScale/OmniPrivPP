/**
 * Pure deal-registration duplicate / conflict matcher.
 *
 * No Prisma or Next imports so it is unit-testable and can run anywhere.
 * The server helper `findDealMatches` (src/lib/utils/domain.ts) loads the
 * candidate deals and delegates to `matchDeals`.
 */

export type DealMatchReason = 'same_domain' | 'related_domain' | 'similar_name' | 'contact_domain';

/** `duplicate` = same partner organization, `conflict` = a different partner. */
export type DealMatchKind = 'duplicate' | 'conflict';

/** The deal being checked (a stored deal or a submission that is not saved yet). */
export interface MatchSubject {
  id?: string | null;
  customer_legal_name: string;
  customer_domain: string;
  customer_contact_email?: string | null;
  partner_organization_id: string;
}

/** An existing deal the subject is compared against. */
export interface MatchCandidate extends MatchSubject {
  id: string;
  public_reference: string;
  status: string;
  partner_organization_name?: string | null;
  protection_expires_at?: Date | string | null;
  closed_at?: Date | string | null;
  created_at: Date | string;
}

export interface DealMatch {
  candidate: MatchCandidate;
  reasons: DealMatchReason[];
  kind: DealMatchKind;
  /** The other deal holds active protection (or was won recently) on the same/related domain. */
  blocking: boolean;
}

/** Closed-won deals keep blocking new registrations for this many days. */
export const CLOSED_WON_BLOCK_DAYS = 90;

/** Shorter company name must have at least this many characters for a containment match. */
const MIN_CONTAINED_NAME_LENGTH = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

export const MATCH_REASON_LABELS: Record<DealMatchReason, string> = {
  same_domain: 'same domain',
  related_domain: 'related domain',
  similar_name: 'similar company name',
  contact_domain: 'contact email domain',
};

/** Reasons that make an approved / recently won deal block approval. */
const BLOCKING_REASONS: ReadonlySet<DealMatchReason> = new Set(['same_domain', 'related_domain']);

/**
 * Common two-label public suffixes (naive list; not the full Public Suffix List).
 * `eu.acme.co.uk` -> registrable base `acme.co.uk`.
 */
const TWO_PART_PUBLIC_SUFFIXES: ReadonlySet<string> = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'ltd.uk', 'plc.uk', 'me.uk', 'net.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
  'co.nz', 'org.nz', 'net.nz',
  'co.in', 'net.in', 'org.in', 'firm.in', 'gen.in', 'ind.in', 'ac.in', 'gov.in',
  'com.br', 'net.br', 'org.br', 'gov.br',
  'co.za', 'org.za', 'net.za',
  'co.jp', 'ne.jp', 'or.jp', 'ac.jp',
  'co.kr', 'or.kr',
  'co.id', 'co.il', 'co.th', 'co.ke',
  'com.mx', 'com.ar', 'com.co', 'com.pe', 'com.cn', 'com.hk', 'com.tw',
  'com.sg', 'com.my', 'com.ph', 'com.pk', 'com.tr', 'com.sa', 'com.eg', 'com.ng', 'com.vn',
]);

/** Free / consumer mailbox providers: a contact address there says nothing about the customer. */
const FREE_MAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com', 'googlemail.com',
  'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'msn.com',
  'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com',
  'icloud.com', 'me.com', 'mac.com',
  'proton.me', 'protonmail.com', 'pm.me',
  'aol.com', 'gmx.com', 'gmx.net', 'mail.com', 'yandex.com', 'zoho.com',
]);

/** Legal-form words stripped from the end of company names before comparison. */
const LEGAL_SUFFIXES: ReadonlySet<string> = new Set([
  'inc', 'incorporated', 'llc', 'llp', 'ltd', 'limited', 'corp', 'corporation', 'co', 'company',
  'gmbh', 'plc', 'sa', 'ag', 'pty', 'bv', 'srl', 'sas', 'holdings', 'holding', 'group',
]);

/**
 * Normalizes a customer domain string for uniform storage and comparison.
 * Strips protocol, userinfo, path/query/fragment, port, leading `www.` and
 * trailing dots; lowercases and trims.
 */
export function normalizeDomain(rawInput: string): string {
  if (!rawInput) return '';

  let cleaned = rawInput.trim().toLowerCase();
  cleaned = cleaned.replace(/^[a-z]+:\/\//i, '');

  // Strip userinfo if present (e.g., user@domain)
  if (cleaned.includes('@') && !cleaned.includes('/')) {
    cleaned = cleaned.split('@').pop() || cleaned;
  }

  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split('?')[0];
  cleaned = cleaned.split('#')[0];
  cleaned = cleaned.split(':')[0];
  cleaned = cleaned.replace(/^www\d?\./, '');
  cleaned = cleaned.replace(/\.+$/, '');

  return cleaned.trim();
}

/**
 * Registrable base domain: the label before the public suffix plus the suffix
 * (`eu.acme.com` -> `acme.com`, `shop.acme.co.uk` -> `acme.co.uk`).
 * Returns '' when the input has no usable base.
 */
export function registrableDomain(domain: string): string {
  const normalized = normalizeDomain(domain);
  if (!normalized || !normalized.includes('.')) return '';
  const labels = normalized.split('.').filter(Boolean);
  if (labels.length < 2) return '';
  const lastTwo = labels.slice(-2).join('.');
  if (TWO_PART_PUBLIC_SUFFIXES.has(lastTwo)) {
    return labels.length >= 3 ? labels.slice(-3).join('.') : '';
  }
  return lastTwo;
}

/** Domain part of an email address, or '' if missing / a free-mail provider. */
export function businessEmailDomain(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '';
  const domain = normalizeDomain(email.split('@').pop() || '');
  if (!domain || FREE_MAIL_DOMAINS.has(domain)) return '';
  return domain;
}

export function isFreeMailDomain(domain: string): boolean {
  return FREE_MAIL_DOMAINS.has(normalizeDomain(domain));
}

/**
 * Normalizes a company name for comparison: lowercase, `&` -> `and`,
 * punctuation removed, and trailing legal suffixes (Inc, Ltd, GmbH, Holdings,
 * Group, ...) stripped. Returns space-separated tokens.
 */
export function normalizeCompanyName(name: string): string {
  if (!name) return '';
  const cleaned = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    // Join dotted abbreviations first so "S.A." -> "sa", "Inc." -> "inc".
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const tokens = cleaned.split(' ').filter(Boolean);
  while (tokens.length > 1 && LEGAL_SUFFIXES.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  if (tokens.length > 1 && tokens[0] === 'the') tokens.shift();
  return tokens.join(' ');
}

function containsTokenSequence(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false;
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

/** True when two normalized company names are equal or one contains the other (shorter >= 5 chars). */
export function companyNamesMatch(a: string, b: string): boolean {
  const na = normalizeCompanyName(a);
  const nb = normalizeCompanyName(b);
  if (!na || !nb) return false;

  const compactA = na.replace(/ /g, '');
  const compactB = nb.replace(/ /g, '');
  if (compactA === compactB) return true;

  const [shorter, longer] = compactA.length <= compactB.length ? [na, nb] : [nb, na];
  if (shorter.replace(/ /g, '').length < MIN_CONTAINED_NAME_LENGTH) return false;
  return containsTokenSequence(longer.split(' '), shorter.split(' '));
}

function toTime(value: Date | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Whether a candidate deal currently holds the customer: approved with
 * protection that has not expired (no expiry = indefinite), or closed-won
 * within the last 90 days.
 */
export function holdsActiveClaim(
  candidate: Pick<MatchCandidate, 'status' | 'protection_expires_at' | 'closed_at'>,
  now: Date = new Date()
): boolean {
  if (candidate.status === 'approved') {
    const expires = toTime(candidate.protection_expires_at);
    return expires === null || expires > now.getTime();
  }
  if (candidate.status === 'closed_won') {
    const closed = toTime(candidate.closed_at);
    return closed !== null && closed >= now.getTime() - CLOSED_WON_BLOCK_DAYS * DAY_MS;
  }
  return false;
}

interface PreparedDeal {
  domain: string;
  base: string;
  contactDomain: string;
}

function prepare(deal: MatchSubject): PreparedDeal {
  const domain = normalizeDomain(deal.customer_domain);
  return {
    domain,
    base: registrableDomain(domain),
    contactDomain: businessEmailDomain(deal.customer_contact_email),
  };
}

function reasonsBetween(
  subject: MatchSubject,
  s: PreparedDeal,
  candidate: MatchCandidate,
  c: PreparedDeal
): DealMatchReason[] {
  const reasons: DealMatchReason[] = [];
  const sameDomain = !!s.domain && s.domain === c.domain;

  if (sameDomain) {
    reasons.push('same_domain');
  } else if (s.base && s.base === c.base) {
    reasons.push('related_domain');
  }

  if (companyNamesMatch(subject.customer_legal_name, candidate.customer_legal_name)) {
    reasons.push('similar_name');
  }

  if (
    !sameDomain &&
    ((s.contactDomain && s.contactDomain === c.domain) || (c.contactDomain && c.contactDomain === s.domain))
  ) {
    reasons.push('contact_domain');
  }

  return reasons;
}

const KIND_RANK: Record<DealMatchKind, number> = { conflict: 0, duplicate: 1 };

/**
 * Returns every candidate that looks like the same customer as `subject`,
 * with match reasons, duplicate/conflict classification and blocking flag.
 * Sorted: blocking first, then conflicts before duplicates, then oldest first.
 */
export function matchDeals(
  subject: MatchSubject,
  candidates: MatchCandidate[],
  options: { now?: Date } = {}
): DealMatch[] {
  return createDealMatcher(candidates, options)(subject);
}

/**
 * Prepares candidates once and returns a matcher function; use this when the
 * same candidate set is checked against many deals (admin tables).
 */
export function createDealMatcher(
  candidates: MatchCandidate[],
  options: { now?: Date } = {}
): (subject: MatchSubject) => DealMatch[] {
  const now = options.now ?? new Date();
  const prepared = candidates.map((candidate) => ({
    candidate,
    p: prepare(candidate),
    holdsClaim: holdsActiveClaim(candidate, now),
  }));

  return (subject: MatchSubject) => {
    const s = prepare(subject);
    const matches: DealMatch[] = [];

    for (const { candidate, p, holdsClaim } of prepared) {
      if (subject.id && candidate.id === subject.id) continue;
      const reasons = reasonsBetween(subject, s, candidate, p);
      if (reasons.length === 0) continue;

      matches.push({
        candidate,
        reasons,
        kind: candidate.partner_organization_id === subject.partner_organization_id ? 'duplicate' : 'conflict',
        blocking: holdsClaim && reasons.some((r) => BLOCKING_REASONS.has(r)),
      });
    }

    return matches.sort(
      (a, b) =>
        Number(b.blocking) - Number(a.blocking) ||
        KIND_RANK[a.kind] - KIND_RANK[b.kind] ||
        (toTime(a.candidate.created_at) ?? 0) - (toTime(b.candidate.created_at) ?? 0)
    );
  };
}

export function formatMatchReasons(reasons: DealMatchReason[]): string {
  return reasons.map((r) => MATCH_REASON_LABELS[r]).join(', ');
}

/** One-line admin-facing description of a single match (may name other partners). */
export function describeMatch(match: DealMatch): string {
  const ref = match.candidate.public_reference;
  const why = formatMatchReasons(match.reasons);
  if (match.kind === 'duplicate') {
    return match.blocking
      ? `Duplicate of protected deal ${ref} (same partner, ${why})`
      : `Possible duplicate of ${ref} (same partner, ${why})`;
  }
  const holder = match.candidate.partner_organization_name || 'another partner';
  return match.blocking
    ? `Blocked by protected deal ${ref} held by ${holder} (${why})`
    : `Conflicts with ${ref} held by ${holder} (${why})`;
}

/**
 * Summary stored in `conflict_reason`: the first three matches, plus a count
 * of the rest. Admin-facing only; never rendered to partners.
 */
export function summarizeMatches(matches: DealMatch[], maxListed = 3): string | null {
  if (matches.length === 0) return null;
  const listed = matches.slice(0, maxListed).map(describeMatch);
  const rest = matches.length - listed.length;
  return listed.join('; ') + (rest > 0 ? `; +${rest} more` : '') + '.';
}

/** Worst severity across matches, for row badges. */
export type MatchSeverity = 'blocked' | 'conflict' | 'duplicate' | null;

export function matchSeverity(matches: Pick<DealMatch, 'kind' | 'blocking'>[]): MatchSeverity {
  if (matches.length === 0) return null;
  if (matches.some((m) => m.blocking)) return 'blocked';
  if (matches.some((m) => m.kind === 'conflict')) return 'conflict';
  return 'duplicate';
}

/** Plain, serializable match shape passed from server pages to client components. */
export interface DealMatchView {
  dealId: string;
  reference: string;
  partnerOrgId: string;
  partnerName: string;
  customerName: string;
  customerDomain: string;
  status: string;
  protectionExpiresAt: string | null;
  submittedAt: string;
  reasons: DealMatchReason[];
  kind: DealMatchKind;
  blocking: boolean;
}

function toIso(value: Date | string | null | undefined): string | null {
  const t = toTime(value);
  return t === null ? null : new Date(t).toISOString();
}

export function toMatchView(match: DealMatch): DealMatchView {
  const c = match.candidate;
  return {
    dealId: c.id,
    reference: c.public_reference,
    partnerOrgId: c.partner_organization_id,
    partnerName: c.partner_organization_name || 'Unknown partner',
    customerName: c.customer_legal_name,
    customerDomain: c.customer_domain,
    status: c.status,
    protectionExpiresAt: toIso(c.protection_expires_at),
    submittedAt: toIso(c.created_at) ?? '',
    reasons: match.reasons,
    kind: match.kind,
    blocking: match.blocking,
  };
}
