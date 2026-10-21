'use client';

import React, { useState } from 'react';
import { updateCompanyProfileAction } from '@/lib/actions/partner-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Building, Lock, CheckCircle2 } from 'lucide-react';

interface OrgData {
  legalName: string;
  displayName: string;
  website: string;
  country: string;
  region: string;
  partnerType: string;
  tier: string;
  status: string;
  companySummary?: string | null;
}

export function CompanyProfileForm({
  org,
  isOwner,
}: {
  org: OrgData;
  isOwner: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const fd = new FormData(e.currentTarget);
    const res = await updateCompanyProfileAction(fd);
    setIsSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-4 w-4 text-cyan-400" />
          <span>Organization Profile & Settings</span>
        </CardTitle>
        <CardDescription>
          Commercial contact information and regional settings for your partner company.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Company profile successfully updated!</span>
            </div>
          )}

          {/* Locked Fields Section */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <span>Channel Governance Locked Fields</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Legal Entity Name:</span>
                <span className="text-slate-200 font-semibold">{org.legalName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Partner Tier:</span>
                <span className="font-semibold text-cyan-400">{org.tier}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Country:</span>
                <span className="text-slate-200 font-semibold">{org.country}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Legal company changes or partner tier advancements require Channel Operations authorization.
            </p>
          </div>

          {/* Editable Fields Section */}
          <div className="space-y-4">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Commercial Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Commercial Display Name"
                name="displayName"
                defaultValue={org.displayName}
                disabled={!isOwner}
                required
              />

              <Input
                label="Company Website / Domain"
                name="website"
                defaultValue={org.website}
                disabled={!isOwner}
                required
              />

              <Input
                label="Region / Territory"
                name="region"
                defaultValue={org.region}
                disabled={!isOwner}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Partner Classification</label>
                <select
                  name="partnerType"
                  defaultValue={org.partnerType}
                  disabled={!isOwner}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-60"
                >
                  <option value="Value Added Reseller (VAR)">Value Added Reseller (VAR)</option>
                  <option value="System Integrator (SI)">System Integrator (SI)</option>
                  <option value="Managed Security Service Provider (MSSP)">Managed Security Service Provider (MSSP)</option>
                  <option value="Cybersecurity Advisory / Consultant">Cybersecurity Advisory / Consultant</option>
                  <option value="Distributor">Distributor</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Company Overview & Focus</label>
                <textarea
                  name="companySummary"
                  rows={3}
                  defaultValue={org.companySummary || ''}
                  disabled={!isOwner}
                  placeholder="Enterprise security competencies, customer base focus, technical PAM certifications..."
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </CardContent>

        {isOwner && (
          <CardFooter className="justify-end">
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Save Profile Changes
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
