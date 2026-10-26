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
  FileQuestion,
  GraduationCap,
  Award,
  TrendingUp,
  Megaphone,
  Calendar,
  BookOpen,
  Building2,
  Users2,
  FileText,
  MapPin,
  CheckSquare,
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

  const navSections = [
    {
      title: 'Sales',
      items: [
        {
          label: 'Register a Deal',
          href: '/partner-portal/deals/new',
          icon: PlusCircle,
          exact: true,
        },
        {
          label: 'Deal Registrations',
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
        {
          label: 'Commercial Requests',
          href: '/partner-portal/commercial-requests',
          icon: FileQuestion,
        },
      ],
    },
    {
      title: 'Partner Program',
      items: [
        {
          label: 'Onboarding Checklist',
          href: '/partner-portal/onboarding',
          icon: CheckSquare,
        },
        {
          label: 'Learning',
          href: '/partner-portal/learning',
          icon: GraduationCap,
        },
        {
          label: 'Certifications',
          href: '/partner-portal/certifications',
          icon: Award,
        },
        {
          label: 'Joint Business Plan',
          href: '/partner-portal/joint-business-plan',
          icon: TrendingUp,
        },
      ],
    },
    {
      title: 'Marketing & Enablement',
      items: [
        {
          label: 'Campaigns',
          href: '/partner-portal/campaigns',
          icon: Megaphone,
        },
        {
          label: 'Events & Webinars',
          href: '/partner-portal/events',
          icon: Calendar,
        },
        {
          label: 'Resource Library',
          href: '/partner-portal/resources',
          icon: BookOpen,
        },
      ],
    },
    {
      title: 'Company & Directory',
      items: [
        {
          label: 'Company Profile',
          href: '/partner-portal/company',
          icon: Building2,
        },
        {
          label: 'Team Management',
          href: '/partner-portal/team',
          icon: Users2,
        },
        {
          label: 'Accepted Terms',
          href: '/partner-portal/terms',
          icon: FileText,
        },
        {
          label: 'Locator Profile',
          href: '/partner-portal/locator-profile',
          icon: MapPin,
        },
      ],
    },
  ];

  return (
    <nav className="space-y-4 px-3 py-3">
      {/* Dashboard Overview */}
      <div>
        <Link
          href="/partner-portal"
          className={`btn-press flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-160 ${
            pathname === '/partner-portal'
              ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Sections */}
      {navSections.map((section) => (
        <div key={section.title} className="space-y-1">
          <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
            {section.title}
          </div>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`btn-press flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-160 group ${
                    active
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="ml-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-cyan-500 text-slate-950 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
