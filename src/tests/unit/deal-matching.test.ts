import { describe, it, expect } from 'vitest';
import {
  businessEmailDomain,
  companyNamesMatch,
  holdsActiveClaim,
  matchDeals,
  matchSeverity,
  normalizeCompanyName,
  registrableDomain,
  summarizeMatches,
  type MatchCandidate,
  type MatchSubject,
} from '@/lib/utils/deal-matching';

const NOW = new Date('2026-11-13T12:00:00Z');
const daysFromNow = (d: number) => new Date(NOW.getTime() + d * 24 * 60 * 60 * 1000);

function candidate(overrides: Partial<MatchCandidate> = {}): MatchCandidate {
  return {
    id: 'cand-1',
    public_reference: 'OPR-2026-000001',
    partner_organization_id: 'org-b',
    partner_organization_name: 'Nexus Security',
    customer_legal_name: 'Unrelated Customer Ltd',
    customer_domain: 'unrelated.example',
    customer_contact_email: 'buyer@unrelated.example',
    status: 'awaiting_approval',
    protection_expires_at: null,
    closed_at: null,
    created_at: daysFromNow(-10),
    ...overrides,
  };
}

const subject: MatchSubject = {
  id: 'subject',
  customer_legal_name: 'Acme Corporation',
  customer_domain: 'acme.com',
  customer_contact_email: 'cio@acme.com',
  partner_organization_id: 'org-a',
};

describe('registrableDomain', () => {
  it('reduces subdomains to the base domain', () => {
    expect(registrableDomain('eu.acme.com')).toBe('acme.com');
    expect(registrableDomain('https://www.portal.eu.acme.com/x')).toBe('acme.com');
    expect(registrableDomain('acme.com')).toBe('acme.com');
  });

  it('keeps the label before common two-part public suffixes', () => {
    expect(registrableDomain('shop.acme.co.uk')).toBe('acme.co.uk');
    expect(registrableDomain('acme.co.uk')).toBe('acme.co.uk');
    expect(registrableDomain('bank.com.au')).toBe('bank.com.au');
    expect(registrableDomain('co.uk')).toBe('');
    expect(registrableDomain('localhost')).toBe('');
  });
});

describe('company name normalization', () => {
  it('strips punctuation and legal suffixes', () => {
    expect(normalizeCompanyName('Acme, Inc.')).toBe('acme');
    expect(normalizeCompanyName('ACME Holdings Ltd')).toBe('acme');
    expect(normalizeCompanyName('Acme S.A.')).toBe('acme');
    expect(normalizeCompanyName('The Acme Group')).toBe('acme');
    expect(normalizeCompanyName('Müller GmbH')).toBe('muller');
  });

  it('matches equal names after stripping and contained names of 5+ chars', () => {
    expect(companyNamesMatch('Acme Corporation', 'ACME Corp.')).toBe(true);
    expect(companyNamesMatch('Standard Chartered', 'Standard Chartered Bank PLC')).toBe(true);
    expect(companyNamesMatch('Omni Tech', 'OmniTech LLC')).toBe(true);
  });

  it('does not match short contained names or partial words', () => {
    expect(companyNamesMatch('Acme', 'Acme Industries')).toBe(false);
    expect(companyNamesMatch('Secure Bank', 'Securebankers Union')).toBe(false);
    expect(companyNamesMatch('Globex', 'Initech')).toBe(false);
  });
});

describe('businessEmailDomain', () => {
  it('ignores free mail providers', () => {
    expect(businessEmailDomain('someone@gmail.com')).toBe('');
    expect(businessEmailDomain('someone@Outlook.com')).toBe('');
    expect(businessEmailDomain('someone@proton.me')).toBe('');
    expect(businessEmailDomain('cio@acme.com')).toBe('acme.com');
    expect(businessEmailDomain(null)).toBe('');
  });
});

describe('matchDeals', () => {
  it('flags the same normalized domain', () => {
    const [m] = matchDeals(subject, [candidate({ customer_domain: 'acme.com' })], { now: NOW });
    expect(m.reasons).toContain('same_domain');
    expect(m.kind).toBe('conflict');
    expect(m.blocking).toBe(false);
  });

  it('flags subdomains of the same base as related_domain', () => {
    const [m] = matchDeals(subject, [candidate({ customer_domain: 'eu.acme.com' })], { now: NOW });
    expect(m.reasons).toEqual(['related_domain']);
  });

  it('flags related domains under a co.uk suffix but not unrelated co.uk domains', () => {
    const uk: MatchSubject = {
      ...subject,
      customer_legal_name: 'Zeta',
      customer_domain: 'acme.co.uk',
      customer_contact_email: null,
    };
    expect(matchDeals(uk, [candidate({ customer_domain: 'shop.acme.co.uk' })], { now: NOW })[0].reasons).toEqual([
      'related_domain',
    ]);
    expect(matchDeals(uk, [candidate({ customer_domain: 'other.co.uk' })], { now: NOW })).toHaveLength(0);
  });

  it('flags similar company names on different domains', () => {
    const [m] = matchDeals(
      subject,
      [candidate({ customer_legal_name: 'ACME Corp.', customer_domain: 'acme-global.net' })],
      { now: NOW }
    );
    expect(m.reasons).toEqual(['similar_name']);
  });

  it('flags a contact email domain equal to the other deal customer domain', () => {
    const s: MatchSubject = {
      ...subject,
      customer_legal_name: 'Holdco',
      customer_domain: 'holdco.io',
      customer_contact_email: 'it@acme.com',
    };
    const [m] = matchDeals(
      s,
      [candidate({ customer_domain: 'acme.com', customer_legal_name: 'Something Else' })],
      { now: NOW }
    );
    expect(m.reasons).toEqual(['contact_domain']);
  });

  it('ignores free mail contact domains', () => {
    const s: MatchSubject = {
      ...subject,
      customer_legal_name: 'Holdco',
      customer_domain: 'holdco.io',
      customer_contact_email: 'it@gmail.com',
    };
    const c = candidate({
      customer_domain: 'gmail.com',
      customer_legal_name: 'Something Else',
      customer_contact_email: 'x@gmail.com',
    });
    expect(matchDeals(s, [c], { now: NOW })).toHaveLength(0);
  });

  it('classifies same-partner matches as duplicates and other partners as conflicts', () => {
    const matches = matchDeals(
      subject,
      [
        candidate({ id: 'dup', partner_organization_id: 'org-a', customer_domain: 'acme.com' }),
        candidate({ id: 'conf', partner_organization_id: 'org-b', customer_domain: 'acme.com' }),
      ],
      { now: NOW }
    );
    expect(matches.find((m) => m.candidate.id === 'dup')?.kind).toBe('duplicate');
    expect(matches.find((m) => m.candidate.id === 'conf')?.kind).toBe('conflict');
    // Conflicts sort before duplicates.
    expect(matches[0].candidate.id).toBe('conf');
    expect(matchSeverity(matches)).toBe('conflict');
    expect(matchSeverity(matches.filter((m) => m.kind === 'duplicate'))).toBe('duplicate');
  });

  it('marks approved deals with active protection on the same/related domain as blocking', () => {
    const protectedDeal = candidate({
      status: 'approved',
      customer_domain: 'eu.acme.com',
      protection_expires_at: daysFromNow(30),
    });
    const expired = candidate({
      id: 'old',
      status: 'approved',
      customer_domain: 'acme.com',
      protection_expires_at: daysFromNow(-1),
    });
    const matches = matchDeals(subject, [expired, protectedDeal], { now: NOW });
    expect(matches[0].candidate.id).toBe('cand-1');
    expect(matches[0].blocking).toBe(true);
    expect(matches.find((m) => m.candidate.id === 'old')?.blocking).toBe(false);
    expect(matchSeverity(matches)).toBe('blocked');
  });

  it('marks recent closed-won deals as blocking but not old ones', () => {
    const recent = candidate({ id: 'won', status: 'closed_won', customer_domain: 'acme.com', closed_at: daysFromNow(-30) });
    const old = candidate({ id: 'won-old', status: 'closed_won', customer_domain: 'acme.com', closed_at: daysFromNow(-120) });
    const matches = matchDeals(subject, [recent, old], { now: NOW });
    expect(matches.find((m) => m.candidate.id === 'won')?.blocking).toBe(true);
    expect(matches.find((m) => m.candidate.id === 'won-old')?.blocking).toBe(false);
  });

  it('does not block on a name-only match with a protected deal', () => {
    const c = candidate({
      status: 'approved',
      customer_legal_name: 'Acme Corp',
      customer_domain: 'acme-labs.org',
      protection_expires_at: daysFromNow(30),
    });
    const [m] = matchDeals(subject, [c], { now: NOW });
    expect(m.reasons).toEqual(['similar_name']);
    expect(m.blocking).toBe(false);
  });

  it('skips the deal itself and returns nothing for unrelated deals', () => {
    expect(matchDeals(subject, [candidate({ id: 'subject', customer_domain: 'acme.com' })], { now: NOW })).toHaveLength(0);
    expect(matchDeals(subject, [candidate()], { now: NOW })).toHaveLength(0);
    expect(matchSeverity([])).toBeNull();
  });

  it('summarizes matches for the stored conflict reason', () => {
    const matches = matchDeals(
      subject,
      [
        candidate({
          id: 'dup',
          public_reference: 'OPR-2026-000002',
          partner_organization_id: 'org-a',
          customer_domain: 'acme.com',
        }),
        candidate({ id: 'conf', public_reference: 'OPR-2026-000003', customer_domain: 'eu.acme.com' }),
      ],
      { now: NOW }
    );
    expect(summarizeMatches(matches)).toBe(
      'Conflicts with OPR-2026-000003 held by Nexus Security (related domain); Possible duplicate of OPR-2026-000002 (same partner, same domain).'
    );
    expect(summarizeMatches([])).toBeNull();
    expect(holdsActiveClaim({ status: 'approved', protection_expires_at: null, closed_at: null }, NOW)).toBe(true);
  });
});
