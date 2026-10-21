import React from 'react';
import Link from 'next/link';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { signOutAction } from '@/lib/actions/auth';
import {
  Shield,
  LayoutDashboard,
  FileSpreadsheet,
  Inbox,
  RefreshCw,
  BookOpen,
  Building,
  Users,
  LogOut,
  Bell,
  Award,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function PartnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePartnerSession();

  // Query live organization and notification stats from PostgreSQL
  const org = await prisma.partnerOrganization.findUnique({
    where: { id: session.partnerOrgId },
    select: {
      id: true,
      legal_name: true,
      display_name: true,
      tier: true,
      status: true,
    },
  });

  const unreadCount = await prisma.notification.count({
    where: {
      partner_organization_id: session.partnerOrgId,
      is_read: false,
    },
  });

  const tierVariantMap: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
    Registered: 'default',
    Silver: 'info',
    Gold: 'warning',
    Platinum: 'success',
  };

  const navLinks = [
    { label: 'Overview', href: '/partner-portal', icon: LayoutDashboard },
    { label: 'Deal Registrations', href: '/partner-portal/deals', icon: FileSpreadsheet },
    { label: 'Assigned Leads', href: '/partner-portal/leads', icon: Inbox },
    { label: 'Renewals', href: '/partner-portal/renewals', icon: RefreshCw },
    { label: 'Enablement Resources', href: '/partner-portal/resources', icon: BookOpen },
    { label: 'Company Profile', href: '/partner-portal/company', icon: Building },
    { label: 'Team', href: '/partner-portal/team', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/partner-portal" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-white flex items-center gap-2 text-sm">
                  OmniPriv <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/90 border border-cyan-800/80 text-cyan-400">PARTNER</span>
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">{org?.display_name || session.partnerOrgName}</span>
              <Badge variant={tierVariantMap[org?.tier || 'Registered'] || 'default'} size="sm">
                <Award className="h-3 w-3" />
                {org?.tier || 'Registered'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/partner-portal"
              className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-slate-900" />
              )}
            </Link>

            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="text-slate-200 font-medium">{session.fullName}</span>
              <span className="text-slate-500 capitalize">{session.membershipRole?.replace('_', ' ')}</span>
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

        {/* Navigation Tabs */}
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
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-600">
        OmniPriv Privileged Access Management — Authorized Channel Partner Portal
      </footer>
    </div>
  );
}
