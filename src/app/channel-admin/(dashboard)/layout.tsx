import React from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { DealStatus, LeadAcceptanceStatus } from '@prisma/client';
import { OmniPrivLogo } from '@/components/ui/omnipriv-logo';
import { ThemeToggle } from '@/components/theme-toggle';

export const dynamic = 'force-dynamic';

export default async function ChannelAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  // Query live counts for badges
  const [dealsReviewCount, conflictsCount, leadsPendingCount, requestsPendingCount, jbpPendingCount, supportTicketsCount] = await Promise.all([
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
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Console Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-indigo-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <OmniPrivLogo variant="admin" href="/channel-admin" priority />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="text-slate-200 font-medium">{session.fullName}</span>
              <span className="text-indigo-400 font-mono text-[10px]">CHANNEL ADMIN</span>
            </div>

            <ThemeToggle />

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 overflow-x-auto">
          <nav className="flex space-x-1 py-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all whitespace-nowrap"
                >
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  <span>{link.label}</span>
                  {link.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Internal Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-600">
        OmniPriv Internal Privileged Operations • Strictly Confidential & Audited
      </footer>
    </div>
  );
}
