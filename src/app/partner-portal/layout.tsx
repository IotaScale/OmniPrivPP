import React from 'react';
import Link from 'next/link';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { signOutAction } from '@/lib/actions/auth';
import { PartnerSidebarNav } from './sidebar-nav';
import {
  Shield,
  Award,
  Bell,
  LogOut,
  Building,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OmniPrivLogo } from '@/components/ui/omnipriv-logo';
import { ThemeToggle } from '@/components/theme-toggle';

export const dynamic = 'force-dynamic';

export default async function PartnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePartnerSession();

  // Query live organization, lead count, and unread notification count
  const org = await prisma.partnerOrganization.findUnique({
    where: { id: session.partnerOrgId },
    select: {
      id: true,
      legal_name: true,
      display_name: true,
      tier: true,
      status: true,
      partner_type: true,
    },
  });

  const [unreadCount, pendingLeadsCount] = await Promise.all([
    prisma.notification.count({
      where: {
        partner_organization_id: session.partnerOrgId,
        is_read: false,
      },
    }),
    prisma.leadAssignment.count({
      where: {
        partner_organization_id: session.partnerOrgId,
        partner_acceptance_status: 'pending',
      },
    }),
  ]);

  const tierVariantMap: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
    Registered: 'default',
    Silver: 'info',
    Gold: 'warning',
    Platinum: 'success',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row selection:bg-[#00B8FF]/30">
      {/* LEFT NAVIGATION SIDEBAR (OmniPriv Channel Workspace) */}
      <aside className="w-full md:w-64 bg-slate-900/95 border-r border-white/[0.08] flex flex-col shrink-0 md:sticky md:top-0 md:h-screen z-30">
        {/* Brand / Company Header */}
        <div className="p-4 border-b border-white/[0.08] bg-slate-950/60">
          <OmniPrivLogo variant="partner" href="/partner-portal" priority />
          <div className="mt-2 text-[11px] text-slate-400 truncate max-w-[210px] font-medium" title={org?.display_name || session.partnerOrgName}>
            {org?.display_name || session.partnerOrgName}
          </div>

          {/* Partner Tier Badge */}
          <div className="mt-3 flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-white/[0.08] text-xs">
            <span className="text-slate-400 text-[11px]">Partner Tier:</span>
            <Badge variant={tierVariantMap[org?.tier || 'Registered'] || 'default'} size="sm" className="gap-1 font-semibold">
              <Award className="h-3 w-3" />
              <span>{org?.tier || 'Registered'}</span>
            </Badge>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto">
          <PartnerSidebarNav unreadLeadsCount={pendingLeadsCount} />
        </div>

        {/* Quick Deal Registration CTA in Sidebar */}
        <div className="p-3 border-t border-white/[0.08]">
          <Link href="/partner-portal/deals/new">
            <Button variant="primary" size="sm" className="w-full gap-2 text-xs font-semibold shadow-md shadow-[#00B8FF]/10">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Register a Deal</span>
            </Button>
          </Link>
        </div>

        {/* Authenticated User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-slate-950/70 flex items-center justify-between text-xs">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-slate-200 font-medium truncate" title={session.fullName}>
              {session.fullName}
            </span>
            <span className="text-slate-500 text-[11px] truncate capitalize">
              {session.membershipRole?.replace('_', ' ') || 'Partner User'}
            </span>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-white/[0.08] h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">{org?.display_name || session.partnerOrgName}</span>
            <span>&bull;</span>
            <span className="text-slate-400">{org?.partner_type || 'Authorized Partner'}</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              href="/partner-portal"
              className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-slate-950" />
              )}
            </Link>

            <Link href="/partner-portal/deals/new" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10">
                <PlusCircle className="h-3.5 w-3.5" />
                <span>New Registration</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Child Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
