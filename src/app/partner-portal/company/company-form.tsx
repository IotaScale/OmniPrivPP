'use client';

import React, { useState } from 'react';
import { updateCompanyProfileAction } from '@/lib/actions/partner-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Building, Lock, CheckCircle2, ShieldAlert, Globe, Briefcase } from 'lucide-react';

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
    <Card className="max-w-4xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#00B8DB]/10 border border-[#00B8DB]/20 text-[#00B8DB] flex items-center justify-center shrink-0 shadow-inner">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Organization Profile & Channel Settings</CardTitle>
            <CardDescription>
              Manage legal business details, regional operating territories, and partner categorization.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 shadow-lg shadow-rose-950/20">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 shadow-lg shadow-emerald-950/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="font-medium">Company profile successfully updated!</span>
            </div>
          )}

          {/* Locked Fields Section */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 dark:bg-[#15171a]/90 border border-white/[0.08] space-y-4">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold uppercase tracking-wider pb-2 border-b border-white/[0.06]">
              <Lock className="h-3.5 w-3.5 text-[#00B8DB]" />
              <span>Channel Governance Locked Attributes</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-medium block">Legal Entity Name</span>
                <span className="text-slate-100 font-semibold text-sm block">{org.legalName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium block">Program Tier</span>
                <span className="font-semibold text-[#00B8DB] text-sm block">{org.tier} Partner</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium block">Incorporation Country</span>
                <span className="text-slate-100 font-semibold text-sm block">{org.country}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Legal company changes or partner tier advancements require Channel Operations authorization. Contact your assigned OmniPriv Partner Manager for tier upgrades.
            </p>
          </div>

          {/* Editable Fields Section */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 dark:bg-[#15171a]/70 border border-white/[0.06] space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <Globe className="h-4 w-4 text-[#00B8DB]" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Commercial Display & Operating Details
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                label="Region / Operating Territory"
                name="region"
                defaultValue={org.region}
                disabled={!isOwner}
                required
              />

              <Select
                label="Partner Classification"
                name="partnerType"
                defaultValue={org.partnerType}
                disabled={!isOwner}
              >
                <option value="Value Added Reseller (VAR)">Value Added Reseller (VAR)</option>
                <option value="System Integrator (SI)">System Integrator (SI)</option>
                <option value="Managed Security Service Provider (MSSP)">Managed Security Service Provider (MSSP)</option>
                <option value="Cybersecurity Advisory / Consultant">Cybersecurity Advisory / Consultant</option>
                <option value="Distributor">Distributor</option>
              </Select>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-slate-200 block">
                  Company Overview & Practice Focus
                </label>
                <textarea
                  name="companySummary"
                  rows={3}
                  defaultValue={org.companySummary || ''}
                  disabled={!isOwner}
                  placeholder="Enterprise security competencies, customer base focus, technical PAM certifications..."
                  className="w-full p-4 rounded-xl bg-slate-950 dark:bg-[#0b0c0e] border border-white/[0.12] text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#00B8DB] focus:ring-2 focus:ring-[#00B8DB]/20 transition-all duration-150 resize-y disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </CardContent>

        {isOwner && (
          <CardFooter className="justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="shadow-lg shadow-[#00B8DB]/20"
            >
              <span>Save Profile Changes</span>
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
