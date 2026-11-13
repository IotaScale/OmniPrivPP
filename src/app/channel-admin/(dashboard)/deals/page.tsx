import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { DealStatus, Prisma } from '@prisma/client';
import { ChannelAdminDealsTable, ConflictingDealSummary } from './deals-table';
import { FileCheck2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ChannelAdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; status?: string; q?: string }>;
}) {
  await requireAdminSession();
  const { id: selectedId, status: filterStatus, q: query } = await searchParams;

  const where: Prisma.DealRegistrationWhereInput = {};

  if (filterStatus === 'conflict') {
    where.conflict_detected = true;
  } else if (filterStatus && Object.values(DealStatus).includes(filterStatus as DealStatus)) {
    where.status = filterStatus as DealStatus;
  }

  if (query && query.trim()) {
    const s = query.trim();
    where.OR = [
      { customer_legal_name: { contains: s, mode: 'insensitive' } },
      { customer_domain: { contains: s, mode: 'insensitive' } },
      { public_reference: { contains: s, mode: 'insensitive' } },
      { organization: { display_name: { contains: s, mode: 'insensitive' } } },
    ];
  }

  const deals = await prisma.dealRegistration.findMany({
    where,
    include: {
      organization: { select: { id: true, display_name: true, tier: true } },
      submitted_by: { select: { full_name: true, email: true } },
      status_history: { orderBy: { created_at: 'desc' } },
    },
    orderBy: [
      { status: 'asc' }, // awaiting_approval comes first
      { conflict_detected: 'desc' },
      { created_at: 'desc' },
    ],
  });

  let selectedDeal = null;
  let conflictingDeals: ConflictingDealSummary[] = [];

  if (selectedId) {
    selectedDeal = await prisma.dealRegistration.findUnique({
      where: { id: selectedId },
      include: {
        organization: { select: { id: true, display_name: true, tier: true } },
        submitted_by: { select: { full_name: true, email: true } },
        status_history: { orderBy: { created_at: 'desc' } },
      },
    });

    if (selectedDeal) {
      conflictingDeals = await prisma.dealRegistration.findMany({
        where: {
          customer_domain: selectedDeal.customer_domain,
          id: { not: selectedDeal.id },
        },
        include: {
          organization: { select: { display_name: true } },
        },
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <FileCheck2 className="h-6 w-6 text-cyan-400" />
          <span>Channel Deal Approvals & Protection Queue</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review partner opportunity submissions, verify domain exclusivity, resolve conflicts, and grant 90-day protections.
        </p>
      </div>

      <ChannelAdminDealsTable
        deals={deals}
        selectedDeal={selectedDeal}
        conflictingDeals={conflictingDeals}
        currentStatus={filterStatus}
        currentQuery={query}
      />
    </div>
  );
}
