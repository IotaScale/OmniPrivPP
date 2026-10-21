'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { signInAction } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock, ArrowRight } from 'lucide-react';

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInAction, undefined);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-cyan-500/5 blur-[100px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              OmniPriv <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 uppercase tracking-wider">Channel Portal</span>
            </span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Partner Portal Sign In
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Access your registered deals, assigned leads, and pipeline.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40 backdrop-blur-md">
          {state?.error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <Input
              label="Business Work Email"
              name="email"
              type="email"
              placeholder="name@partnercompany.com"
              required
              error={state?.fieldErrors?.email?.[0]}
            />

            <Input
              label="Account Password"
              name="password"
              type="password"
              placeholder="••••••••••••"
              required
              error={state?.fieldErrors?.password?.[0]}
            />

            <Button type="submit" size="lg" className="w-full mt-2" isLoading={isPending}>
              <span>Sign In to Portal</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400 space-y-2">
            <div>
              New partner company?{' '}
              <Link href="/sign-up" className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4">
                Register your organization
              </Link>
            </div>
            <div>
              <Link href="/channel-admin/login" className="text-slate-500 hover:text-slate-400 font-normal">
                Internal OmniPriv Channel Ops Console &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
