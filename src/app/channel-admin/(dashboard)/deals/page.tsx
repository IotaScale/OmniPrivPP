import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { DealStatus, Prisma } from '@prisma/client';
import { findMatchesForDeals } from '@/lib/utils/domain';
import { toMatchView, type DealMatchView } from '@/lib/utils/deal-matching';
import { ChannelAdminDealsTable } from './deals-table';
import { FileCheck2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

/** Statuses where duplicates / conflicts still matter for a review decision. */
const MATCHABLE_STATUSES: DealStatus[] = [DealStatus.awaiting_approval, DealStatus.approved];

const dealInclude = {
  organization: { select: { id: true, display_name: true, tier: true } },
  submitted_by: { select: { full_name: true, email: true } },
  status_history: { orderBy: { created_at: 'desc' } },
} satisfies Prisma.DealRegistrationInclude;

export default async function ChannelAdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; status?: string; q?: string }>;
}) {
  await requireAdminSession();
  const { id: selectedId, status: rawStatus, q: query } = await searchParams;
  // `conflict` is the legacy name of the attention filter (stored flag only).
  const filterStatus = rawStatus === 'conflict' ? 'attention' : rawStatus;
  const needsAttention = filterStatus === 'attention';

  const where: Prisma.DealRegistrationWhereInput = {};

  if (needsAttention) {
    where.status = { in: MATCHABLE_STATUSES };
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

  const [listedDeals, selectedDeal] = await Promise.all([
    prisma.dealRegistration.findMany({
      where,
      include: dealInclude,
      orderBy: [
        { status: 'asc' }, // awaiting_approval comes first
        { conflict_detected: 'desc' },
        { created_at: 'desc' },
      ],
    }),
    selectedId
      ? prisma.dealRegistration.findUnique({ where: { id: selectedId }, include: dealInclude })
      : Promise.resolve(null),
  ]);

  // Live duplicate / conflict matching (one candidate query for the whole page).
  const toMatch = listedDeals.filter((d) => MATCHABLE_STATUSES.includes(d.status));
  if (selectedDeal && !toMatch.some((d) => d.id === selectedDeal.id)) {
    toMatch.push(selectedDeal);
  }
  const rawMatches = await findMatchesForDeals(toMatch);
  const matchesByDeal: Record<string, DealMatchView[]> = {};
  for (const [dealId, matches] of Object.entries(rawMatches)) {
    if (matches.length > 0) matchesByDeal[dealId] = matches.map(toMatchView);
  }

  const deals = needsAttention ? listedDeals.filter((d) => matchesByDeal[d.id]) : listedDeals;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <FileCheck2 className="h-6 w-6 text-cyan-400" />
          <span>Channel Deal Approvals & Protection Queue</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review partner opportunity submissions, check live duplicate and conflict matches, and grant 90-day protections.
        </p>
      </div>

      <ChannelAdminDealsTable
        key={selectedDeal?.id ?? 'none'}
        deals={deals}
        selectedDeal={selectedDeal}
        matchesByDeal={matchesByDeal}
        currentStatus={filterStatus}
        currentQuery={query}
      />
    </div>
  );
}
