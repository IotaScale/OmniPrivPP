'use client';

import React, { useActionState } from 'react';
import { submitJbpAction } from '@/lib/actions/jbp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { TrendingUp, Send, CheckCircle2, ShieldAlert, Target, Award, Megaphone } from 'lucide-react';

interface JbpFormData {
  year: number;
  growthGoals: string;
  revenueTarget: number;
  focusProducts: string;
  targetIndustries: string;
  keyAccounts: string;
  technicalPlan: string;
  marketingActivities: string;
  milestones: string;
}

export function JbpForm({ initialData }: { initialData?: JbpFormData }) {
  const [state, formAction, isPending] = useActionState(submitJbpAction, undefined);
  const currentYear = new Date().getFullYear();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#00B8FF]/10 border border-[#00B8FF]/20 text-[#00B8FF] flex items-center justify-center shrink-0 shadow-inner">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Annual Joint Business Plan Commitments</CardTitle>
            <CardDescription>
              Establish target ARR, key accounts, required engineering certifications, and joint demand-generation commitments.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form action={formAction}>
        <input type="hidden" name="year" value={initialData?.year || currentYear} />

        <CardContent className="space-y-6">
          {state?.error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 shadow-lg shadow-rose-950/20">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
              <span className="font-medium">{state.error}</span>
            </div>
          )}

          {state?.success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 shadow-lg shadow-emerald-950/20">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <span className="font-medium">Joint Business Plan successfully submitted to your OmniPriv Partner Manager.</span>
            </div>
          )}

          {/* Panel A: Commercial Targets */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 dark:bg-[#050B16]/70 border border-white/[0.06] space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <Target className="h-4 w-4 text-[#00B8FF]" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Revenue Targets & Industry Focus
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Target Annual Revenue / Pipeline ($ USD)"
                type="number"
                name="revenueTarget"
                required
                defaultValue={initialData?.revenueTarget || 250000}
                placeholder="e.g. 250000"
                error={state?.fieldErrors?.revenueTarget?.[0]}
              />

              <Input
                label="Primary Focus Products / Editions"
                name="focusProducts"
                required
                defaultValue={initialData?.focusProducts || 'OmniPriv Enterprise PAM Platform'}
                placeholder="e.g. Enterprise PAM, Cloud Broker"
                error={state?.fieldErrors?.focusProducts?.[0]}
              />
            </div>

            <Input
              label="Target Customer Industries & Verticals"
              name="targetIndustries"
              required
              defaultValue={initialData?.targetIndustries || 'Financial Services, Healthcare, Critical Infrastructure'}
              placeholder="e.g. Financial Services, Healthcare"
              error={state?.fieldErrors?.targetIndustries?.[0]}
            />

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-slate-200 block">
                Commercial Growth Strategy <span className="text-[#00B8FF]">*</span>
              </label>
              <textarea
                name="growthGoals"
                rows={3}
                required
                defaultValue={initialData?.growthGoals || ''}
                placeholder="Outline your commercial expansion plans, sales team incentives, and co-selling strategy with OmniPriv reps..."
                className="w-full p-4 rounded-xl bg-slate-950 dark:bg-[#060b17] border border-white/[0.12] text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all duration-150 resize-y"
              />
              {state?.fieldErrors?.growthGoals?.[0] && (
                <p className="text-xs text-rose-400 font-medium">{state.fieldErrors.growthGoals[0]}</p>
              )}
            </div>
          </div>

          {/* Panel B: Accounts & Technical Capacity */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 dark:bg-[#050B16]/70 border border-white/[0.06] space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <Award className="h-4 w-4 text-[#00B8FF]" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Target Accounts & Technical Enablement
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-slate-200 block">
                  Key Target Accounts / Pipeline
                </label>
                <textarea
                  name="keyAccounts"
                  rows={3}
                  defaultValue={initialData?.keyAccounts || ''}
                  placeholder="Specific enterprise accounts targeted for PAM displacement..."
                  className="w-full p-4 rounded-xl bg-slate-950 dark:bg-[#060b17] border border-white/[0.12] text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all duration-150 resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-slate-200 block">
                  Technical Enablement & Certification Plan
                </label>
                <textarea
                  name="technicalPlan"
                  rows={3}
                  defaultValue={initialData?.technicalPlan || ''}
                  placeholder="Staff certifications planned (OCIE/OCSE), lab setups..."
                  className="w-full p-4 rounded-xl bg-slate-950 dark:bg-[#060b17] border border-white/[0.12] text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all duration-150 resize-y"
                />
              </div>
            </div>
          </div>

          {/* Panel C: Demand Gen & Milestones */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 dark:bg-[#050B16]/70 border border-white/[0.06] space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <Megaphone className="h-4 w-4 text-[#00B8FF]" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Demand Gen & Quarterly Milestones
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-slate-200 block">
                  Co-Marketing & Demand-Gen Activities
                </label>
                <textarea
                  name="marketingActivities"
                  rows={3}
                  defaultValue={initialData?.marketingActivities || ''}
                  placeholder="Planned webinars, executive roundtables, joint email campaigns..."
                  className="w-full p-4 rounded-xl bg-slate-950 dark:bg-[#060b17] border border-white/[0.12] text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all duration-150 resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-slate-200 block">
                  Quarterly Milestones
                </label>
                <textarea
                  name="milestones"
                  rows={3}
                  defaultValue={initialData?.milestones || ''}
                  placeholder="Q1: 2 deals registered, Q2: 4 engineers certified..."
                  className="w-full p-4 rounded-xl bg-slate-950 dark:bg-[#060b17] border border-white/[0.12] text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all duration-150 resize-y"
                />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isPending}
            className="gap-2 shadow-lg shadow-[#00B8FF]/20 font-semibold text-xs sm:text-sm"
          >
            {isPending ? (
              <span>Saving Plan...</span>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Joint Business Plan</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
