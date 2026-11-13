import React from 'react';
import Link from 'next/link';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { DealStatus } from '@prisma/client';
import { ShieldAlert, CheckCircle2, XCircle, Copy, Users, ArrowRight, Flag } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { approveDealAction, declineDealAsDuplicateAction } from '@/lib/actions/admin-deals';
import { findMatchesForDeals, MATCH_CANDIDATE_LIMIT } from '@/lib/utils/domain';
import type { DealMatchKind, DealMatchReason } from '@/lib/utils/deal-matching';
import { MatchKindBadge, MatchReasonChips } from '../deals/match-badges';

export const dynamic = 'force-dynamic';

const dealSelect = {
  id: true,
  public_reference: true,
  partner_organization_id: true,
  customer_legal_name: true,
  customer_domain: true,
  customer_contact_email: true,
  status: true,
  estimated_deal_value: true,
  currency: true,
  partner_notes: true,
  protection_expires_at: true,
  closed_at: true,
  created_at: true,
  organization: { select: { display_name: true, tier: true } },
} as const;

interface PairSide {
  id: string;
  public_reference: string;
  customer_legal_name: string;
  customer_domain: string;
  customer_contact_email: string;
  status: DealStatus;
  estimated_deal_value: number | null;
  currency: string;
  partner_notes: string | null;
  protection_expires_at: Date | null;
  closed_at: Date | null;
  created_at: Date;
  organization: { display_name: string; tier: string };
}

interface MatchPair {
  key: string;
  kind: DealMatchKind;
  blocking: boolean;
  reasons: DealMatchReason[];
  /** Earlier registration first. */
  sides: [PairSide, PairSide];
}

export default async function AdminDealConflictsPage() {
  await requireAdminSession();

  const pending = await prisma.dealRegistration.findMany({
    where: { status: DealStatus.awaiting_approval },
    select: dealSelect,
    orderBy: { created_at: 'asc' },
    take: MATCH_CANDIDATE_LIMIT,
  });

  // Live matching for every pending deal (one candidate query).
  const matchesByDeal = await findMatchesForDeals(pending);

  // Build unique deal pairs (A pending, B any candidate status).
  const rawPairs = new Map<string, { a: string; b: string; kind: DealMatchKind; blocking: boolean; reasons: DealMatchReason[] }>();
  const blockedDealIds = new Set<string>();
  for (const deal of pending) {
    for (const m of matchesByDeal[deal.id] ?? []) {
      if (m.blocking) blockedDealIds.add(deal.id);
      const key = [deal.id, m.candidate.id].sort().join(':');
      const existing = rawPairs.get(key);
      if (existing) {
        existing.blocking ||= m.blocking;
        continue;
      }
      rawPairs.set(key, { a: deal.id, b: m.candidate.id, kind: m.kind, blocking: m.blocking, reasons: m.reasons });
    }
  }

  // Load the non-pending side of each pair (protected / recently won deals).
  const pendingById = new Map<string, PairSide>(pending.map((d) => [d.id, d]));
  const missingIds = [...new Set([...rawPairs.values()].map((p) => p.b))].filter((id) => !pendingById.has(id));
  const others = missingIds.length
    ? await prisma.dealRegistration.findMany({ where: { id: { in: missingIds } }, select: dealSelect })
    : [];
  const dealById = new Map<string, PairSide>([...pendingById, ...others.map((d) => [d.id, d] as const)]);

  const pairs: MatchPair[] = [];
  for (const [key, p] of rawPairs) {
    const a = dealById.get(p.a);
    const b = dealById.get(p.b);
    if (!a || !b) continue;
    const sides: [PairSide, PairSide] = a.created_at <= b.created_at ? [a, b] : [b, a];
    pairs.push({ key, kind: p.kind, blocking: p.blocking, reasons: p.reasons, sides });
  }
  pairs.sort(
    (x, y) =>
      Number(y.blocking) - Number(x.blocking) || x.sides[0].created_at.getTime() - y.sides[0].created_at.getTime()
  );

  const conflicts = pairs.filter((p) => p.kind === 'conflict');
  const duplicates = pairs.filter((p) => p.kind === 'duplicate');

  async function handleApprove(formData: FormData): Promise<void> {
    'use server';
    await approveDealAction(formData);
  }

  async function handleDeclineDuplicate(formData: FormData): Promise<void> {
    'use server';
    await declineDealAsDuplicateAction(formData);
  }

  function DealSide({ deal, other, isFirst }: { deal: PairSide; other: PairSide; isFirst: boolean }) {
    const isPending = deal.status === DealStatus.awaiting_approval;
    const isBlocked = blockedDealIds.has(deal.id);
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/channel-admin/deals?id=${deal.id}`}
            className="font-mono text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            {deal.public_reference}
          </Link>
          <StatusBadge status={deal.status} />
          {isFirst && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <Flag className="h-3 w-3" aria-hidden="true" />
              Registered first
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-white break-words">{deal.customer_legal_name}</p>
          <p className="font-mono text-[11px] text-cyan-400 break-all">{deal.customer_domain}</p>
        </div>

        <dl className="grid grid-cols-1 gap-1 text-[11px]">
          <div className="flex flex-wrap gap-x-1">
            <dt className="text-slate-500">Partner:</dt>
            <dd className="text-slate-200 font-medium break-words">
              {deal.organization.display_name}{' '}
              <span className="text-slate-500 font-normal">({deal.organization.tier})</span>
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-1">
            <dt className="text-slate-500">Contact:</dt>
            <dd className="text-slate-300 break-all">{deal.customer_contact_email}</dd>
          </div>
          <div className="flex flex-wrap gap-x-1">
            <dt className="text-slate-500">Submitted:</dt>
            <dd className="font-mono text-slate-300">{deal.created_at.toLocaleString()}</dd>
          </div>
          <div className="flex flex-wrap gap-x-1">
            <dt className="text-slate-500">Value:</dt>
            <dd className="font-mono text-slate-300">
              {deal.estimated_deal_value ? `${deal.currency} ${deal.estimated_deal_value.toLocaleString()}` : '—'}
            </dd>
          </div>
          {deal.status === DealStatus.approved && (
            <div className="flex flex-wrap gap-x-1">
              <dt className="text-slate-500">Protected until:</dt>
              <dd className="font-mono text-emerald-400">
                {deal.protection_expires_at ? deal.protection_expires_at.toLocaleDateString() : 'no expiry'}
              </dd>
            </div>
          )}
          {deal.status === DealStatus.closed_won && deal.closed_at && (
            <div className="flex flex-wrap gap-x-1">
              <dt className="text-slate-500">Won on:</dt>
              <dd className="font-mono text-emerald-400">{deal.closed_at.toLocaleDateString()}</dd>
            </div>
          )}
        </dl>

        {deal.partner_notes && (
          <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-[11px] text-slate-300 line-clamp-4">
            <span className="block text-slate-500 font-semibold">Partner notes</span>
            {deal.partner_notes}
          </p>
        )}

        {isPending && (
          <div className="mt-auto flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-3 border-t border-slate-800/80">
            {isBlocked ? (
              <Link
                href={`/channel-admin/deals?id=${deal.id}`}
                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs w-full sm:w-auto' })}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                <span>Review (override needed)</span>
              </Link>
            ) : (
              <form action={handleApprove} className="w-full sm:w-auto">
                <input type="hidden" name="dealId" value={deal.id} />
                <input
                  type="hidden"
                  name="decisionReason"
                  value="Approved after Channel duplicate and conflict review. 90-day exclusive deal protection granted."
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full sm:w-auto gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approve</span>
                </Button>
              </form>
            )}
            <form action={handleDeclineDuplicate} className="w-full sm:w-auto">
              <input type="hidden" name="dealId" value={deal.id} />
              <input type="hidden" name="duplicateOfId" value={other.id} />
              <Button type="submit" variant="danger" size="sm" className="w-full sm:w-auto gap-1.5 text-xs">
                <XCircle className="h-3.5 w-3.5" />
                <span>Decline as duplicate</span>
              </Button>
            </form>
          </div>
        )}
      </div>
    );
  }

  function PairCard({ pair }: { pair: MatchPair }) {
    const [first, second] = pair.sides;
    return (
      <article
        className={`rounded-xl border p-4 sm:p-5 space-y-4 bg-slate-900/60 ${
          pair.blocking ? 'border-rose-500/50' : pair.kind === 'conflict' ? 'border-rose-500/25' : 'border-amber-500/30'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <MatchKindBadge kind={pair.kind} blocking={pair.blocking} />
            <MatchReasonChips reasons={pair.reasons} />
          </div>
          <Link
            href={`/channel-admin/deals?id=${first.status === DealStatus.awaiting_approval ? first.id : second.id}`}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:underline"
          >
            Open deal file <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DealSide deal={first} other={second} isFirst />
          <DealSide deal={second} other={first} isFirst={false} />
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ShieldAlert className="h-6 w-6 text-amber-400" />
          <span>Duplicates &amp; Conflicts</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Live matching of every deal awaiting approval against pending, protected and recently won registrations by
          domain, related domain, company name and contact email domain.
        </p>
      </div>

      {pairs.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 p-8 space-y-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">No duplicates or conflicts</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            None of the {pending.length} deal{pending.length === 1 ? '' : 's'} awaiting approval overlaps with another
            active registration.
          </p>
        </div>
      ) : (
        <>
          <section aria-labelledby="conflicts-heading" className="space-y-3">
            <h2 id="conflicts-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Users className="h-4 w-4 text-rose-400" />
              <span>Partner vs partner conflicts</span>
              <span className="rounded-full border border-slate-700 px-2 text-[11px] text-slate-400">{conflicts.length}</span>
            </h2>
            {conflicts.length === 0 ? (
              <p className="text-xs text-slate-500">No cross-partner conflicts right now.</p>
            ) : (
              conflicts.map((pair) => <PairCard key={pair.key} pair={pair} />)
            )}
          </section>

          <section aria-labelledby="duplicates-heading" className="space-y-3">
            <h2 id="duplicates-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Copy className="h-4 w-4 text-amber-400" />
              <span>Same-partner duplicates</span>
              <span className="rounded-full border border-slate-700 px-2 text-[11px] text-slate-400">{duplicates.length}</span>
            </h2>
            {duplicates.length === 0 ? (
              <p className="text-xs text-slate-500">No same-partner duplicates right now.</p>
            ) : (
              duplicates.map((pair) => <PairCard key={pair.key} pair={pair} />)
            )}
          </section>
        </>
      )}
    </div>
  );
}
