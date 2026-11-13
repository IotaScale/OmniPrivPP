'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { DealReviewDrawer, DeleteDealButton } from './deal-review-drawer';
import { MatchSeverityBadge } from './match-badges';
import type { DealMatchView } from '@/lib/utils/deal-matching';
import { Search, ArrowRight } from 'lucide-react';

interface DealRow {
  id: string;
  public_reference: string;
  customer_legal_name: string;
  customer_domain: string;
  customer_country: string;
  customer_industry?: string | null;
  customer_contact_name: string;
  customer_contact_email: string;
  customer_contact_phone?: string | null;
  product_interest: string;
  deployment_type: string;
  estimated_deal_value?: number | null;
  currency: string;
  expected_seat_count?: number | null;
  expected_close_date?: Date | string | null;
  status: string;
  conflict_detected: boolean;
  conflict_reason?: string | null;
  protection_starts_at?: Date | string | null;
  protection_expires_at?: Date | string | null;
  admin_decision_reason?: string | null;
  created_at: Date | string;
  organization: {
    id: string;
    display_name: string;
    tier: string;
  };
  submitted_by: {
    full_name: string;
    email: string;
  };
  status_history: Array<{
    id: string;
    new_status: string;
    note?: string | null;
    created_at: Date | string;
  }>;
}

export function ChannelAdminDealsTable({
  deals,
  selectedDeal,
  matchesByDeal,
  currentStatus,
  currentQuery,
}: {
  deals: DealRow[];
  selectedDeal?: DealRow | null;
  matchesByDeal: Record<string, DealMatchView[]>;
  currentStatus?: string;
  currentQuery?: string;
}) {
  const router = useRouter();
  const [activeDeal, setActiveDeal] = useState<DealRow | null>(selectedDeal || null);

  const listParams = new URLSearchParams();
  if (currentStatus) listParams.set('status', currentStatus);
  if (currentQuery) listParams.set('q', currentQuery);
  const listHref = `/channel-admin/deals${listParams.size ? `?${listParams.toString()}` : ''}`;

  const filterTabs = [
    { label: 'All Deals', value: undefined },
    { label: 'Awaiting Approval', value: 'awaiting_approval' },
    { label: 'Needs attention', value: 'attention' },
    { label: 'Approved & Protected', value: 'approved' },
    { label: 'Declined', value: 'declined' },
    { label: 'Closed Won', value: 'closed_won' },
    { label: 'Closed Lost', value: 'closed_lost' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {filterTabs.map((tab) => {
            const isActive = currentStatus === tab.value;
            return (
              <Link
                key={tab.label}
                href={
                  tab.value
                    ? `/channel-admin/deals?status=${tab.value}${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ''}`
                    : `/channel-admin/deals${currentQuery ? `?q=${encodeURIComponent(currentQuery)}` : ''}`
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#00B8DB] text-[#03121c] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Search Input */}
        <form method="GET" action="/channel-admin/deals" className="relative min-w-[260px]">
          {currentStatus && <input type="hidden" name="status" value={currentStatus} />}
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={currentQuery || ''}
            placeholder="Search domain, company, partner..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </form>
      </div>

      {/* Table */}
      {deals.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 border border-slate-800 rounded-xl bg-slate-900/50">
          No deal registrations found for this filter.
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl bg-slate-900/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-6 font-semibold">Reference</th>
                  <th className="py-3 px-6 font-semibold">Partner Company</th>
                  <th className="py-3 px-6 font-semibold">Customer & Domain</th>
                  <th className="py-3 px-6 font-semibold">Estimated Value</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold">Overlap</th>
                  <th className="py-3 px-6 font-semibold">Protection Window</th>
                  <th className="py-3 px-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => setActiveDeal(deal)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-6 font-mono font-medium text-cyan-300">
                      {deal.public_reference}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-200">
                      <div>{deal.organization.display_name}</div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Tier: {deal.organization.tier}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {deal.customer_legal_name}
                      </div>
                      <div className="font-mono text-[11px] text-cyan-400">
                        {deal.customer_domain}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-200">
                      {deal.estimated_deal_value
                        ? `${deal.currency} ${deal.estimated_deal_value.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={deal.status} />
                    </td>
                    <td className="py-3.5 px-6">
                      {matchesByDeal[deal.id]?.length ? (
                        <MatchSeverityBadge matches={matchesByDeal[deal.id]} />
                      ) : deal.status === 'awaiting_approval' || deal.status === 'approved' ? (
                        <span className="text-slate-500 text-[11px]">Clean</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px]">
                      {deal.protection_expires_at ? (
                        <span className="text-emerald-400 font-semibold">
                          until {new Date(deal.protection_expires_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-cyan-400 hover:text-white hover:bg-cyan-500/15"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDeal(deal);
                          }}
                        >
                          <span>Review</span>
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                        <DeleteDealButton deal={deal} iconOnly />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Drawer */}
      {activeDeal && (
        <DealReviewDrawer
          deal={activeDeal}
          onClose={() => {
            setActiveDeal(null);
            router.replace(listHref);
          }}
          matches={matchesByDeal[activeDeal.id] || []}
        />
      )}
    </div>
  );
}
