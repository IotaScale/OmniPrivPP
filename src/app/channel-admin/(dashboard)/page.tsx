import React from 'react';
import Link from 'next/link';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { DealStatus, LeadAcceptanceStatus, LeadStatus, OrgStatus } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import {
  Building2,
  FileCheck2,
  AlertTriangle,
  ShieldCheck,
  Inbox,
  Clock,
  RefreshCw,
  ScrollText,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default async function ChannelAdminDashboardPage() {
  await requireAdminSession();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Query live metrics directly from PostgreSQL
  const [
    activePartnersCount,
    newPartnersMonthCount,
    dealsAwaitingCount,
    conflictsCount,
    pipelineSum,
    unassignedLeadsCount,
    slaNearCount,
    upcomingRenewalsCount,
    urgentDeals,
    recentAudits,
  ] = await Promise.all([
    prisma.partnerOrganization.count({ where: { status: OrgStatus.active } }),
    prisma.partnerOrganization.count({ where: { created_at: { gte: startOfMonth } } }),
    prisma.dealRegistration.count({ where: { status: DealStatus.awaiting_approval } }),
    prisma.dealRegistration.count({
      where: { status: DealStatus.awaiting_approval, conflict_detected: true },
    }),
    prisma.dealRegistration.aggregate({
      _sum: { estimated_deal_value: true },
      where: { status: DealStatus.approved },
    }),
    prisma.lead.count({ where: { status: LeadStatus.new } }),
    prisma.leadAssignment.count({
      where: {
        partner_acceptance_status: LeadAcceptanceStatus.pending,
        acceptance_deadline_at: { lte: fortyEightHoursFromNow },
      },
    }),
    prisma.renewal.count({ where: { renewal_date: { gte: now } } }),
    prisma.dealRegistration.findMany({
      where: { status: DealStatus.awaiting_approval },
      include: { organization: true },
      orderBy: [{ conflict_detected: 'desc' }, { created_at: 'asc' }],
      take: 6,
    }),
    prisma.auditEvent.findMany({
      include: { organization: true, actor: true },
      orderBy: { created_at: 'desc' },
      take: 6,
    }),
  ]);

  const pipelineFormatted = (pipelineSum._sum.estimated_deal_value || 0).toLocaleString();

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Channel Operations Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time partner health, deal protection reviews, domain conflict resolution, and lead routing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/channel-admin/deals">
            <Button variant="primary" size="md" className="gap-2 bg-indigo-600 hover:bg-indigo-500 border-indigo-500/30">
              <FileCheck2 className="h-4 w-4" />
              <span>Review Deals ({dealsAwaitingCount})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 8 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Partners
              </span>
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">{activePartnersCount}</span>
              <p className="text-xs text-slate-500 mt-1">+{newPartnersMonthCount} joined this month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Deals Awaiting Review
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">{dealsAwaitingCount}</span>
              <p className="text-xs text-slate-500 mt-1">Require Channel Admin decision</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Domain Conflicts
              </span>
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">{conflictsCount}</span>
              <p className="text-xs text-rose-400/80 mt-1">Overlapping customer domain claims</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Protected Pipeline Value
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">${pipelineFormatted}</span>
              <p className="text-xs text-slate-500 mt-1">Active approved deal protection</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Unassigned Leads
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Inbox className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">{unassignedLeadsCount}</span>
              <p className="text-xs text-slate-500 mt-1">Inbound prospects awaiting routing</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Leads Near SLA Breach
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">{slaNearCount}</span>
              <p className="text-xs text-slate-500 mt-1">&lt; 48 hours remaining on acceptance</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Upcoming Renewals
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <RefreshCw className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">{upcomingRenewalsCount}</span>
              <p className="text-xs text-slate-500 mt-1">Cross-partner subscriptions due</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                System Mode
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">Live</span>
              <p className="text-xs text-emerald-400/90 mt-1">PostgreSQL relational source of truth</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Urgent Queue & Audit Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Urgent Deals Queue (2 Cols) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-indigo-400" />
                  <span>Pending Deal Approval & Conflict Queue</span>
                </CardTitle>
                <CardDescription>
                  Opportunities submitted by partners awaiting approval or conflict resolution.
                </CardDescription>
              </div>
              <Link href="/channel-admin/deals" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                View all ({dealsAwaitingCount}) &rarr;
              </Link>
            </CardHeader>
            <CardContent>
              {urgentDeals.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No deals currently awaiting approval in the queue.
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {urgentDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 -mx-6 px-6 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/channel-admin/deals?id=${deal.id}`}
                            className="font-medium text-slate-200 hover:text-indigo-400 text-sm"
                          >
                            {deal.customer_legal_name}
                          </Link>
                          <span className="text-xs font-mono text-slate-500">
                            {deal.public_reference}
                          </span>
                          {deal.conflict_detected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              CONFLICT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="text-slate-300 font-medium">
                            {deal.organization.display_name}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-cyan-400">{deal.customer_domain}</span>
                          <span>•</span>
                          <span>
                            {deal.currency} {deal.estimated_deal_value?.toLocaleString() || 'TBD'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link href={`/channel-admin/deals?id=${deal.id}`}>
                          <Button variant="primary" size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 border-indigo-500/30">
                            <span>Review & Decide</span>
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Audit Log Activity (1 Col) */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-indigo-400" />
                  <span>Channel Audit Trail</span>
                </CardTitle>
                <CardDescription>Live forensic log.</CardDescription>
              </div>
              <Link href="/channel-admin/audit" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                Full log &rarr;
              </Link>
            </CardHeader>
            <CardContent>
              {recentAudits.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No audit events recorded yet.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {recentAudits.map((event) => (
                    <div key={event.id} className="text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">
                          {event.event_type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(event.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {event.organization?.display_name ? `Org: ${event.organization.display_name} • ` : ''}
                        {event.actor?.full_name || 'System'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
