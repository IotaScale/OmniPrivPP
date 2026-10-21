import React from 'react';
import Link from 'next/link';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { DealStatus, LeadAcceptanceStatus } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import {
  FilePlus2,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  Inbox,
  RefreshCw,
  ArrowRight,
  Activity,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { evaluateLeadSla } from '@/lib/utils/sla';

export default async function PartnerOverviewPage() {
  const session = await requirePartnerSession();
  const orgId = session.partnerOrgId!;
  const now = new Date();

  // Query live metrics directly from PostgreSQL
  const [
    totalDeals,
    awaitingApprovalCount,
    approvedProtectedCount,
    leadsActionCount,
    upcomingRenewalsCount,
    recentDeals,
    assignedLeads,
    recentRenewals,
    recentAudits,
  ] = await Promise.all([
    prisma.dealRegistration.count({ where: { partner_organization_id: orgId } }),
    prisma.dealRegistration.count({
      where: { partner_organization_id: orgId, status: DealStatus.awaiting_approval },
    }),
    prisma.dealRegistration.count({
      where: {
        partner_organization_id: orgId,
        status: DealStatus.approved,
        OR: [{ protection_expires_at: null }, { protection_expires_at: { gt: now } }],
      },
    }),
    prisma.leadAssignment.count({
      where: {
        partner_organization_id: orgId,
        partner_acceptance_status: LeadAcceptanceStatus.pending,
      },
    }),
    prisma.renewal.count({
      where: {
        partner_organization_id: orgId,
        renewal_date: { gte: now },
      },
    }),
    prisma.dealRegistration.findMany({
      where: { partner_organization_id: orgId },
      orderBy: { created_at: 'desc' },
      take: 5,
    }),
    prisma.leadAssignment.findMany({
      where: { partner_organization_id: orgId },
      include: { lead: true },
      orderBy: { assigned_at: 'desc' },
      take: 5,
    }),
    prisma.renewal.findMany({
      where: { partner_organization_id: orgId },
      orderBy: { renewal_date: 'asc' },
      take: 5,
    }),
    prisma.auditEvent.findMany({
      where: { partner_organization_id: orgId },
      orderBy: { created_at: 'desc' },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Partner Workspace Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Commercial pipeline, deal registrations, and assigned leads for {session.partnerOrgName}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/partner-portal/deals/new">
            <Button variant="primary" size="md" className="gap-2 shadow-cyan-950/80 shadow-md">
              <FilePlus2 className="h-4 w-4" />
              <span>Register a Deal</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Live Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Awaiting Review
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">{awaitingApprovalCount}</span>
              <p className="text-xs text-slate-500 mt-1">Opportunities submitted for OmniPriv review</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Protected Deals
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">{approvedProtectedCount}</span>
              <p className="text-xs text-slate-500 mt-1">Active 90-day exclusive deal protections</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Assigned Leads Action
              </span>
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Inbox className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">{leadsActionCount}</span>
              <p className="text-xs text-slate-500 mt-1">Inbound leads awaiting partner response</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Upcoming Renewals
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <RefreshCw className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">{upcomingRenewalsCount}</span>
              <p className="text-xs text-slate-500 mt-1">Client PAM subscriptions due for renewal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Deals & Leads */}
        <div className="lg:col-span-2 space-y-8">
          {/* Deal Registrations Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                  <span>Recent Deal Registrations</span>
                </CardTitle>
                <CardDescription>
                  Customer opportunities submitted by your team for OmniPriv PAM.
                </CardDescription>
              </div>
              <Link href="/partner-portal/deals" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                View all ({totalDeals}) &rarr;
              </Link>
            </CardHeader>

            <CardContent>
              {recentDeals.length === 0 ? (
                /* Purposeful empty state */
                <div className="py-10 text-center space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-200">
                      No opportunities registered yet
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Submit your first customer opportunity to secure a 90-day exclusive deal protection window and channel engagement.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link href="/partner-portal/deals/new">
                      <Button variant="primary" size="sm" className="gap-2">
                        <FilePlus2 className="h-4 w-4" />
                        <span>Register a Deal</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {recentDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 -mx-6 px-6 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/partner-portal/deals/${deal.id}`}
                            className="font-medium text-slate-200 hover:text-cyan-400 text-sm transition-colors"
                          >
                            {deal.customer_legal_name}
                          </Link>
                          <span className="text-xs font-mono text-slate-500">
                            {deal.public_reference}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>{deal.customer_domain}</span>
                          <span>•</span>
                          <span>{deal.product_interest}</span>
                          {deal.estimated_deal_value && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-300">
                                {deal.currency} {deal.estimated_deal_value.toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <StatusBadge status={deal.status} />
                        <Link href={`/partner-portal/deals/${deal.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Leads Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-cyan-400" />
                  <span>OmniPriv Assigned Inbound Leads</span>
                </CardTitle>
                <CardDescription>
                  Inbound demand routed exclusively to your organization.
                </CardDescription>
              </div>
              <Link href="/partner-portal/leads" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                View all leads &rarr;
              </Link>
            </CardHeader>

            <CardContent>
              {assignedLeads.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="mx-auto h-10 w-10 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
                    <Inbox className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-slate-400">
                    No leads have been assigned to your company yet. OmniPriv routes qualified opportunities based on tier and territory.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {assignedLeads.map((assignment) => {
                    const sla = evaluateLeadSla(
                      assignment.acceptance_deadline_at,
                      assignment.accepted_at || assignment.declined_at
                    );

                    return (
                      <div
                        key={assignment.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 -mx-6 px-6 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/partner-portal/leads/${assignment.id}`}
                              className="font-medium text-slate-200 hover:text-cyan-400 text-sm"
                            >
                              {assignment.lead.company}
                            </Link>
                            <span className="text-xs font-mono text-slate-500">
                              {assignment.lead.public_reference}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>
                              {assignment.lead.contact_first_name} {assignment.lead.contact_last_name}
                            </span>
                            <span>•</span>
                            <span>{assignment.lead.country}</span>
                            <span>•</span>
                            <span className={sla.isBreached ? 'text-rose-400' : 'text-amber-400'}>
                              SLA: {sla.formattedRemaining}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <StatusBadge status={assignment.partner_acceptance_status} />
                          <Link href={`/partner-portal/leads/${assignment.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Renewals & Audit Timeline */}
        <div className="space-y-8">
          {/* Renewals Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-400" />
                  <span>Upcoming Renewals</span>
                </CardTitle>
                <CardDescription>Commercial subscription milestones.</CardDescription>
              </div>
              <Link href="/partner-portal/renewals" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                View all &rarr;
              </Link>
            </CardHeader>
            <CardContent>
              {recentRenewals.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No commercial renewals are currently due.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRenewals.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          {r.customer_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {r.product_plan} • Due {new Date(r.renewal_date).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-cyan-400 font-medium">
                        {r.currency} {r.contract_value?.toLocaleString() || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit / Status Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Immutable transaction records.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAudits.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  No activity logged yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAudits.map((event) => (
                    <div key={event.id} className="flex items-start gap-2.5 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-slate-300 font-medium">
                          {event.event_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
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
