import React from 'react';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { findPendingInviteUserIds } from '@/lib/auth/password-flows';
import { TeamManagementClient } from './team-client';

export const dynamic = 'force-dynamic';

export default async function PartnerTeamPage() {
  const session = await requirePartnerSession();
  const orgId = session.partnerOrgId!;

  const members = await prisma.partnerMembership.findMany({
    where: { partner_organization_id: orgId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          full_name: true,
          is_active: true,
        },
      },
    },
    orderBy: { joined_at: 'asc' },
  });

  const isOwner = session.membershipRole === 'partner_owner';
  // Members who were invited but have never set a password (owners only see this).
  const pending = isOwner
    ? await findPendingInviteUserIds(
        orgId,
        members.map((m) => m.user.id)
      )
    : new Set<string>();

  return (
    <TeamManagementClient
      members={members}
      currentUserId={session.userId}
      isOwner={isOwner}
      pendingInviteUserIds={[...pending]}
    />
  );
}
