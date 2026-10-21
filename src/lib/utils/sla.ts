/**
 * Calculates deal protection expiration (exactly 90 days from approval).
 */
export function calculateProtectionDates(startDate: Date = new Date()): {
  protectionStartsAt: Date;
  protectionExpiresAt: Date;
} {
  const protectionStartsAt = new Date(startDate);
  const protectionExpiresAt = new Date(startDate);
  protectionExpiresAt.setDate(protectionExpiresAt.getDate() + 90);
  return { protectionStartsAt, protectionExpiresAt };
}

/**
 * Extends existing deal protection by N days (default 30 or 90 days).
 */
export function extendProtection(currentExpiry: Date | null, daysToAdd: number = 90): Date {
  const base = currentExpiry && new Date(currentExpiry) > new Date()
    ? new Date(currentExpiry)
    : new Date();
  base.setDate(base.getDate() + daysToAdd);
  return base;
}

/**
 * Checks if deal protection is currently active.
 */
export function isProtectionActive(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

/**
 * Calculates lead assignment acceptance deadline (default 7 days).
 */
export function calculateLeadDeadline(startDate: Date = new Date(), days: number = 7): Date {
  const deadline = new Date(startDate);
  deadline.setDate(deadline.getDate() + days);
  return deadline;
}

export interface LeadSlaInfo {
  isBreached: boolean;
  isUrgent: boolean;
  hoursRemaining: number;
  formattedRemaining: string;
}

/**
 * Evaluates SLA status for assigned leads against persisted deadline.
 */
export function evaluateLeadSla(
  deadline: Date,
  settledAt?: Date | null
): LeadSlaInfo {
  const target = settledAt ? new Date(settledAt) : new Date();
  const deadlineTime = new Date(deadline).getTime();
  const diffMs = deadlineTime - target.getTime();
  const hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));

  const isBreached = diffMs < 0;
  // Urgent if less than 48 hours remaining and not yet breached
  const isUrgent = !isBreached && hoursRemaining <= 48;

  let formattedRemaining = '';
  if (isBreached) {
    const overdueHours = Math.abs(hoursRemaining);
    const overdueDays = Math.floor(overdueHours / 24);
    formattedRemaining = overdueDays > 0 ? `${overdueDays}d overdue` : `${overdueHours}h overdue`;
  } else {
    const days = Math.floor(hoursRemaining / 24);
    const remHours = hoursRemaining % 24;
    formattedRemaining = days > 0 ? `${days}d ${remHours}h left` : `${hoursRemaining}h left`;
  }

  return {
    isBreached,
    isUrgent,
    hoursRemaining,
    formattedRemaining,
  };
}
