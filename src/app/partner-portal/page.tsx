import React from 'react';
import Link from 'next/link';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { DealStatus, LeadAcceptanceStatus } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import {
  FilePlus2,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  Inbox,
  RefreshCw,
  ArrowRight,
  Award,
  BookOpen,
  Cpu,
  Layers,
  Building2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PartnerDashboardPage() {
  const session = await requirePartnerSession();
  const orgId = session.partnerOrgId!;
  const now = new Date();

  const firstName = session.fullName ? session.fullName.split(' ')[0] : 'Partner';

  // 1. Fetch organization details
  const org = await prisma.partnerOrganization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      legal_name: true,
      display_name: true,
      tier: true,
      partner_type: true,
    },
  });

  // 2. Fetch live KPI metric counts directly from PostgreSQL
  const [
    openDealsCount,
    awaitingReviewCount,
    protectedDealsCount,
    assignedLeadsActionCount,
    upcomingRenewalsCount,
    recentDeals,
    recentLeads,
    recentRenewals,
  ] = await Promise.all([
    // Open Deal Registrations (active pipeline)
    prisma.dealRegistration.count({
      where: {
        partner_organization_id: orgId,
        status: {
          in: [
            DealStatus.draft,
            DealStatus.awaiting_approval,
            DealStatus.approved,
          ],
        },
      },
    }),
    // Awaiting OmniPriv Review
    prisma.dealRegistration.count({
      where: {
        partner_organization_id: orgId,
        status: DealStatus.awaiting_approval,
      },
    }),
    // Protected Opportunities
    prisma.dealRegistration.count({
      where: {
        partner_organization_id: orgId,
        status: DealStatus.approved,
        OR: [{ protection_expires_at: null }, { protection_expires_at: { gt: now } }],
      },
    }),
    // Assigned Leads Requiring Action
    prisma.leadAssignment.count({
      where: {
        partner_organization_id: orgId,
        partner_acceptance_status: LeadAcceptanceStatus.pending,
      },
    }),
    // Upcoming Renewals
    prisma.renewal.count({
      where: {
        partner_organization_id: orgId,
        renewal_date: { gte: now },
      },
    }),
    // Recent Deals
    prisma.dealRegistration.findMany({
      where: { partner_organization_id: orgId },
      orderBy: { created_at: 'desc' },
      take: 4,
    }),
    // Recent Leads
    prisma.leadAssignment.findMany({
      where: { partner_organization_id: orgId },
      include: { lead: true },
      orderBy: { assigned_at: 'desc' },
      take: 4,
    }),
    // Recent Renewals
    prisma.renewal.findMany({
      where: { partner_organization_id: orgId },
      orderBy: { renewal_date: 'asc' },
      take: 4,
    }),
  ]);

  const tierVariantMap: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
    Registered: 'default',
    Silver: 'info',
    Gold: 'warning',
    Platinum: 'success',
  };

  const partnerTier = org?.tier || 'Registered';
  const companyName = org?.display_name || session.partnerOrgName;

  const partnerTools = [
    {
      title: 'Deal Registration',
      description: 'Register customer opportunities for OmniPriv PAM with guaranteed margin protection.',
      icon: FilePlus2,
      href: '/partner-portal/deals/new',
      ctaText: 'Register Deal',
      primary: true,
    },
    {
      title: 'My Deals',
      description: 'Track registered opportunities, review stages, and manage deal protection expirations.',
      icon: FileSpreadsheet,
      href: '/partner-portal/deals',
      ctaText: 'View Deals',
    },
    {
      title: 'Assigned Leads',
      description: 'Review inbound enterprise leads routed directly to your organization.',
      icon: Inbox,
      href: '/partner-portal/leads',
      ctaText: 'Review Leads',
      badge: assignedLeadsActionCount > 0 ? `${assignedLeadsActionCount} Action Needed` : undefined,
    },
    {
      title: 'Renewals',
      description: 'Monitor upcoming contract renewals and co-term customer subscriptions.',
      icon: RefreshCw,
      href: '/partner-portal/renewals',
      ctaText: 'Track Renewals',
    },
    {
      title: 'Sales Resources',
      description: 'Access official battlecards, competitive matrices, and customer presentations.',
      icon: BookOpen,
      href: '/partner-portal/resources',
      ctaText: 'Browse Collateral',
    },
    {
      title: 'Technical Enablement',
      description: 'Architecture whitepapers, sizing calculators, and zero-trust implementation guides.',
      icon: Cpu,
      href: '/partner-portal/resources?category=technical_enablement',
      ctaText: 'View Tech Guides',
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. TOP SECTION (Kaspersky Channel Model) */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {firstName}
            </h1>
            <Badge variant={tierVariantMap[partnerTier]} size="sm" className="font-semibold gap-1">
              <Award className="h-3 w-3" />
              <span>{partnerTier} Partner</span>
            </Badge>
          </div>
          <p className="text-sm text-slate-400">
            {companyName} &bull; Channel Sales & Deal Protection Workspace
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link href="/partner-portal/deals/new">
            <Button
              variant="primary"
              size="lg"
              className="gap-2 text-sm font-semibold px-6 shadow-md shadow-cyan-950"
            >
              <FilePlus2 className="h-4 w-4" />
              <span>Register a Deal</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. REAL LIVE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Open Deal Registrations */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Open Deal Registrations</span>
            <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{openDealsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active registered pipeline</div>
        </div>

        {/* Awaiting OmniPriv Review */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Awaiting OmniPriv Review</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">{awaitingReviewCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">&lt; 48h review SLA</div>
        </div>

        {/* Protected Opportunities */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Protected Opportunities</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{protectedDealsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">90-day margin locked</div>
        </div>

        {/* Assigned Leads Requiring Action */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Assigned Leads Requiring Action</span>
            <Inbox className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">{assignedLeadsActionCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending acceptance</div>
        </div>

        {/* Upcoming Renewals */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Upcoming Renewals</span>
            <RefreshCw className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">{upcomingRenewalsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Next 90 days</div>
        </div>
      </div>

      {/* 3. PIPELINE STATUS OR PURPOSEFUL EMPTY STATES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deal Registrations Section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
              <span>Deal Registrations</span>
            </h2>
            <Link
              href="/partner-portal/deals"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View all deals &rarr;
            </Link>
          </div>

          {recentDeals.length > 0 ? (
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
              {recentDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/90 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-cyan-400 font-semibold">
                        {deal.public_reference}
                      </span>
                      <StatusBadge status={deal.status} />
                    </div>
                    <div className="font-semibold text-sm text-white mt-1 truncate">
                      {deal.customer_legal_name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {deal.product_interest} &bull; Est. Value:{' '}
                      <span className="text-slate-200 font-mono font-medium">
                        {deal.estimated_arr ? `$${Number(deal.estimated_arr).toLocaleString()}` : 'TBD'}
                      </span>
                    </div>
                  </div>

                  <Link href={`/partner-portal/deals/${deal.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
                      Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            /* Purposeful Empty State for Deals */
            <div className="rounded-xl bg-slate-900/30 border border-dashed border-slate-800 p-8 text-center space-y-4">
              <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 mx-auto">
                <FilePlus2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  Bring your first OmniPriv opportunity to us.
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Register customer opportunities requesting Privileged Access Management to lock in exclusive margin protection and prevent internal channel conflict.
                </p>
              </div>
              <Link href="/partner-portal/deals/new">
                <Button variant="primary" size="sm" className="gap-2 text-xs font-semibold shadow-sm">
                  <FilePlus2 className="h-3.5 w-3.5" />
                  <span>Register a Deal</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Assigned Leads & Renewals Side Panel */}
        <div className="lg:col-span-5 space-y-6">
          {/* Assigned Leads */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Inbox className="h-4 w-4 text-blue-400" />
                <span>Assigned Leads</span>
              </h2>
              <Link
                href="/partner-portal/leads"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View all &rarr;
              </Link>
            </div>

            {recentLeads.length > 0 ? (
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
                {recentLeads.map((assignment) => (
                  <div key={assignment.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">
                        {assignment.lead.company}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5 truncate">
                        {assignment.lead.contact_first_name} {assignment.lead.contact_last_name} &bull; {assignment.lead.product_interest || 'Enterprise PAM'}
                      </div>
                    </div>
                    <Badge
                      variant={
                        assignment.partner_acceptance_status === 'pending'
                          ? 'warning'
                          : assignment.partner_acceptance_status === 'accepted'
                          ? 'success'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {assignment.partner_acceptance_status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              /* Purposeful Empty State for Leads */
              <div className="rounded-xl bg-slate-900/30 border border-slate-800/80 p-5 text-center text-xs text-slate-400">
                <Inbox className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                <div className="font-semibold text-slate-300">No leads have been assigned to your company yet.</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Inbound enterprise inquiries routed by OmniPriv marketing will appear here for acceptance.
                </p>
              </div>
            )}
          </div>

          {/* Renewals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-400" />
                <span>Upcoming Renewals</span>
              </h2>
              <Link
                href="/partner-portal/renewals"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View renewals &rarr;
              </Link>
            </div>

            {recentRenewals.length > 0 ? (
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
                {recentRenewals.map((renewal) => (
                  <div key={renewal.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-white">{renewal.customer_name}</div>
                      <div className="text-slate-400 text-[11px]">
                        Due: {new Date(renewal.renewal_date).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-slate-200">
                      ${Number(renewal.contract_value).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Purposeful Empty State for Renewals */
              <div className="rounded-xl bg-slate-900/30 border border-slate-800/80 p-5 text-center text-xs text-slate-400">
                <RefreshCw className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                <div className="font-semibold text-slate-300">No renewals are currently due.</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Customer contracts eligible for 90-day renewal notices will be populated automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. PARTNER TOOLS SECTION (Kaspersky Style) */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Partner Tools</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Core commercial and technical modules available to {companyName}.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partnerTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.title}
                className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/40 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    {tool.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white">{tool.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tool.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/60">
                  <Link href={tool.href}>
                    <Button
                      variant={tool.primary ? 'primary' : 'outline'}
                      size="sm"
                      className="w-full text-xs font-medium justify-between"
                    >
                      <span>{tool.ctaText}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
