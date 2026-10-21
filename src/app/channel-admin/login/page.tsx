'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { signInAdminAction } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldAlert, Lock, ArrowRight } from 'lucide-react';

export default function ChannelAdminLoginPage() {
  const [state, formAction, isPending] = useActionState(signInAdminAction, undefined);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Red/amber warning ambient glow for internal console */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-950/50">
            <ShieldAlert className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              OmniPriv <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 uppercase tracking-wider">Internal Channel Ops</span>
            </span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Channel Admin Console
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Restricted to OmniPriv Channel Operations & Security Management.
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
              label="Channel Admin Email"
              name="email"
              type="email"
              placeholder="admin@omnipriv.internal"
              required
              error={state?.fieldErrors?.email?.[0]}
            />

            <Input
              label="Console Password"
              name="password"
              type="password"
              placeholder="••••••••••••"
              required
              error={state?.fieldErrors?.password?.[0]}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 border-indigo-500/30 shadow-indigo-950 focus:ring-indigo-500"
              isLoading={isPending}
            >
              <span>Authenticate Channel Admin</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            Partner organization user?{' '}
            <Link href="/sign-in" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4">
              Return to Partner Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
