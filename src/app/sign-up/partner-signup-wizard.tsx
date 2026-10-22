'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { signUpPartnerAction } from '@/lib/actions/auth';
import { OmniPrivLogo } from '@/components/ui/omnipriv-logo';
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export function PartnerSignupWizard() {
  const [step, setStep] = useState<1 | 2>(1);

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
      errors.country = 'Country / headquarters location is required';
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-[#00B8FF]/30">
      {/* 1. Compact Branded Header */}
      <header className="border-b border-white/[0.08] bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <OmniPrivLogo variant="full" showBadge={false} size="md" href="/" priority />

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 hidden sm:inline">Already registered?</span>
            <Link
              href="/sign-in"
              className="text-[#00B8FF] hover:text-[#00D4FF] font-semibold transition-colors flex items-center gap-1"
            >
              <span>Sign in</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Registration Experience */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Dominant Form Surface */}
        <div className="bg-slate-900 border border-white/[0.08] rounded-2xl shadow-xl shadow-black/40 overflow-hidden">
          {/* Form Header with Integrated Horizontal Stepper */}
          <div className="p-6 sm:p-8 border-b border-white/[0.08] bg-slate-900">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Create Your OmniPriv Partner Account
              </h1>
              <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                Register your organization to access Deal Registration, guaranteed margin protection, renewals, and enterprise enablement.
              </p>
            </div>

            {/* Calm Integrated Stepper */}
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex items-center gap-3 text-left transition-all ${
                  step === 1
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    step === 1
                      ? 'bg-[#00B8FF] text-[#020617] ring-4 ring-[#00B8FF]/20'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </div>
                <div>
                  <div className="text-sm font-semibold leading-tight">Company Details</div>
                  <div className="text-xs text-slate-400 hidden sm:block">Legal entity & business model</div>
                </div>
              </button>

              <div
                className={`flex items-center gap-3 text-left transition-all ${
                  step === 2
                    ? 'text-white'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    step === 2
                      ? 'bg-[#00B8FF] text-[#020617] ring-4 ring-[#00B8FF]/20'
                      : 'bg-slate-800 text-slate-400 border border-white/[0.08]'
                  }`}
                >
                  2
                </div>
                <div>
                  <div className="text-sm font-semibold leading-tight">Administrator Account</div>
                  <div className="text-xs text-slate-400 hidden sm:block">Authorized contact & credentials</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8">
            {state?.error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <div className="font-semibold text-rose-200">Registration Failed</div>
                  <div className="text-xs mt-0.5">{state.error}</div>
                </div>
              </div>
            )}

            <form action={formAction} className="space-y-6">
              {/* Hidden inputs to preserve step 1 data across multi-step flow */}
              <input type="hidden" name="companyLegalName" value={formData.companyLegalName} />
              <input type="hidden" name="website" value={formData.website} />
              <input type="hidden" name="country" value={formData.country} />
              <input type="hidden" name="region" value={formData.country} />
              <input type="hidden" name="partnerType" value={formData.partnerType} />
              <input type="hidden" name="primaryFocus" value={formData.primaryFocus} />
              <input type="hidden" name="companyDescription" value={formData.companyDescription} />

              {/* STEP 1: COMPANY PROFILE */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="companyLegalName" className="block text-sm font-medium text-slate-200 mb-1.5">
                        Legal Company Name <span className="text-[#00B8FF]">*</span>
                      </label>
                      <input
                        id="companyLegalName"
                        name="companyLegalName"
                        type="text"
                        required
                        value={formData.companyLegalName}
                        onChange={handleInputChange}
                        placeholder="Apex Cyber Defense Ltd"
                        className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/[0.12] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all"
                      />
                      {(step1Errors.companyLegalName || state?.fieldErrors?.companyLegalName?.[0]) && (
                        <p className="mt-1 text-xs text-rose-400 font-medium">
                          {step1Errors.companyLegalName || state?.fieldErrors?.companyLegalName?.[0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-slate-200 mb-1.5">
                        Company Website <span className="text-[#00B8FF]">*</span>
                      </label>
                      <input
                        id="website"
                        name="website"
                        type="text"
                        required
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="apexcyber.com"
                        className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/[0.12] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all"
                      />
                      {(step1Errors.website || state?.fieldErrors?.website?.[0]) && (
                        <p className="mt-1 text-xs text-rose-400 font-medium">
                          {step1Errors.website || state?.fieldErrors?.website?.[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-slate-200 mb-1.5">
                        Country / Headquarters <span className="text-[#00B8FF]">*</span>
                      </label>
                      <input
                        id="country"
                        name="country"
                        type="text"
                        required
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="United States, Germany, Singapore"
                        className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/[0.12] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all"
                      />
                      {(step1Errors.country || state?.fieldErrors?.country?.[0]) && (
                        <p className="mt-1 text-xs text-rose-400 font-medium">
                          {step1Errors.country || state?.fieldErrors?.country?.[0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="partnerType" className="block text-sm font-medium text-slate-200 mb-1.5">
                        Partner Organization Type <span className="text-[#00B8FF]">*</span>
                      </label>
                      <select
                        id="partnerType"
                        name="partnerType"
                        value={formData.partnerType}
                        onChange={handleInputChange}
                        className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/[0.12] text-white text-sm focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all"
                      >
                        <option value="Reseller">Reseller (VAR / Distributor)</option>
                        <option value="System Integrator">System Integrator (SI / Consulting)</option>
                        <option value="MSP / MSSP">MSP / MSSP (Managed Security Services)</option>
                        <option value="Technology Partner">Technology Partner (Alliance / ISV)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="primaryFocus" className="block text-sm font-medium text-slate-200 mb-1.5">
                      Primary Business Focus
                    </label>
                    <input
                      id="primaryFocus"
                      name="primaryFocus"
                      type="text"
                      value={formData.primaryFocus}
                      onChange={handleInputChange}
                      placeholder="Privileged Access Management (PAM), Cloud Security, Identity Governance"
                      className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/[0.12] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="companyDescription" className="block text-sm font-medium text-slate-200 mb-1.5">
                      Brief Organization Overview <span className="text-slate-500 text-xs font-normal">(Optional)</span>
                    </label>
                    <textarea
                      id="companyDescription"
                      name="companyDescription"
                      rows={3}
                      value={formData.companyDescription}
                      onChange={handleInputChange}
                      placeholder="Brief summary of your cybersecurity practice, target verticals, or commercial regions..."
                      className="w-full p-4 rounded-xl bg-slate-950 border border-white/[0.12] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all resize-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      Step 1 of 2: Company Details
                    </div>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="h-12 px-6 rounded-xl bg-[#00B8FF] hover:bg-[#0099CC] text-[#020617] font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#00B8FF]/10"
                    >
                      <span>Continue to Administrator Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PARTNER OWNER ACCOUNT */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Selected Company Summary */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Registering Organization</div>
                      <div className="text-sm font-semibold text-white">
                        {formData.companyLegalName}{' '}
                        <span className="text-xs font-normal text-slate-400">({formData.partnerType})</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-[#00B8FF] hover:text-[#00D4FF] transition-colors"
                    >
                      Change
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-slate-200 mb-1.5">
                        Administrator Full Name <span className="text-[#00B8FF]">*</span>
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Alex Morgan"
                        className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/[0.12] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all"
                      />
                      {state?.fieldErrors?.fullName?.[0] && (
                        <p className="mt-1 text-xs text-rose-400 font-medium">{state.fieldErrors.fullName[0]}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1.5">
                        Business Work Email <span className="text-[#00B8FF]">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="alex@apexcyber.com"
                        className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/[0.12] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all"
                      />
                      {state?.fieldErrors?.email?.[0] && (
                        <p className="mt-1 text-xs text-rose-400 font-medium">{state.fieldErrors.email[0]}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="jobTitle" className="block text-sm font-medium text-slate-200 mb-1.5">
                        Job Title
                      </label>
                      <input
                        id="jobTitle"
                        name="jobTitle"
                        type="text"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        placeholder="VP of Alliances / Practice Lead"
                        className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/[0.12] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-200 mb-1.5">
                        Business Phone Number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 019-2834"
                        className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/[0.12] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-1.5">
                      Account Password <span className="text-[#00B8FF]">*</span>
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 8 characters with numbers & symbols"
                      className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/[0.12] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all"
                    />
                    {state?.fieldErrors?.password?.[0] && (
                      <p className="mt-1 text-xs text-rose-400 font-medium">{state.fieldErrors.password[0]}</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-950 border border-white/[0.08] cursor-pointer hover:border-white/[0.16] transition-colors">
                      <input
                        type="checkbox"
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={handleInputChange}
                        className="mt-0.5 rounded border-white/[0.2] text-[#00B8FF] focus:ring-[#00B8FF] h-4 w-4 bg-slate-900"
                      />
                      <span className="text-xs text-slate-300 leading-relaxed">
                        I agree to the <span className="text-[#00B8FF] font-medium">OmniPriv Partner Program Agreement</span>,
                        acknowledge the Deal Protection policy rules, and confirm I am authorized to register this organization.
                      </span>
                    </label>
                    {state?.fieldErrors?.termsAccepted?.[0] && (
                      <p className="mt-1.5 text-xs text-rose-400 font-medium">
                        {state.fieldErrors.termsAccepted[0]}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isPending}
                      className="h-12 px-5 rounded-xl border border-white/[0.12] text-slate-300 hover:text-white hover:bg-white/[0.04] text-sm font-medium transition-all flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isPending || !formData.termsAccepted}
                      className="h-12 px-7 rounded-xl bg-[#00B8FF] hover:bg-[#0099CC] text-[#020617] font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#00B8FF]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                          <span>Creating Partner Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Complete Registration</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      {/* 3. Enterprise Footer */}
      <footer className="border-t border-white/[0.08] py-6 text-center text-xs text-slate-500 max-w-5xl mx-auto px-4 w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>&copy; {new Date().getFullYear()} OmniPriv Inc. All rights reserved. Zero Trust Privileged Access Management.</div>
        <div className="flex items-center gap-4 text-slate-500">
          <Link href="/become-a-partner" className="hover:text-slate-400 transition-colors">Program Overview</Link>
          <span>•</span>
          <Link href="/find-a-partner" className="hover:text-slate-400 transition-colors">Partner Directory</Link>
          <span>•</span>
          <Link href="/channel-admin/login" className="hover:text-slate-400 transition-colors">Channel Admin</Link>
        </div>
      </footer>
    </div>
  );
}
