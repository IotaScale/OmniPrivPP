'use client';

import React, { useActionState } from 'react';
import { updateLocatorProfileAction } from '@/lib/actions/locator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { MapPin, Save, CheckCircle2, ShieldAlert, Globe } from 'lucide-react';

interface LocatorFormData {
  optIn: boolean;
  isApproved: boolean;
  isPublished: boolean;
  publicCompanyName: string;
  publicDescription: string;
  website: string;
  country: string;
  city: string;
}

export function LocatorForm({ initialData }: { initialData?: LocatorFormData }) {
  const [state, formAction, isPending] = useActionState(updateLocatorProfileAction, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-400" />
          <span>Directory Listing Settings</span>
        </CardTitle>
        <CardDescription>
          Control how your company appears to prospective customers looking for certified OmniPriv partners in the public directory.
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

          {state?.success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Locator profile preferences successfully saved.</span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="optIn"
                defaultChecked={initialData?.optIn}
                className="mt-0.5 h-4 w-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white block">
                  Opt-in to the Public OmniPriv Partner Locator
                </span>
                <span className="text-xs text-slate-400 block leading-relaxed">
                  When enabled, your verified company profile will be published on the public partner locator directory after Channel Admin review.
                </span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Public Company Name"
                name="publicCompanyName"
                required
                defaultValue={initialData?.publicCompanyName || ''}
                placeholder="e.g. Apex Security Solutions"
              />
            </div>

            <div>
              <Input
                label="Public Website / Primary Domain"
                name="website"
                defaultValue={initialData?.website || ''}
                placeholder="e.g. https://apexsecurity.com"
              />
            </div>

            <div>
              <Input
                label="Country"
                name="country"
                required
                defaultValue={initialData?.country || ''}
                placeholder="e.g. United States"
              />
            </div>

            <div>
              <Input
                label="Primary City / Headquarters"
                name="city"
                defaultValue={initialData?.city || ''}
                placeholder="e.g. Chicago"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">
              Public Company Summary
            </label>
            <textarea
              name="publicDescription"
              rows={3}
              defaultValue={initialData?.publicDescription || ''}
              placeholder="Short description of your PAM deployment services, cloud security practices, and regional presence..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
            />
          </div>
        </CardContent>

        <CardFooter className="justify-between border-t border-slate-800/80 pt-4">
          <div className="text-xs text-slate-500">
            {initialData?.isPublished ? (
              <span className="text-emerald-400 font-semibold">Listing is Live in Public Directory</span>
            ) : initialData?.optIn ? (
              <span className="text-amber-400">Awaiting Channel Admin Moderation</span>
            ) : (
              <span>Not published in public directory</span>
            )}
          </div>

          <Button type="submit" variant="primary" size="md" disabled={isPending} className="gap-2 text-xs font-semibold">
            {isPending ? (
              <span>Saving Preferences...</span>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Locator Profile</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
