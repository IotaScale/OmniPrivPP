'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { signInAction } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OmniPrivLogo } from '@/components/ui/omnipriv-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInAction, undefined);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-[#00B8FF]/30">
      {/* Top ambient highlight */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[360px] pointer-events-none rounded-full"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(0, 184, 255, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      {/* Main split-view container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center relative z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Zone: Branded Enterprise Overview */}
          <div className="lg:col-span-7 space-y-8 pr-0 lg:pr-6">
            <div>
              <OmniPrivLogo variant="full" showBadge={false} size="lg" href="/" priority />
              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-[#00B8FF] bg-[#00B8FF]/10 border border-[#00B8FF]/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Privileged Access Management • Channel Network
                </span>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Commercial Workspace for OmniPriv Partners
                </h1>
                <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
                  Register enterprise opportunities, access deal margin protection, manage renewals, and collaborate directly with your assigned OmniPriv Channel Operations team.
                </p>
              </div>
            </div>

            {/* Core Channel Highlights - Visible on tablet and desktop */}
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span className="w-2 h-2 rounded-full bg-[#00B8FF]" />
                  90-Day Deal Protection
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Registered opportunities lock in guaranteed territory exclusivity and verified margins upon approval.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span className="w-2 h-2 rounded-full bg-[#00B8FF]" />
                  Vendor Lead Distribution
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Receive qualified enterprise inbound demands routed directly to your partner organization with active SLA tracking.
                </p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-6 pt-4 text-xs text-slate-500 border-t border-slate-800/60">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00B8FF]" />
                AI-Powered PAM
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00B8FF]" />
                39 Behavioral Features
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00B8FF]" />
                53 MCP Tool Controls
              </span>
            </div>
          </div>

          {/* Right Zone: Authentication Form Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-7 sm:p-9 shadow-2xl shadow-black/60 relative overflow-hidden">
              <div className="mb-6 space-y-1.5">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Sign in to the OmniPriv Partner Portal
                </h2>
                <p className="text-xs text-slate-400">
                  Enter your verified business email and account password.
                </p>
              </div>

              {state?.error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              <form action={formAction} className="space-y-4">
                <Input
                  label="Work Email"
                  name="email"
                  type="email"
                  placeholder="name@partnercompany.com"
                  required
                  error={state?.fieldErrors?.email?.[0]}
                />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#00B8FF] hover:text-[#00D4FF] transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    name="password"
                    type="password"
                    placeholder="••••••••••••"
                    required
                    error={state?.fieldErrors?.password?.[0]}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-2 font-semibold bg-[#00B8FF] hover:bg-[#0099CC] text-[#020617] transition-colors shadow-lg shadow-[#00B8FF]/10"
                  isLoading={isPending}
                >
                  <span>Sign In to Partner Portal</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </form>

              {/* Secondary Navigation */}
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-3 text-center">
                <div className="text-xs text-slate-400">
                  New partner company?{' '}
                  <Link
                    href="/sign-up"
                    className="text-[#00B8FF] hover:text-[#00D4FF] font-semibold transition-colors"
                  >
                    Register your organization &rarr;
                  </Link>
                </div>
                <div>
                  <Link
                    href="/channel-admin/login"
                    className="text-[11px] text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    Channel administrator? Sign in here.
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 dark:border-[#133052]/60 py-5 text-center text-xs text-slate-500 max-w-7xl mx-auto px-4 w-full flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        <div>&copy; {new Date().getFullYear()} OmniPriv Inc. All rights reserved. AI-Powered Privileged Access Management.</div>
        <div className="flex items-center gap-4 text-slate-500">
          <Link href="/become-a-partner" className="hover:text-slate-400 transition-colors">
            Program Overview
          </Link>
          <span>•</span>
          <Link href="/find-a-partner" className="hover:text-slate-400 transition-colors">
            Partner Directory
          </Link>
        </div>
      </footer>
    </div>
  );
}
