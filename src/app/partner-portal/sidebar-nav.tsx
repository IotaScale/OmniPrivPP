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
  LifeBuoy,
  KeyRound,
} from 'lucide-react';
import { SUPPORT_SSO_PATH } from '@/lib/auth/support-sso-path';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: number;
  /** Plain anchor: leaves the app via a route handler (e.g. support SSO). */
  external?: boolean;
}

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

  const navSections: { title: string; items: NavItem[] }[] = [
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
          label: 'Customer Licenses',
          href: '/partner-portal/licenses',
          icon: KeyRound,
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
    {
      title: 'Help',
      items: [
        {
          // Signs the user in to support.omnipriv.com with their current session.
          label: 'Support',
          href: SUPPORT_SSO_PATH,
          icon: LifeBuoy,
          external: true,
        },
      ],
    },
  ];

  const itemBase =
    'btn-press relative flex items-center gap-3 px-3 py-2 rounded-[10px] text-[0.8125rem] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50';
  const itemActive =
    'bg-brand/10 text-brand-ink font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full before:bg-brand';
  const itemIdle = 'text-ink-muted hover:text-ink hover:bg-surface-hover';

  return (
    <nav aria-label="Partner portal" className="space-y-5 px-3 py-4">
      {/* Dashboard Overview */}
      <div>
        <Link
          href="/partner-portal"
          aria-current={pathname === '/partner-portal' ? 'page' : undefined}
          className={`${itemBase} ${pathname === '/partner-portal' ? itemActive : itemIdle}`}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Sections */}
      {navSections.map((section) => (
        <div key={section.title} className="space-y-1">
          <div className="px-3 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
            {section.title}
          </div>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isExternal = Boolean(item.external);
              const active = !isExternal && isLinkActive(item.href, item.exact);
              const LinkTag = isExternal ? 'a' : Link;
              return (
                <LinkTag
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`${itemBase} justify-between group ${active ? itemActive : itemIdle}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="ml-2 min-w-5 h-5 px-1.5 inline-flex items-center justify-center text-[0.6875rem] font-bold rounded-full bg-brand text-on-brand shrink-0">
                      {item.badge}
                    </span>
                  )}
                </LinkTag>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
