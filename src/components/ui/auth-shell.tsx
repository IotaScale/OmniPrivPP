import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { OmniPrivLogo } from '@/components/ui/omnipriv-logo';
import { ThemeToggle } from '@/components/theme-toggle';

/** Card surface for single-column auth and status pages. */
export const authCardClass =
  'rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-[0_24px_60px_-32px_rgba(10,22,40,0.35)] dark:shadow-none';

interface AuthShellProps {
  children: React.ReactNode;
  /** Which product label sits beside the wordmark. */
  variant?: 'partner' | 'admin';
  logoHref?: string;
  /** Max width of the centred column. */
  width?: 'sm' | 'md' | 'lg';
  /** Replaces the default footer line. */
  footer?: React.ReactNode;
}

/*
 * Shared frame for sign-in style pages, in the omnipriv.com idiom: a slim top
 * bar (wordmark + theme toggle), the faint hero grid with a cyan glow behind a
 * centred column, and a quiet footer.
 */
export function AuthShell({
  children,
  variant = 'partner',
  logoHref = '/',
  width = 'md',
  footer,
}: AuthShellProps) {
  const widthClass = width === 'sm' ? 'max-w-sm' : width === 'lg' ? 'max-w-xl' : 'max-w-md';

  return (
    <div className="relative min-h-dvh flex flex-col bg-page text-ink-soft overflow-hidden">
      <div className="op-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="op-glow pointer-events-none absolute inset-0" aria-hidden="true" />

      <header className="relative z-10 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        <OmniPrivLogo variant={variant} href={logoHref} priority />
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
        <div className={`w-full ${widthClass}`}>{children}</div>
      </main>

      <footer className="relative z-10 px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[0.75rem] text-ink-subtle">
        {footer ?? (
          <>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Encrypted in transit &bull; &copy; {new Date().getFullYear()} OmniPriv Inc.
            </span>
            <span className="flex items-center gap-4">
              <Link href="/become-a-partner" className="hover:text-ink transition-colors">
                Partner Program
              </Link>
              <Link href="/find-a-partner" className="hover:text-ink transition-colors">
                Partner Directory
              </Link>
            </span>
          </>
        )}
      </footer>
    </div>
  );
}
