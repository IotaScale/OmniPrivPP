import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { ChannelAdminRenewalsClient } from './renewals-client';

export default async function ChannelAdminRenewalsPage() {
  await requireAdminSession();

  const [renewals, partners] = await Promise.all([
    prisma.renewal.findMany({
      include: {
        organization: { select: { id: true, display_name: true } },
      },
      orderBy: { renewal_date: 'asc' },
    }),
    prisma.partnerOrganization.findMany({
      where: { status: 'active' },
      select: { id: true, display_name: true },
      orderBy: { display_name: 'asc' },
    }),
  ]);

  return <ChannelAdminRenewalsClient renewals={renewals} partners={partners} />;
}
