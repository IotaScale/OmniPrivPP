'use client';

import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { OmniPrivLogo } from '@/components/ui/omnipriv-logo';

interface PortalShellProps {
  /** Sidebar content: rendered as a sticky rail on desktop and a drawer on mobile. */
  sidebar: React.ReactNode;
  /** Right-hand header content (status, actions). */
  headerActions: React.ReactNode;
  /** Left-hand header context, shown from `sm` up. */
  headerContext?: React.ReactNode;
  children: React.ReactNode;
}

const DESKTOP_QUERY = '(min-width: 1024px)';

/*
 * Partner workspace chrome, following the omnipriv.com partner portal: a
 * white / #15171A left rail with a sticky glass top bar. Below `lg` the rail
 * becomes an off-canvas drawer opened from the top bar.
 */
export function PortalShell({ sidebar, headerActions, headerContext, children }: PortalShellProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onMq = () => {
      if (mq.matches) setOpen(false);
    };

    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Following any link inside the drawer closes it.
  const closeOnLink = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  };

  return (
    <div className="min-h-dvh bg-page text-ink-soft lg:flex">
      {/* Desktop rail */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 sticky top-0 h-dvh bg-surface border-r border-line z-30">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Partner portal navigation">
          <div
            className="op-fade-in absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            id="portal-mobile-nav"
            className="op-drawer-in absolute inset-y-0 left-0 w-[min(20rem,86vw)] flex flex-col bg-surface border-r border-line shadow-[var(--op-pop-shadow)]"
            onClick={closeOnLink}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-muted hover:text-ink hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-16 border-b border-line bg-surface/85 backdrop-blur-xl">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
                aria-expanded={open}
                aria-controls="portal-mobile-nav"
                className="lg:hidden -ml-1.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-ink hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="lg:hidden min-w-0">
                <OmniPrivLogo variant="partner" href="/partner-portal" size="sm" showBadge={false} />
              </div>
              {headerContext && <div className="hidden lg:flex min-w-0">{headerContext}</div>}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">{headerActions}</div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
