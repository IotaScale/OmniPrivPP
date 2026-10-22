import React from 'react';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
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

  return (
    <TeamManagementClient
      members={members}
      currentUserId={session.userId}
      isOwner={session.membershipRole === 'partner_owner'}
    />
  );
}
