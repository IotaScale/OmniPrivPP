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
} from 'lucide-react';
import { DealStatus, LeadAcceptanceStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function ChannelAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  // Query live counts for badges
  const [dealsReviewCount, leadsPendingCount] = await Promise.all([
    prisma.dealRegistration.count({
      where: { status: DealStatus.awaiting_approval },
    }),
    prisma.leadAssignment.count({
      where: { partner_acceptance_status: LeadAcceptanceStatus.pending },
    }),
  ]);

  const navLinks = [
    { label: 'Overview', href: '/channel-admin', icon: LayoutDashboard },
    { label: 'Partners', href: '/channel-admin/partners', icon: Building2 },
    {
      label: 'Deals Review',
      href: '/channel-admin/deals',
      icon: FileCheck2,
      badge: dealsReviewCount > 0 ? dealsReviewCount : undefined,
    },
    {
      label: 'Leads Routing',
      href: '/channel-admin/leads',
      icon: Inbox,
      badge: leadsPendingCount > 0 ? leadsPendingCount : undefined,
    },
    { label: 'Commercial Renewals', href: '/channel-admin/renewals', icon: RefreshCw },
    { label: 'Audit Trail', href: '/channel-admin/audit', icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Console Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-indigo-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/channel-admin" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-white flex items-center gap-2 text-sm">
                  OmniPriv <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-800 text-indigo-400 uppercase tracking-wider">Channel Ops Console</span>
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="text-slate-200 font-medium">{session.fullName}</span>
              <span className="text-indigo-400 font-mono text-[10px]">CHANNEL ADMIN</span>
            </div>

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
