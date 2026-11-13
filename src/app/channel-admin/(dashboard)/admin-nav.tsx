'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface AdminNavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  /** Plain anchor: leaves the app via a route handler (e.g. support SSO). */
  external?: boolean;
}

/* Horizontally scrolling console tabs with a brand underline on the active tab. */
export function AdminNav({ links }: { links: AdminNavLink[] }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/channel-admin' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Channel admin" className="-mb-px flex gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {links.map((link) => {
        const active = !link.external && isActive(link.href);
        const LinkTag = link.external ? 'a' : Link;
        return (
          <LinkTag
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={`group relative flex shrink-0 items-center gap-2 px-3 h-11 text-[0.8125rem] font-medium whitespace-nowrap border-b-2 transition-colors duration-200 focus-visible:outline-none focus-visible:bg-surface-hover ${
              active
                ? 'border-brand text-ink'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-line-strong'
            }`}
          >
            <span className={active ? 'text-brand-ink' : 'text-ink-subtle group-hover:text-ink-muted'}>{link.icon}</span>
            <span>{link.label}</span>
            {link.badge !== undefined && (
              <span className="min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[0.6875rem] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {link.badge}
              </span>
            )}
          </LinkTag>
        );
      })}
    </nav>
  );
}
