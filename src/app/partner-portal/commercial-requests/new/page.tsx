'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { submitCommercialRequestAction } from '@/lib/actions/commercial-requests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, FileQuestion, Send, ShieldAlert, Sparkles, Building, Layers } from 'lucide-react';

export default function NewCommercialRequestPage() {
  const [state, formAction, isPending] = useActionState(submitCommercialRequestAction, undefined);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <Link href="/partner-portal/commercial-requests">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs border-white/[0.1] text-slate-300">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Requests</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-white/[0.1]" />
          <span className="text-xs text-slate-400 font-medium">New Commercial Assistance</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#00B8FF]/10 border border-[#00B8FF]/20 text-[#00B8FF] flex items-center justify-center shrink-0 shadow-inner">
              <FileQuestion className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Submit Commercial Request</CardTitle>
              <CardDescription>
                Request technical trials, proof-of-concept licenses, internal lab entitlements, or custom pricing assistance from OmniPriv Channel Operations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-6">
            {state?.error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 shadow-lg shadow-rose-950/20">
                <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
                <span className="font-medium">{state.error}</span>
              </div>
            )}

            {/* Panel A: Request Scope */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#050B16]/70 border border-white/[0.06] space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                <Layers className="h-4 w-4 text-[#00B8FF]" />
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Scope & Classification
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Select
                  label="Request Type"
                  name="requestType"
                  required
                  defaultValue="poc"
                >
                  <option value="poc">Proof of Concept (POC) License</option>
                  <option value="customer_trial">Customer Trial Tenant (Cloud)</option>
                  <option value="nfr_license">NFR / Internal Partner Lab License</option>
                  <option value="quote_request">Custom Quote / Deal Pricing Support</option>
                  <option value="order_assistance">Subscription / Order Processing Assistance</option>
                  <option value="license_expansion">License Seat / Node Expansion</option>
                </Select>

                <Input
                  label="Target Customer Name"
                  name="customerName"
                  placeholder="e.g. Acme Corp (leave blank for internal NFR)"
                  helperText="Associated prospect or enterprise client account"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-2">
                  <Input
                    label="Request Title / Subject"
                    name="title"
                    required
                    placeholder="e.g. 30-Day POC for Financial Sector Client (250 PAM Seats)"
                    error={state?.fieldErrors?.title?.[0]}
                  />
                </div>
                <div>
                  <Input
                    label="Estimated Seats / Nodes"
                    type="number"
                    name="seatsNodes"
                    placeholder="e.g. 150"
                  />
                </div>
              </div>
            </div>

            {/* Panel B: Technical Justification */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#050B16]/70 border border-white/[0.06] space-y-3">
              <label className="text-xs sm:text-sm font-medium text-slate-200 block">
                Detailed Scope & Justification <span className="text-[#00B8FF]">*</span>
              </label>
              <textarea
                name="details"
                rows={4}
                required
                placeholder="Describe the opportunity context, technical requirements, success criteria, timeline, and distributor involvement..."
                className="w-full p-4 rounded-xl bg-[#060b17] border border-white/[0.12] text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all duration-150 resize-y"
              />
              {state?.fieldErrors?.details?.[0] && (
                <p className="text-xs text-rose-400 font-medium">{state.fieldErrors.details[0]}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="justify-between">
            <Link href="/partner-portal/commercial-requests">
              <Button type="button" variant="outline" size="md" className="border-white/[0.1] text-slate-300">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isPending}
              className="gap-2 shadow-lg shadow-[#00B8FF]/20"
            >
              {isPending ? (
                <span>Submitting Request...</span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit to Operations</span>
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
