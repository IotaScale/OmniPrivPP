import React from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthShell, authCardClass } from '@/components/ui/auth-shell';

export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <div className={`${authCardClass} text-center space-y-5`}>
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-[1.5rem] font-bold tracking-[-0.03em] text-ink">Email address verified</h1>
          <p className="text-[0.875rem] text-ink-muted leading-relaxed">
            Your business email address has been verified for the OmniPriv Channel Partner Portal.
          </p>
        </div>

        <Link href="/partner-portal" className={buttonVariants({ variant: 'primary', size: 'lg', className: 'w-full' })}>
          <span>Enter Partner Portal</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AuthShell>
  );
}
