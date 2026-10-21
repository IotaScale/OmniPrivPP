'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { submitCommercialRequestAction } from '@/lib/actions/commercial-requests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, FileQuestion, Send, ShieldAlert } from 'lucide-react';

export default function NewCommercialRequestPage() {
  const [state, formAction, isPending] = useActionState(submitCommercialRequestAction, undefined);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/partner-portal/commercial-requests">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Requests</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-cyan-400" />
            <span>Submit Commercial Request</span>
          </CardTitle>
          <CardDescription>
            Request technical trials, proof-of-concept licenses, internal lab entitlements, or custom pricing assistance from OmniPriv Channel Operations.
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{state.error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Request Type <span className="text-cyan-400">*</span>
                </label>
                <select
                  name="requestType"
                  required
                  defaultValue="poc"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="poc">Proof of Concept (POC) License</option>
                  <option value="customer_trial">Customer Trial Tenant (Cloud)</option>
                  <option value="nfr_license">NFR / Internal Partner Lab License</option>
                  <option value="quote_request">Custom Quote / Deal Pricing Support</option>
                  <option value="order_assistance">Subscription / Order Processing Assistance</option>
                  <option value="license_expansion">License Seat / Node Expansion</option>
                </select>
              </div>

              <div>
                <Input
                  label="Target Customer Name"
                  name="customerName"
                  placeholder="e.g. Acme Corp (leave blank for internal NFR)"
                  helperText="Associated prospect or enterprise client"
                />
              </div>
            </div>

            <div>
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
                label="Estimated Seats / Target Nodes"
                type="number"
                name="seatsNodes"
                placeholder="e.g. 150"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">
                Detailed Scope & Justification <span className="text-cyan-400">*</span>
              </label>
              <textarea
                name="details"
                rows={4}
                required
                placeholder="Describe the opportunity context, technical requirements, success criteria, timeline, and distributor involvement..."
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
              />
              {state?.fieldErrors?.details?.[0] && (
                <p className="text-xs text-rose-400 font-medium">{state.fieldErrors.details[0]}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="justify-end border-t border-slate-800/80 pt-4">
            <Button type="submit" variant="primary" size="md" disabled={isPending} className="gap-2 text-xs font-semibold">
              {isPending ? (
                <span>Submitting Request...</span>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
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
