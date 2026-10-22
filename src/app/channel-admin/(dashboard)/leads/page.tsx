import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { LeadManagementClient } from './lead-management-client';

export const dynamic = 'force-dynamic';

export default async function ChannelAdminLeadsPage() {
  await requireAdminSession();

  const [leads, partners] = await Promise.all([
    prisma.lead.findMany({
      include: {
        assignments: {
          include: {
            organization: { select: { id: true, display_name: true } },
            converted_deal: { select: { id: true, public_reference: true } },
          },
          orderBy: { assigned_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.partnerOrganization.findMany({
      where: { status: 'active' },
      select: { id: true, display_name: true, tier: true },
      orderBy: { display_name: 'asc' },
    }),
  ]);

  return <LeadManagementClient leads={leads} partners={partners} />;
}
