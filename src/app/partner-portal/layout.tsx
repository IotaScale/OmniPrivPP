import React from 'react';
import Link from 'next/link';
import { requirePartnerSessionAnyStatus } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { signOutAction } from '@/lib/actions/auth';
import { PartnerSidebarNav } from './sidebar-nav';
import {
  Award,
  Bell,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { OmniPrivLogo } from '@/components/ui/omnipriv-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { PortalShell } from './portal-shell';

export const dynamic = 'force-dynamic';

export default async function PartnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, decision } = await requirePartnerSessionAnyStatus();

  // Suspended organizations (and users whose access was revoked) get no
  // workspace chrome. Every page and server action re-checks the org status
  // through `requirePartnerSession` and redirects to the account-status
  // page, which renders its own standalone frame.
  if (!decision.allowed) {
    return <>{children}</>;
  }

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

  const orgName = org?.display_name || session.partnerOrgName;

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand / Company Header */}
      <div className="px-4 pt-4 pb-4 border-b border-line">
        <OmniPrivLogo variant="partner" href="/partner-portal" priority />
        <div className="mt-4 rounded-xl border border-line bg-surface-muted px-3 py-2.5">
          <div className="text-[0.8125rem] font-semibold text-ink truncate" title={orgName}>
            {orgName}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[0.75rem] text-ink-subtle">Partner tier</span>
            <Badge variant={tierVariantMap[org?.tier || 'Registered'] || 'default'} size="sm" className="gap-1">
              <Award className="h-3 w-3" />
              <span>{org?.tier || 'Registered'}</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation Items */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <PartnerSidebarNav unreadLeadsCount={pendingLeadsCount} />
      </div>

      {/* Quick Deal Registration CTA in Sidebar */}
      <div className="px-3 pt-3 pb-3 border-t border-line">
        <Link
          href="/partner-portal/deals/new"
          className={buttonVariants({ variant: 'primary', size: 'md', className: 'w-full' })}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Register a Deal</span>
        </Link>
      </div>

      {/* Authenticated User Profile & Sign Out Footer */}
      <div className="px-3 py-3 border-t border-line flex items-center gap-3">
        <span
          aria-hidden="true"
          className="h-9 w-9 shrink-0 rounded-full bg-brand/15 border border-brand/30 text-brand-ink flex items-center justify-center text-[0.8125rem] font-bold"
        >
          {(session.fullName || 'P').charAt(0).toUpperCase()}
        </span>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[0.8125rem] text-ink font-semibold truncate" title={session.fullName}>
            {session.fullName}
          </span>
          <span className="text-ink-subtle text-[0.75rem] truncate capitalize">
            {session.membershipRole?.replace('_', ' ') || 'Partner User'}
          </span>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="btn-press inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-muted hover:text-rose-400 hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 cursor-pointer"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );

  const headerContext = (
    <div className="flex items-center gap-2.5 text-[0.8125rem] min-w-0">
      <span className="font-semibold text-ink truncate">{orgName}</span>
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ink-subtle/60" />
      <span className="text-ink-muted truncate">{org?.partner_type || 'Authorized Partner'}</span>
    </div>
  );

  const headerActions = (
    <>
      <ThemeToggle />

      <Link
        href="/partner-portal"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-line-strong text-ink-muted hover:text-brand-ink hover:border-brand/40 hover:bg-brand/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        title="Notifications"
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
        )}
      </Link>

      <Link
        href="/partner-portal/deals/new"
        className={buttonVariants({ variant: 'primary', size: 'sm', className: 'hidden sm:inline-flex' })}
      >
        <PlusCircle className="h-4 w-4" />
        <span>New Registration</span>
      </Link>
    </>
  );

  return (
    <PortalShell sidebar={sidebar} headerContext={headerContext} headerActions={headerActions}>
      {children}
    </PortalShell>
  );
}
