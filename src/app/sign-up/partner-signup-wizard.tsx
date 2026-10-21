'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { signUpPartnerAction } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield,
  Building2,
  User,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Briefcase,
  Phone,
  Mail,
  ShieldAlert,
  Award,
} from 'lucide-react';

export function PartnerSignupWizard() {
  const [step, setStep] = useState<1 | 2>(1);

  // Form state kept in memory so navigation between steps doesn't lose data
  const [formData, setFormData] = useState({
    companyLegalName: '',
    website: '',
    country: '',
    region: '',
    partnerType: 'Reseller',
    primaryFocus: 'Privileged Access Management (PAM) & Zero Trust',
    companyDescription: '',
    fullName: '',
    email: '',
    jobTitle: '',
    phone: '',
    password: '',
    termsAccepted: false,
  });

  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  const [state, formAction, isPending] = useActionState(signUpPartnerAction, undefined);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!formData.companyLegalName.trim()) {
      errors.companyLegalName = 'Legal company name is required';
    }
    if (!formData.website.trim()) {
      errors.website = 'Company website is required';
    }
    if (!formData.country.trim()) {
      errors.country = 'Country / region is required';
    }
    if (!formData.partnerType) {
      errors.partnerType = 'Please select a partner type';
    }

    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/become-a-partner" className="flex items-center gap-3 group">
            <div className="h-8 w-8 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight">OmniPriv</span>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/50 px-2 py-0.5 rounded uppercase tracking-wider">
                Partner Registration
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 hidden sm:inline">Already registered?</span>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-xs">
                Sign In to Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Progress & Channel Value Prop */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-xl bg-slate-900/50 border border-slate-800/80 p-6 space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 font-mono">
                  Kaspersky-Model Channel Program
                </span>
                <h1 className="text-xl font-bold text-white mt-1 tracking-tight">
                  Company Account Setup
                </h1>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Join the OmniPriv partner network to register deals, receive exclusive margin protection, and access qualified enterprise leads.
                </p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4 pt-2">
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    step === 1
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      step === 1
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {step > 1 ? <CheckCircle2 className="h-4 w-4 text-cyan-400" /> : '1'}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Company Profile</div>
                    <div className="text-[11px] text-slate-400">
                      Entity details, partner type & website
                    </div>
                  </div>
                </div>

                <div
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    step === 2
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      step === 2
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    2
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Partner Owner Account</div>
                    <div className="text-[11px] text-slate-400">
                      Authorized admin & login credentials
                    </div>
                  </div>
                </div>
              </div>

              {/* Operational Guarantees */}
              <div className="border-t border-slate-800 pt-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Immediate access to Deal Registration</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Strict organization data isolation</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>No waiting for pending application approval</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Active Step Form */}
          <div className="lg:col-span-8">
            <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 shadow-xl relative backdrop-blur-sm">
              {state?.error && (
                <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{state.error}</span>
                </div>
              )}

              <form action={formAction} className="space-y-6">
                {/* Hidden inputs to preserve step 1 data across form submission */}
                <input type="hidden" name="companyLegalName" value={formData.companyLegalName} />
                <input type="hidden" name="website" value={formData.website} />
                <input type="hidden" name="country" value={formData.country} />
                <input type="hidden" name="region" value={formData.country} />
                <input type="hidden" name="partnerType" value={formData.partnerType} />
                <input type="hidden" name="primaryFocus" value={formData.primaryFocus} />
                <input type="hidden" name="companyDescription" value={formData.companyDescription} />

                {/* STEP 1: COMPANY PROFILE */}
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-cyan-400" />
                          <span>Step 1 — Company Profile</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Tell us about your organization and partner business model.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                        Step 1 of 2
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="Legal Company Name"
                          name="companyLegalName"
                          placeholder="e.g. Apex Cyber Defense Ltd"
                          required
                          value={formData.companyLegalName}
                          onChange={handleInputChange}
                          error={step1Errors.companyLegalName || state?.fieldErrors?.companyLegalName?.[0]}
                        />
                      </div>

                      <div>
                        <Input
                          label="Company Website"
                          name="website"
                          placeholder="e.g. apexcyber.com"
                          required
                          value={formData.website}
                          onChange={handleInputChange}
                          error={step1Errors.website || state?.fieldErrors?.website?.[0]}
                        />
                      </div>

                      <div>
                        <Input
                          label="Country / Region"
                          name="country"
                          placeholder="e.g. United States, Germany, Singapore"
                          required
                          value={formData.country}
                          onChange={handleInputChange}
                          error={step1Errors.country || state?.fieldErrors?.country?.[0]}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-300">
                          Partner Type <span className="text-cyan-400">*</span>
                        </label>
                        <select
                          name="partnerType"
                          value={formData.partnerType}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                        >
                          <option value="Reseller">Reseller (VAR / Distributor)</option>
                          <option value="System Integrator">System Integrator (SI / Consulting)</option>
                          <option value="MSP / MSSP">MSP / MSSP (Managed Security Services)</option>
                          <option value="Technology Partner">Technology Partner (Alliance / ISV)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Input
                        label="Primary Business Focus"
                        name="primaryFocus"
                        placeholder="e.g. Identity & Privileged Access, Cloud Security, SOC Services"
                        value={formData.primaryFocus}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Short Company Description <span className="text-slate-500 text-[11px]">(Optional)</span>
                      </label>
                      <textarea
                        name="companyDescription"
                        rows={3}
                        value={formData.companyDescription}
                        onChange={handleInputChange}
                        placeholder="Brief summary of your company's cybersecurity practices, key customer verticals, and geographic coverage..."
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t border-slate-800/80">
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        variant="primary"
                        size="md"
                        className="gap-2 text-xs font-semibold px-6 shadow-sm shadow-cyan-950"
                      >
                        <span>Continue to Owner Account</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: PARTNER OWNER ACCOUNT */}
                {step === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <User className="h-4 w-4 text-cyan-400" />
                          <span>Step 2 — Partner Owner Account</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Enter the credentials for the authorized company administrator.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                        Step 2 of 2
                      </span>
                    </div>

                    {/* Company Summary Pill */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400">Registering company:</span>{' '}
                        <strong className="text-white">{formData.companyLegalName}</strong> ({formData.partnerType})
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-cyan-400 hover:text-cyan-300 font-medium text-xs underline"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="Full Name"
                          name="fullName"
                          placeholder="e.g. Alex Morgan"
                          required
                          value={formData.fullName}
                          onChange={handleInputChange}
                          error={state?.fieldErrors?.fullName?.[0]}
                        />
                      </div>

                      <div>
                        <Input
                          label="Work Email Address"
                          type="email"
                          name="email"
                          placeholder="e.g. alex@apexcyber.com"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          error={state?.fieldErrors?.email?.[0]}
                        />
                      </div>

                      <div>
                        <Input
                          label="Job Title"
                          name="jobTitle"
                          placeholder="e.g. VP of Alliances, Practice Lead"
                          value={formData.jobTitle}
                          onChange={handleInputChange}
                          error={state?.fieldErrors?.jobTitle?.[0]}
                        />
                      </div>

                      <div>
                        <Input
                          label="Business Phone Number"
                          type="tel"
                          name="phone"
                          placeholder="e.g. +1 555-0199"
                          value={formData.phone}
                          onChange={handleInputChange}
                          error={state?.fieldErrors?.phone?.[0]}
                        />
                      </div>
                    </div>

                    <div>
                      <Input
                        label="Secure Portal Password"
                        type="password"
                        name="password"
                        placeholder="Minimum 8 characters with numbers & symbols"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        error={state?.fieldErrors?.password?.[0]}
                      />
                    </div>

                    <div className="pt-2">
                      <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onChange={handleInputChange}
                          className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 h-4 w-4 bg-slate-900"
                        />
                        <span className="text-xs text-slate-300 leading-relaxed">
                          I agree to the <span className="text-cyan-400 font-medium">OmniPriv Partner Program Agreement</span>,
                          acknowledge the Deal Protection policy rules, and confirm I am authorized to represent this organization.
                        </span>
                      </label>
                      {state?.fieldErrors?.termsAccepted?.[0] && (
                        <p className="mt-1.5 text-xs text-rose-400 font-medium">
                          {state.fieldErrors.termsAccepted[0]}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                      <Button
                        type="button"
                        onClick={() => setStep(1)}
                        variant="ghost"
                        size="md"
                        className="gap-2 text-xs text-slate-400 hover:text-white"
                        disabled={isPending}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Company Profile</span>
                      </Button>

                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={isPending || !formData.termsAccepted}
                        className="gap-2 text-xs font-semibold px-6 shadow-md shadow-cyan-950"
                      >
                        {isPending ? (
                          <>
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                            <span>Creating Partner Workspace...</span>
                          </>
                        ) : (
                          <>
                            <span>Complete & Enter Workspace</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        OmniPriv Channel Partner Portal &bull; Enterprise Deal Protection &bull; Strict Tenant Isolation
      </footer>
    </div>
  );
}
