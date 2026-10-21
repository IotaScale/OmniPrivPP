import { DealStatus, MembershipRole, UserRole } from '@prisma/client';

/**
 * Validates whether a deal status transition is permissible.
 */
export function isValidDealTransition(current: DealStatus, next: DealStatus): boolean {
  if (current === next) return true;

  const validTransitions: Record<DealStatus, DealStatus[]> = {
    [DealStatus.draft]: [DealStatus.awaiting_approval],
    [DealStatus.awaiting_approval]: [DealStatus.approved, DealStatus.declined],
    [DealStatus.approved]: [DealStatus.closed_won, DealStatus.closed_lost, DealStatus.expired],
    [DealStatus.declined]: [DealStatus.draft, DealStatus.awaiting_approval],
    [DealStatus.closed_won]: [],
    [DealStatus.closed_lost]: [],
    [DealStatus.expired]: [DealStatus.awaiting_approval],
  };

  return validTransitions[current]?.includes(next) ?? false;
}

export interface UserContext {
  role: UserRole;
  partnerOrgId?: string | null;
  membershipRole?: MembershipRole | null;
}

/**
 * Checks if user is permitted to perform channel admin operations.
 */
export function canAccessChannelAdmin(user: UserContext): boolean {
  return user.role === UserRole.channel_admin;
}

/**
 * Checks if user can manage organization team members.
 */
export function canManageTeam(user: UserContext, targetOrgId: string): boolean {
  if (user.role === UserRole.channel_admin) return true;
  return (
    user.partnerOrgId === targetOrgId &&
    user.membershipRole === MembershipRole.partner_owner
  );
}

/**
 * Checks if user can view deal details.
 */
export function canViewDeal(user: UserContext, dealPartnerOrgId: string): boolean {
  if (user.role === UserRole.channel_admin) return true;
  return user.partnerOrgId === dealPartnerOrgId;
}

/**
 * Checks if user can modify a deal.
 * Partners can only modify their own deals when they are in 'draft' status.
 * Channel admins can modify during review/approval.
 */
export function canModifyDeal(user: UserContext, dealPartnerOrgId: string, status: DealStatus): boolean {
  if (user.role === UserRole.channel_admin) return true;
  if (user.partnerOrgId !== dealPartnerOrgId) return false;
  return status === DealStatus.draft;
}
