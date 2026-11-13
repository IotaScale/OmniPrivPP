'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { signInAdminAction } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell, authCardClass } from '@/components/ui/auth-shell';
import { ArrowRight, ShieldAlert } from 'lucide-react';

export default function ChannelAdminLoginPage() {
  const [state, formAction, isPending] = useActionState(signInAdminAction, undefined);

  return (
    <AuthShell
      variant="admin"
      logoHref="/channel-admin/login"
      footer={
        <span className="w-full text-center">
          OmniPriv Internal Privileged Operations &bull; Strictly Confidential &amp; Audited
        </span>
      }
    >
      <div className="text-center mb-7">
        <span className="op-eyebrow">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
          Restricted internal gateway
        </span>
        <h1 className="mt-4 font-heading text-[1.75rem] font-bold tracking-[-0.03em] text-ink">
          Channel Admin Console
        </h1>
        <p className="mt-2 text-[0.875rem] text-ink-muted">
          Restricted to OmniPriv Channel Operations &amp; Security Management.
        </p>
      </div>

      <div className={authCardClass}>
        {state?.error && (
          <div role="alert" className="mb-6 p-3.5 rounded-xl bg-rose-500/[0.08] border border-rose-500/30 text-rose-400 text-[0.8125rem] flex items-start gap-2.5">
            <span className="mt-1.5 h-2 w-2 rounded-full bg-rose-500 shrink-0" aria-hidden="true" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <Input
            label="Channel Admin Email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="admin@omnipriv.internal"
            required
            error={state?.fieldErrors?.email?.[0]}
          />

          <Input
            label="Console Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            required
            error={state?.fieldErrors?.password?.[0]}
          />

          <Button type="submit" size="lg" className="group w-full" isLoading={isPending}>
            <span>Authenticate Channel Admin</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-line text-center text-[0.8125rem] text-ink-muted">
          Partner organization user?{' '}
          <Link href="/sign-in" className="font-semibold text-brand-ink hover:underline underline-offset-2">
            Return to Partner Portal
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
