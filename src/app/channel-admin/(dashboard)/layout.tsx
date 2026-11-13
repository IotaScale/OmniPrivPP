import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { signOutAction } from '@/lib/actions/auth';
import {
  ShieldAlert,
  LayoutDashboard,
  Building2,
  FileCheck2,
  Inbox,
  RefreshCw,
  ScrollText,
  LogOut,
  Headphones,
  Key,
  LifeBuoy,
} from 'lucide-react';
import { DealStatus, LeadAcceptanceStatus } from '@prisma/client';
import { SUPPORT_SSO_PATH } from '@/lib/auth/support-sso-path';
import { OmniPrivLogo } from '@/components/ui/omnipriv-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { AdminNav } from './admin-nav';

export const dynamic = 'force-dynamic';

export default async function ChannelAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  // Query live counts for badges
  const [
    dealsReviewCount,
    conflictsCount,
    leadsPendingCount,
    requestsPendingCount,
    jbpPendingCount,
    supportTicketsCount,
  ] = await Promise.all([
    prisma.dealRegistration.count({
      where: { status: DealStatus.awaiting_approval },
    }),
    prisma.dealRegistration.count({
      where: { conflict_detected: true, status: DealStatus.awaiting_approval },
    }),
    prisma.leadAssignment.count({
      where: { partner_acceptance_status: LeadAcceptanceStatus.pending },
    }),
    prisma.commercialRequest.count({
      where: { status: 'submitted' },
    }),
    prisma.jointBusinessPlan.count({
      where: { status: 'submitted' },
    }),
    prisma.supportTicket.count({
      where: { status: { in: ['open', 'in_progress', 'awaiting_partner'] } },
    }),
  ]);

  const navLinks = [
    { label: 'Overview', href: '/channel-admin', icon: LayoutDashboard },
    { label: 'Partners', href: '/channel-admin/partners', icon: Building2 },
    { label: 'Licenses', href: '/channel-admin/licenses', icon: Key },
    {
      label: 'Deals',
      href: '/channel-admin/deals',
      icon: FileCheck2,
      badge: dealsReviewCount > 0 ? dealsReviewCount : undefined,
    },
    {
      label: 'Conflicts',
      href: '/channel-admin/deal-conflicts',
      icon: ShieldAlert,
      badge: conflictsCount > 0 ? conflictsCount : undefined,
    },
    {
      label: 'Leads',
      href: '/channel-admin/leads',
      icon: Inbox,
      badge: leadsPendingCount > 0 ? leadsPendingCount : undefined,
    },
    {
      label: 'Requests',
      href: '/channel-admin/commercial-requests',
      icon: ScrollText,
      badge: requestsPendingCount > 0 ? requestsPendingCount : undefined,
    },
    { label: 'Renewals', href: '/channel-admin/renewals', icon: RefreshCw },
    { label: 'Programs', href: '/channel-admin/programs', icon: Building2 },
    { label: 'Resources', href: '/channel-admin/resources', icon: ScrollText },
    { label: 'Learning', href: '/channel-admin/learning', icon: ScrollText },
    { label: 'Campaigns', href: '/channel-admin/campaigns', icon: ScrollText },
    { label: 'Events', href: '/channel-admin/events', icon: ScrollText },
    {
      label: 'JBP',
      href: '/channel-admin/jbp',
      icon: ScrollText,
      badge: jbpPendingCount > 0 ? jbpPendingCount : undefined,
    },
    {
      label: 'Support Tickets',
      href: '/channel-admin/support-tickets',
      icon: Headphones,
      badge: supportTicketsCount > 0 ? supportTicketsCount : undefined,
    },
    { label: 'Audit Log', href: '/channel-admin/audit-log', icon: ScrollText },
    // Route handler that signs the admin in to the support console (SSO);
    // rendered as a plain <a> so the browser follows the redirect.
    { label: 'Support console', href: SUPPORT_SSO_PATH, icon: LifeBuoy, external: true },
  ];

  const navItems = navLinks.map(({ icon: Icon, ...link }) => ({
    ...link,
    icon: <Icon className="h-4 w-4" />,
  }));

  return (
    <div className="min-h-dvh bg-page text-ink-soft flex flex-col">
      {/* Top Console Bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <OmniPrivLogo variant="admin" href="/channel-admin" priority />

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex flex-col text-right leading-tight">
              <span className="text-[0.8125rem] font-semibold text-ink">{session.fullName}</span>
              <span className="text-[0.6875rem] font-mono uppercase tracking-[0.08em] text-brand-ink">Channel Admin</span>
            </div>

            <ThemeToggle />

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1.5 px-3 rounded-[10px] border border-line-strong text-[0.8125rem] font-semibold text-ink-muted hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <AdminNav links={navItems} />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0">
        {children}
      </main>

      {/* Internal Footer */}
      <footer className="border-t border-line py-5 px-4 text-center text-[0.75rem] text-ink-subtle">
        OmniPriv Internal Privileged Operations &bull; Strictly Confidential &amp; Audited
      </footer>
    </div>
  );
}
