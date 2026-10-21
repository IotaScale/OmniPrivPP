import { describe, it, expect } from 'vitest';
import { normalizeDomain } from '@/lib/utils/domain';

describe('Domain Normalization', () => {
  it('strips https and trailing slash', () => {
    expect(normalizeDomain('https://example.com/')).toBe('example.com');
  });

  it('strips http and deep path with query parameters', () => {
    expect(normalizeDomain('http://cyber-corp.org/portal/login?ref=123#hash')).toBe('cyber-corp.org');
  });

  it('strips leading www and converts to lowercase', () => {
    expect(normalizeDomain('HTTPS://WWW.ACME-HOLDINGS.CO.UK/')).toBe('acme-holdings.co.uk');
  });

  it('handles email-style input by extracting domain', () => {
    expect(normalizeDomain('admin@enterprise.de')).toBe('enterprise.de');
  });

  it('strips port numbers from localhost or domains', () => {
    expect(normalizeDomain('secure-bank.io:8443/api')).toBe('secure-bank.io');
  });

  it('handles edge cases with extra whitespace and dots', () => {
    expect(normalizeDomain('  www.fintech.ch...  ')).toBe('fintech.ch');
  });
});
