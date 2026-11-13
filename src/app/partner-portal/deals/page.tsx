import React from 'react';
import Link from 'next/link';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { DealStatus, Prisma } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { FileSpreadsheet, FilePlus2, Search, Filter, ShieldCheck, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PartnerDealsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await requirePartnerSession();
  const orgId = session.partnerOrgId!;
  const { status: filterStatus, q: query } = await searchParams;

  // Build Prisma where clause strictly isolated to this partner org
  const where: Prisma.DealRegistrationWhereInput = {
    partner_organization_id: orgId,
  };

  if (filterStatus && Object.values(DealStatus).includes(filterStatus as DealStatus)) {
    where.status = filterStatus as DealStatus;
  }

  if (query && query.trim()) {
    const search = query.trim();
    where.OR = [
      { customer_legal_name: { contains: search, mode: 'insensitive' } },
      { customer_domain: { contains: search, mode: 'insensitive' } },
      { public_reference: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [deals, totalCount] = await Promise.all([
    prisma.dealRegistration.findMany({
      where,
      orderBy: { created_at: 'desc' },
    }),
    prisma.dealRegistration.count({ where: { partner_organization_id: orgId } }),
  ]);

  const filterTabs = [
    { label: 'All Deals', value: undefined },
    { label: 'Awaiting Approval', value: DealStatus.awaiting_approval },
    { label: 'Approved & Protected', value: DealStatus.approved },
    { label: 'Declined', value: DealStatus.declined },
    { label: 'Closed Won', value: DealStatus.closed_won },
    { label: 'Closed Lost', value: DealStatus.closed_lost },
    { label: 'Expired', value: DealStatus.expired },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-cyan-400" />
            <span>Deal Registrations</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track customer registrations, Channel review status, and 90-day exclusive protections.
          </p>
        </div>

        <Link href="/partner-portal/deals/new">
          <Button variant="primary" size="md" className="gap-2">
            <FilePlus2 className="h-4 w-4" />
            <span>Register New Deal</span>
          </Button>
        </Link>
      </div>

      {/* Filter Tabs and Search */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
              {filterTabs.map((tab) => {
                const isActive = filterStatus === tab.value;
                return (
                  <Link
                    key={tab.label}
                    href={
                      tab.value
                        ? `/partner-portal/deals?status=${tab.value}${query ? `&q=${query}` : ''}`
                        : `/partner-portal/deals${query ? `?q=${query}` : ''}`
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            {/* Search Input */}
            <form method="GET" action="/partner-portal/deals" className="relative min-w-[240px]">
              {filterStatus && <input type="hidden" name="status" value={filterStatus} />}
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                name="q"
                defaultValue={query || ''}
                placeholder="Search company, domain, OPR..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </form>
          </div>

          {/* Deals Table */}
          {deals.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-200">
                  {totalCount === 0
                    ? 'No opportunities registered yet'
                    : 'No deal registrations match this filter'}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {totalCount === 0
                    ? 'Register your first opportunity to secure a 90-day exclusive protection window.'
                    : 'Try clearing your search query or switching filter tabs.'}
                </p>
              </div>
              {totalCount === 0 && (
                <div className="pt-2">
                  <Link href="/partner-portal/deals/new">
                    <Button variant="primary" size="sm" className="gap-2">
                      <FilePlus2 className="h-4 w-4" />
                      <span>Register a Deal</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-y border-slate-800">
                  <tr>
                    <th className="py-3 px-5 font-semibold">Deal Reference</th>
                    <th className="py-3 px-5 font-semibold">Customer / Opportunity</th>
                    <th className="py-3 px-5 font-semibold">Product Interest</th>
                    <th className="py-3 px-5 font-semibold">Status</th>
                    <th className="py-3 px-5 font-semibold">Estimated Value</th>
                    <th className="py-3 px-5 font-semibold">Expected Close Date</th>
                    <th className="py-3 px-5 font-semibold">Protection Expiry</th>
                    <th className="py-3 px-5 font-semibold">Last Updated</th>
                    <th className="py-3 px-5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {deals.map((deal) => (
                    <tr
                      key={deal.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="py-3.5 px-5 font-mono font-medium text-cyan-400">
                        {deal.public_reference}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                          {deal.customer_legal_name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {deal.customer_domain}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 max-w-xs truncate text-slate-300">
                        {deal.product_interest}
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={deal.status} />
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-200">
                        {deal.estimated_deal_value
                          ? `${deal.currency} ${Number(deal.estimated_deal_value).toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-slate-300 font-mono text-xs">
                        {deal.expected_close_date
                          ? new Date(deal.expected_close_date).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        {deal.protection_expires_at ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-medium font-mono text-xs">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {new Date(deal.protection_expires_at).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 text-xs">
                        {new Date(deal.updated_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link href={`/partner-portal/deals/${deal.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            <span>Details</span>
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
