import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { OmniPrivLogo } from '@/components/ui/omnipriv-logo';
import { ThemeToggle } from '@/components/theme-toggle';

const navLinkClass =
  'px-3 h-9 items-center rounded-lg text-[0.875rem] font-medium text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors';

const ctaClass =
  'group inline-flex items-center gap-1.5 h-[2.375rem] px-3.5 sm:px-4 rounded-[10px] text-[0.8125rem] sm:text-[0.875rem] font-semibold whitespace-nowrap ' +
  'bg-brand text-on-brand hover:bg-brand-hover transition-colors ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_18px_-8px_rgba(0,184,219,0.7)] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-page';

interface PublicHeaderProps {
  ctaHref?: string;
  /** Optional chip shown beside the logo (e.g. "Locator"). */
  tag?: string;
}

/*
 * Public header in the omnipriv.com idiom: a floating, rounded glass bar
 * with the wordmark, a few text links and one solid cyan CTA.
 */
export function PublicHeader({ ctaHref = '/sign-up', tag }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 px-3 sm:px-4 pt-3">
      <nav
        aria-label="Main"
        className="mx-auto max-w-7xl h-[3.625rem] pl-3 sm:pl-4 pr-2 flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface/80 backdrop-blur-xl shadow-[0_8px_30px_-18px_rgba(15,23,42,0.3)]"
      >
        <div className="flex items-center gap-2 shrink-0">
          <OmniPrivLogo variant="partner" href="/" priority />
          {tag && (
            <span className="hidden md:inline-flex text-[0.6875rem] font-mono uppercase tracking-[0.08em] text-ink-subtle">
              / {tag}
            </span>
          )}
        </div>

        <div className="hidden lg:flex items-center">
          <Link href="/become-a-partner" className={`${navLinkClass} inline-flex`}>
            Partner Program
          </Link>
          <Link href="/find-a-partner" className={`${navLinkClass} inline-flex`}>
            Find a Partner
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />
          <Link href="/sign-in" className={`${navLinkClass} hidden sm:inline-flex`}>
            Sign in
          </Link>
          <Link href={ctaHref} className={ctaClass}>
            <span className="hidden min-[420px]:inline">Become a Partner</span>
            <span className="min-[420px]:hidden">Join</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function PublicFooter({ note }: { note?: string }) {
  return (
    <footer className="relative border-t border-line bg-surface">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(37.5rem,80vw)] h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent"
        aria-hidden="true"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 text-[0.8125rem] text-ink-muted">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <OmniPrivLogo variant="full" showBadge={false} size="sm" priority={false} />
          <span className="text-ink-subtle">
            {note ?? 'Channel Partner Portal'} &bull; &copy; {new Date().getFullYear()} OmniPriv Inc.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/become-a-partner" className="hover:text-brand-ink transition-colors">
            Partner Program
          </Link>
          <Link href="/find-a-partner" className="hover:text-brand-ink transition-colors">
            Partner Directory
          </Link>
          <Link href="/sign-in" className="hover:text-brand-ink transition-colors">
            Portal Login
          </Link>
          <Link href="/channel-admin/login" className="hover:text-brand-ink transition-colors">
            Channel Admin Console
          </Link>
        </div>
      </div>
    </footer>
  );
}
