'use client';

import React, { Suspense, useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInAction } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OmniPrivLogo } from '@/components/ui/omnipriv-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { ArrowRight, CheckCircle2, Inbox, Lock, ShieldCheck, ShieldHalf } from 'lucide-react';

/** Carries ?next= (support handoff) through the sign-in form; validated server-side. */
function NextPathField() {
  const next = useSearchParams().get('next');
  return next ? <input type="hidden" name="next" value={next} /> : null;
}

/** Success banner after a password was set via an invite or reset link (?reset=1). */
function PasswordResetBanner() {
  if (useSearchParams().get('reset') !== '1') return null;
  return (
    <div
      role="status"
      className="mt-6 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-[0.8125rem] leading-relaxed text-emerald-500"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Your password has been set. Sign in with your new password.</span>
    </div>
  );
}

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInAction, undefined);

  return (
    <div className="min-h-dvh grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] bg-page text-ink-soft">
      {/* Left: navy brand panel (omnipriv.com sign-in idiom) */}
      <aside className="dark op-band-navy relative hidden lg:flex flex-col justify-between overflow-hidden p-10 xl:p-14">
        <div className="op-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="op-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />

        <div className="relative">
          <OmniPrivLogo variant="full" showBadge={false} href="/" priority />
        </div>

        <div className="relative max-w-lg">
          <span className="op-eyebrow">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Privileged Access Management • Channel Network
          </span>
          <h2 className="mt-5 font-heading text-[2.25rem] xl:text-[2.75rem] font-bold leading-[1.06] tracking-[-0.03em] text-white">
            Commercial workspace for <span className="text-[#00B8DB]">OmniPriv partners.</span>
          </h2>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-slate-400">
            Register enterprise opportunities, access deal margin protection, manage renewals, and collaborate
            directly with your assigned OmniPriv Channel Operations team.
          </p>

          <ul className="mt-8 space-y-2">
            <li className="flex items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
              <span className="inline-flex w-9 h-9 shrink-0 items-center justify-center rounded-xl bg-[#00B8DB] text-[#03121c]">
                <ShieldHalf className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-semibold text-white">90-Day Deal Protection</span>
                <span className="block text-[0.8125rem] text-slate-400">
                  Registered opportunities lock in guaranteed territory exclusivity and verified margins upon approval.
                </span>
              </span>
            </li>
            <li className="flex items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
              <span className="inline-flex w-9 h-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-[#7FE3F2]">
                <Inbox className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-semibold text-white">Vendor Lead Distribution</span>
                <span className="block text-[0.8125rem] text-slate-400">
                  Receive qualified enterprise inbound demand routed to your partner organization with active SLA
                  tracking.
                </span>
              </span>
            </li>
          </ul>
        </div>

        <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.8125rem] text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00B8DB]" aria-hidden="true" />
            AI-Powered PAM
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00B8DB]" aria-hidden="true" />
            39 Behavioral Features
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00B8DB]" aria-hidden="true" />
            53 MCP Tool Controls
          </span>
        </div>
      </aside>

      {/* Right: form */}
      <section className="relative flex flex-col min-w-0 px-4 py-4 sm:px-10 lg:px-14 xl:px-20">
        <div className="op-grid pointer-events-none absolute inset-0 lg:hidden" aria-hidden="true" />

        <div className="relative flex items-center justify-between gap-3 h-12">
          <span className="lg:hidden">
            <OmniPrivLogo variant="partner" href="/" priority />
          </span>
          <span className="hidden lg:block" />
          <ThemeToggle />
        </div>

        <div className="relative flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[25rem]">
            <span className="op-eyebrow lg:hidden">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Partner Portal
            </span>
            <h1 className="mt-4 lg:mt-0 font-heading text-[1.75rem] sm:text-[2rem] font-bold leading-tight tracking-[-0.03em] text-ink">
              Partner sign in
            </h1>
            <p className="mt-2 text-[0.9375rem] text-ink-muted">
              Enter your verified business email and account password.
            </p>

            {!state?.error && (
              <Suspense fallback={null}>
                <PasswordResetBanner />
              </Suspense>
            )}

            {state?.error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.08] p-3.5 text-[0.8125rem] leading-relaxed text-rose-400"
              >
                <span className="mt-1.5 h-2 w-2 rounded-full bg-rose-500 shrink-0" aria-hidden="true" />
                <span>{state.error}</span>
              </div>
            )}

            <form action={formAction} className="mt-8 space-y-5">
              <Suspense fallback={null}>
                <NextPathField />
              </Suspense>
              <Input
                label="Work Email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="name@partnercompany.com"
                required
                error={state?.fieldErrors?.email?.[0]}
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-[0.8125rem] font-semibold text-ink-soft">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[0.8125rem] font-semibold text-brand-ink hover:underline underline-offset-2"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  required
                  error={state?.fieldErrors?.password?.[0]}
                />
              </div>

              <Button type="submit" size="lg" className="group w-full" isLoading={isPending}>
                <span>Sign In to Partner Portal</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </form>

            <div className="mt-8 rounded-2xl border border-line bg-surface-muted p-5">
              <p className="text-[0.875rem] text-ink-muted">New partner company?</p>
              <Link
                href="/sign-up"
                className="group mt-2 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-brand-ink"
              >
                Register your organization
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 text-[0.75rem] text-ink-subtle">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" /> Encrypted in transit
          </span>
          <Link href="/channel-admin/login" className="inline-flex items-center gap-1.5 hover:text-ink transition-colors">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
            Channel administrator? Sign in here.
          </Link>
        </div>
      </section>
    </div>
  );
}
