import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { ChannelAdminPartnersClient } from './partners-client';

export const dynamic = 'force-dynamic';

export default async function ChannelAdminPartnersPage() {
  await requireAdminSession();

  const partners = await prisma.partnerOrganization.findMany({
    include: {
      memberships: {
        include: {
          user: {
            select: {
              full_name: true,
              email: true,
              role: true,
              _count: { select: { memberships: true } },
            },
          },
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
          renewals: true,
          commercial_requests: true,
          support_tickets: true,
          product_licenses: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return <ChannelAdminPartnersClient partners={partners} />;
}
