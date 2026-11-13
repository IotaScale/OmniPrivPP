import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { AuthShell, authCardClass } from '@/components/ui/auth-shell';

export default function AccessDeniedPage() {
  return (
    <AuthShell>
      <div className={`${authCardClass} text-center space-y-6`}>
        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[0.6875rem] font-mono uppercase tracking-[0.08em]">
            <Lock className="h-3 w-3" />
            403 Security Boundary Enforced
          </div>
          <h1 className="font-heading text-[1.5rem] font-bold tracking-[-0.03em] text-ink">
            Channel Admin access denied
          </h1>
          <p className="text-[0.875rem] text-ink-muted leading-relaxed">
            The Channel Admin console is restricted exclusively to authorized OmniPriv internal operations personnel. Partner user accounts are isolated to the Partner Portal workspace.
          </p>
        </div>

        <div className="pt-5 border-t border-line flex flex-col gap-3">
          <Link href="/partner-portal" className={buttonVariants({ variant: 'primary', size: 'lg', className: 'w-full' })}>
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Partner Portal</span>
          </Link>
          <Link href="/sign-in" className="text-[0.8125rem] text-ink-muted hover:text-brand-ink transition-colors">
            Sign in with a different account
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
