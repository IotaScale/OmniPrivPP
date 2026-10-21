'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  FileSpreadsheet,
  Inbox,
  RefreshCw,
  BookOpen,
  Building2,
  Users2,
  ChevronRight,
} from 'lucide-react';

interface SidebarNavProps {
  unreadLeadsCount?: number;
}

export function PartnerSidebarNav({ unreadLeadsCount = 0 }: SidebarNavProps) {
  const pathname = usePathname();

  const isLinkActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const salesNavItems = [
    {
      label: 'Register a Deal',
      href: '/partner-portal/deals/new',
      icon: PlusCircle,
      exact: true,
      highlight: true,
    },
    {
      label: 'My Deals',
      href: '/partner-portal/deals',
      icon: FileSpreadsheet,
      exact: true,
    },
    {
      label: 'Assigned Leads',
      href: '/partner-portal/leads',
      icon: Inbox,
      badge: unreadLeadsCount > 0 ? unreadLeadsCount : undefined,
    },
    {
      label: 'Renewals',
      href: '/partner-portal/renewals',
      icon: RefreshCw,
    },
  ];

  const generalNavItems = [
    {
      label: 'Resources',
      href: '/partner-portal/resources',
      icon: BookOpen,
    },
    {
      label: 'Company',
      href: '/partner-portal/company',
      icon: Building2,
    },
    {
      label: 'Team',
      href: '/partner-portal/team',
      icon: Users2,
    },
  ];

  return (
    <nav className="space-y-6 px-3 py-4">
      {/* Overview */}
      <div>
        <Link
          href="/partner-portal"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            pathname === '/partner-portal'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          <span>Overview</span>
        </Link>
      </div>

      {/* SALES SECTION */}
      <div>
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
          Sales Workspace
        </div>
        <div className="space-y-1">
          {salesNavItems.map((item) => {
            const Icon = item.icon;
            const active = isLinkActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : item.highlight
                    ? 'text-cyan-400 bg-cyan-950/30 border border-cyan-900/40 hover:bg-cyan-950/60 hover:text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 shrink-0 ${item.highlight ? 'text-cyan-400' : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500 text-slate-950">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* RESOURCES & ORGANIZATION */}
      <div>
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
          Enablement & Org
        </div>
        <div className="space-y-1">
          {generalNavItems.map((item) => {
            const Icon = item.icon;
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
