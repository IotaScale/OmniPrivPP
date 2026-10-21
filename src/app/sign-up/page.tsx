'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { signUpPartnerAction } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Building2, User, Lock, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpPartnerAction, undefined);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
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
            Register Your Partner Organization
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
            Authorized B2B Channel Partners register deal opportunities, receive inbound PAM leads, and manage customer protections. Instant operational access upon submission.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40 backdrop-blur-md">
          {state?.error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-6">
            {/* Section 1: Organization Details */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-800 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                <Building2 className="h-4 w-4" />
                <span>1. Organization & Legal Entity</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Legal Company Name"
                  name="companyLegalName"
                  placeholder="e.g. Apex Security Solutions Ltd"
                  required
                  error={state?.fieldErrors?.companyLegalName?.[0]}
                />
                <Input
                  label="Display / Commercial Name"
                  name="companyDisplayName"
                  placeholder="e.g. Apex Security"
                  required
                  error={state?.fieldErrors?.companyDisplayName?.[0]}
                />
                <Input
                  label="Company Website / Primary Domain"
                  name="website"
                  placeholder="e.g. apexsecurity.com"
                  required
                  error={state?.fieldErrors?.website?.[0]}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Partner Classification <span className="text-cyan-400">*</span>
                  </label>
                  <select
                    name="partnerType"
                    required
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                    defaultValue="Value Added Reseller (VAR)"
                  >
                    <option value="Value Added Reseller (VAR)">Value Added Reseller (VAR)</option>
                    <option value="System Integrator (SI)">System Integrator (SI)</option>
                    <option value="Managed Security Service Provider (MSSP)">Managed Security Service Provider (MSSP)</option>
                    <option value="Cybersecurity Advisory / Consultant">Cybersecurity Advisory / Consultant</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
                <Input
                  label="Country"
                  name="country"
                  placeholder="e.g. United Kingdom"
                  required
                  error={state?.fieldErrors?.country?.[0]}
                />
                <Input
                  label="Region / Territory"
                  name="region"
                  placeholder="e.g. EMEA, North America, APAC"
                  required
                  error={state?.fieldErrors?.region?.[0]}
                />
              </div>
            </div>

            {/* Section 2: Primary Partner Owner Account */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-800 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                <User className="h-4 w-4" />
                <span>2. Partner Owner Account</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="fullName"
                  placeholder="e.g. Eleanor Vance"
                  required
                  error={state?.fieldErrors?.fullName?.[0]}
                />
                <Input
                  label="Business Work Email"
                  name="email"
                  type="email"
                  placeholder="e.g. evance@apexsecurity.com"
                  required
                  error={state?.fieldErrors?.email?.[0]}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Account Password"
                    name="password"
                    type="password"
                    placeholder="Minimum 8 characters with letters and numbers"
                    required
                    error={state?.fieldErrors?.password?.[0]}
                  />
                </div>
              </div>
            </div>

            {/* Feature Callouts */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Instant operational access — register deals immediately after submission.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Approved opportunities receive 90-day exclusive deal protection.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Strict multi-tenant security guarantees complete commercial isolation.</span>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" isLoading={isPending}>
              <span>Register Partner Organization</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            Already registered as an OmniPriv Channel Partner?{' '}
            <Link href="/sign-in" className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4">
              Sign in to your portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
