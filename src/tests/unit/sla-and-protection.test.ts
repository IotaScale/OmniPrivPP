import { describe, it, expect } from 'vitest';
import {
  calculateProtectionDates,
  extendProtection,
  isProtectionActive,
  calculateLeadDeadline,
  evaluateLeadSla,
} from '@/lib/utils/sla';

describe('Deal Protection & Lead SLA Calculations', () => {
  it('calculates exactly 90 days protection window from start date', () => {
    const start = new Date('2026-03-01T12:00:00Z');
    const { protectionStartsAt, protectionExpiresAt } = calculateProtectionDates(start);

    expect(protectionStartsAt.toISOString()).toBe('2026-03-01T12:00:00.000Z');
    // Difference should be 90 days in ms
    const diffDays = Math.round(
      (protectionExpiresAt.getTime() - protectionStartsAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(90);
  });

  it('correctly reports active protection vs expired protection', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 1);

    expect(isProtectionActive(future)).toBe(true);
    expect(isProtectionActive(past)).toBe(false);
    expect(isProtectionActive(null)).toBe(false);
  });

  it('extends protection by specified days from current expiry', () => {
    const current = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10);
    const extended = extendProtection(current, 90);
    const diffDays = Math.round(
      (extended.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(90);
  });

  it('calculates 7-day lead deadline and evaluates active vs breached SLA', () => {
    const assignedDate = new Date('2026-04-10T10:00:00Z');
    const deadline = calculateLeadDeadline(assignedDate, 7);
    expect(deadline.toISOString()).toBe('2026-04-17T10:00:00.000Z');

    // Settled before deadline (not breached)
    const acceptedAt = new Date('2026-04-12T10:00:00Z');
    const sla1 = evaluateLeadSla(deadline, acceptedAt);
    expect(sla1.isBreached).toBe(false);

    // Settled after deadline (breached)
    const lateAt = new Date('2026-04-19T10:00:00Z');
    const sla2 = evaluateLeadSla(deadline, lateAt);
    expect(sla2.isBreached).toBe(true);
    expect(sla2.formattedRemaining).toContain('overdue');
  });
});
