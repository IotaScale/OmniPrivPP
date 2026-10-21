'use client';

import React, { useActionState } from 'react';
import { submitJbpAction } from '@/lib/actions/jbp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { TrendingUp, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

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
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          <span>Annual Plan Commitments</span>
        </CardTitle>
        <CardDescription>
          Establish target ARR, key accounts, required engineering certifications, and joint demand-generation commitments.
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <input type="hidden" name="year" value={initialData?.year || currentYear} />

        <CardContent className="space-y-4">
          {state?.error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{state.error}</span>
            </div>
          )}

          {state?.success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Joint Business Plan successfully submitted to your OmniPriv Partner Manager.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Target Annual Revenue / Pipeline ($ USD)"
                type="number"
                name="revenueTarget"
                required
                defaultValue={initialData?.revenueTarget || 250000}
                placeholder="e.g. 250000"
                error={state?.fieldErrors?.revenueTarget?.[0]}
              />
            </div>

            <div>
              <Input
                label="Primary Focus Products / Editions"
                name="focusProducts"
                required
                defaultValue={initialData?.focusProducts || 'OmniPriv Enterprise PAM Platform'}
                placeholder="e.g. Enterprise PAM, Cloud Broker"
                error={state?.fieldErrors?.focusProducts?.[0]}
              />
            </div>
          </div>

          <div>
            <Input
              label="Target Customer Industries & Verticals"
              name="targetIndustries"
              required
              defaultValue={initialData?.targetIndustries || 'Financial Services, Healthcare, Critical Infrastructure'}
              placeholder="e.g. Financial Services, Healthcare"
              error={state?.fieldErrors?.targetIndustries?.[0]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">
              Commercial Growth Goals & Strategy <span className="text-cyan-400">*</span>
            </label>
            <textarea
              name="growthGoals"
              rows={3}
              required
              defaultValue={initialData?.growthGoals || ''}
              placeholder="Outline your commercial expansion plans, sales team incentives, and co-selling strategy with OmniPriv reps..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
            />
            {state?.fieldErrors?.growthGoals?.[0] && (
              <p className="text-xs text-rose-400">{state.fieldErrors.growthGoals[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Key Target Accounts / Pipeline</label>
              <textarea
                name="keyAccounts"
                rows={2}
                defaultValue={initialData?.keyAccounts || ''}
                placeholder="Specific enterprise accounts targeted for PAM replacement..."
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Technical Enablement Plan</label>
              <textarea
                name="technicalPlan"
                rows={2}
                defaultValue={initialData?.technicalPlan || ''}
                placeholder="Staff certifications planned (OCIE/OCSE), lab setups..."
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Co-Marketing & Demand-Gen Activities</label>
              <textarea
                name="marketingActivities"
                rows={2}
                defaultValue={initialData?.marketingActivities || ''}
                placeholder="Planned webinars, executive roundtables, email campaigns..."
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Quarterly Milestones</label>
              <textarea
                name="milestones"
                rows={2}
                defaultValue={initialData?.milestones || ''}
                placeholder="Q1: 2 deals submitted, Q2: 4 engineers certified..."
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-end border-t border-slate-800/80 pt-4">
          <Button type="submit" variant="primary" size="md" disabled={isPending} className="gap-2 text-xs font-semibold">
            {isPending ? (
              <span>Saving Plan...</span>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Submit Joint Business Plan</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
