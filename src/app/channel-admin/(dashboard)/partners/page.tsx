import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { ChannelAdminPartnersClient } from './partners-client';

export default async function ChannelAdminPartnersPage() {
  await requireAdminSession();

  const partners = await prisma.partnerOrganization.findMany({
    include: {
      memberships: {
        include: {
          user: { select: { full_name: true, email: true } },
        },
      },
      deals: {
        select: { estimated_deal_value: true, status: true },
      },
      _count: {
        select: {
          memberships: true,
          deals: true,
          lead_assignments: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return <ChannelAdminPartnersClient partners={partners} />;
}
