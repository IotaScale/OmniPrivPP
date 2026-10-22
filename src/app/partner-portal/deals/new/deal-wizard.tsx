'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { submitDealRegistrationAction } from '@/lib/actions/deals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Shield,
  Layers,
  UserCheck,
  Briefcase,
  DollarSign,
  Globe,
  Sparkles,
  FileCheck,
} from 'lucide-react';

interface InitialDealData {
  customerLegalName?: string;
  customerDomain?: string;
  customerCountry?: string;
  customerIndustry?: string;
  customerContactName?: string;
  customerContactEmail?: string;
  customerContactPhone?: string;
  productInterest?: string;
  expectedSeatCount?: number;
  leadAssignmentId?: string;
}

export function DealRegistrationWizard({ initialData }: { initialData?: InitialDealData }) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [state, formAction, isPending] = useActionState(submitDealRegistrationAction, undefined);

  // Form state
  const [formData, setFormData] = useState({
    customerLegalName: initialData?.customerLegalName || '',
    customerDomain: initialData?.customerDomain || '',
    customerCountry: initialData?.customerCountry || '',
    customerIndustry: initialData?.customerIndustry || 'Financial Services & Banking',
    customerContactName: initialData?.customerContactName || '',
    customerContactEmail: initialData?.customerContactEmail || '',
    customerContactPhone: initialData?.customerContactPhone || '',
    productInterest: initialData?.productInterest || 'OmniPriv AI-PAM Enterprise Platform (Full 9-Module Suite)',
    deploymentType: 'Cloud SaaS (Dedicated Tenant)',
    estimatedDealValue: '',
    estimatedArr: '',
    currency: 'USD',
    expectedSeatCount: initialData?.expectedSeatCount?.toString() || '150',
    expectedCloseDate: '',
    deploymentTimeline: '1 - 3 Months',
    opportunitySource: 'Partner Direct Sourced',
    partnerNotes: '',
    declarationConfirmed: false,
    leadAssignmentId: initialData?.leadAssignmentId || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const isStep1Valid =
    formData.customerLegalName.trim().length >= 2 &&
    formData.customerDomain.trim().length >= 3 &&
    formData.customerCountry.trim().length >= 2 &&
    formData.customerContactName.trim().length >= 2 &&
    formData.customerContactEmail.includes('@');

  const isStep2Valid =
    formData.productInterest.trim().length >= 2 &&
    formData.deploymentType.trim().length >= 2;

  const steps = [
    { num: 1, title: 'Deal Details', sub: 'Customer & Domain' },
    { num: 2, title: 'Product Details', sub: 'Scope & Architecture' },
    { num: 3, title: 'Review & Submit', sub: 'Verification' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Header with Breadcrumbs & Wizard Stepper */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#00B8FF]/10 border border-[#00B8FF]/20 text-[11px] font-semibold text-[#00B8FF] mb-2 tracking-wide uppercase">
            <Sparkles className="h-3 w-3" />
            <span>Opportunity Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Register Customer Opportunity
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Protect customer opportunity with verified 90-day pricing and margin lock upon Channel Operations approval.
          </p>
        </div>

        {/* Elegant Connected Step Indicator */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/90 dark:bg-[#081222]/90 border border-white/[0.08] p-1.5 rounded-2xl shadow-inner">
          {steps.map((s, idx) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => {
                    if (s.num === 1) setCurrentStep(1);
                    if (s.num === 2 && isStep1Valid) setCurrentStep(2);
                    if (s.num === 3 && isStep1Valid && isStep2Valid) setCurrentStep(3);
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#00B8FF] text-[#030711] shadow-[0_0_16px_rgba(0,184,255,0.4)]'
                      : isCompleted
                      ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center h-5 w-5 rounded-full text-[11px] font-bold ${
                      isActive
                        ? 'bg-[#030711] text-[#00B8FF]'
                        : isCompleted
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-white/[0.08] text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.num}
                  </span>
                  <div className="text-left hidden sm:block">
                    <div className="leading-tight">{s.title}</div>
                  </div>
                </button>
                {idx < steps.length - 1 && (
                  <div className="w-3 h-px bg-white/[0.12] hidden sm:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Global Form Error Banner */}
      {state?.error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 shadow-lg shadow-rose-950/20">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span className="font-medium">{state.error}</span>
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="leadAssignmentId" value={formData.leadAssignmentId} />

        {/* ══════════════════════════════════════════════════════════
            STEP 1: Deal Details
           ══════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#00B8FF]/10 border border-[#00B8FF]/20 text-[#00B8FF] flex items-center justify-center shrink-0 shadow-inner">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Step 1: Customer Account & Domain Intelligence</CardTitle>
                  <CardDescription>
                    Specify legal entity name, primary domain, country, and executive contact for channel conflict verification.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Inner Panel A: Organization & Domain */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 dark:bg-[#050B16]/70 border border-white/[0.06] space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                  <Globe className="h-4 w-4 text-[#00B8FF]" />
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Customer Organization Profile
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Customer Legal Entity Name"
                    name="customerLegalName"
                    placeholder="e.g. Standard Chartered Bank PLC"
                    required
                    value={formData.customerLegalName}
                    onChange={handleChange}
                    error={state?.fieldErrors?.customerLegalName?.[0]}
                  />

                  <Input
                    label="Primary Customer Domain"
                    name="customerDomain"
                    placeholder="e.g. standardchartered.com"
                    helperText="Normalized domain used for automated channel conflict check"
                    required
                    value={formData.customerDomain}
                    onChange={handleChange}
                    error={state?.fieldErrors?.customerDomain?.[0]}
                  />

                  <Input
                    label="Customer Country"
                    name="customerCountry"
                    placeholder="e.g. United Arab Emirates"
                    required
                    value={formData.customerCountry}
                    onChange={handleChange}
                    error={state?.fieldErrors?.customerCountry?.[0]}
                  />

                  <Select
                    label="Industry / Market Sector"
                    name="customerIndustry"
                    value={formData.customerIndustry}
                    onChange={handleChange}
                  >
                    <option value="Financial Services & Banking">Financial Services & Banking</option>
                    <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                    <option value="Government & Defense">Government & Defense</option>
                    <option value="Telecommunications & Media">Telecommunications & Media</option>
                    <option value="Energy & Critical Infrastructure">Energy & Critical Infrastructure</option>
                    <option value="Technology & Cloud Services">Technology & Cloud Services</option>
                    <option value="Manufacturing & Retail">Manufacturing & Retail</option>
                  </Select>
                </div>
              </div>

              {/* Inner Panel B: Primary Stakeholder Contact */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 dark:bg-[#050B16]/70 border border-white/[0.06] space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                  <UserCheck className="h-4 w-4 text-[#00B8FF]" />
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Primary Executive Contact
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Input
                    label="Contact Full Name"
                    name="customerContactName"
                    placeholder="e.g. Tariq Al-Mansoor"
                    required
                    value={formData.customerContactName}
                    onChange={handleChange}
                    error={state?.fieldErrors?.customerContactName?.[0]}
                  />

                  <Input
                    label="Customer Work Email"
                    name="customerContactEmail"
                    type="email"
                    placeholder="e.g. tariq.mansoor@sc.com"
                    required
                    value={formData.customerContactEmail}
                    onChange={handleChange}
                    error={state?.fieldErrors?.customerContactEmail?.[0]}
                  />

                  <Input
                    label="Contact Phone / Mobile"
                    name="customerContactPhone"
                    placeholder="e.g. +971 4 500 1234"
                    value={formData.customerContactPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="justify-between">
              <Link href="/partner-portal/deals">
                <Button type="button" variant="outline" size="md" className="border-white/[0.1] text-slate-300">
                  Cancel
                </Button>
              </Link>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!isStep1Valid}
                onClick={() => setCurrentStep(2)}
                className="gap-2 shadow-lg shadow-[#00B8FF]/20"
              >
                <span>Continue to Product Scope</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 2: Product & Commercial Scope
           ══════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#00B8FF]/10 border border-[#00B8FF]/20 text-[#00B8FF] flex items-center justify-center shrink-0 shadow-inner">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Step 2: Architecture & Commercial Parameters</CardTitle>
                  <CardDescription>
                    Select the target OmniPriv solution edition, deployment preference, capacity sizing, and estimated contract value.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Inner Panel A: Solution Architecture */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 dark:bg-[#050B16]/70 border border-white/[0.06] space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                  <Briefcase className="h-4 w-4 text-[#00B8FF]" />
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    OmniPriv Edition & Architecture
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Select
                    label="Product / Edition Interest"
                    name="productInterest"
                    value={formData.productInterest}
                    onChange={handleChange}
                    required
                  >
                    <option value="OmniPriv AI-PAM Enterprise Platform (Full 9-Module Suite)">OmniPriv AI-PAM Enterprise Platform (Full 9-Module Suite)</option>
                    <option value="OmniPriv Secure AI Agents & MCP Tool Governance">OmniPriv Secure AI Agents & MCP Tool Governance</option>
                    <option value="OmniPriv Isolated Credential Vault (3-Level KEK/DEK/SEK)">OmniPriv Isolated Credential Vault (3-Level KEK/DEK/SEK)</option>
                    <option value="OmniPriv Secure Remote Access (VPN-Free RDP/SSH Proxy)">OmniPriv Secure Remote Access (VPN-Free RDP/SSH Proxy)</option>
                    <option value="OmniPriv AI Threat Protection (39 Behavioral Features & 10s Auto-Block)">OmniPriv AI Threat Protection (39 Behavioral Features & 10s Auto-Block)</option>
                    <option value="OmniPriv Audit & Compliance Suite (HMAC-SHA256 Chained Logs)">OmniPriv Audit & Compliance Suite (HMAC-SHA256 Chained Logs)</option>
                  </Select>

                  <Select
                    label="Deployment Architecture"
                    name="deploymentType"
                    value={formData.deploymentType}
                    onChange={handleChange}
                    required
                  >
                    <option value="Cloud SaaS (Dedicated Tenant)">Cloud SaaS (Dedicated Tenant)</option>
                    <option value="Customer-Hosted / Air-Gapped Appliance">Customer-Hosted / Air-Gapped Appliance</option>
                    <option value="Hybrid Multi-Cloud Deployment">Hybrid Multi-Cloud Deployment</option>
                  </Select>
                </div>
              </div>

              {/* Inner Panel B: Commercial Scope */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 dark:bg-[#050B16]/70 border border-white/[0.06] space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                  <DollarSign className="h-4 w-4 text-[#00B8FF]" />
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Commercial Sizing & Timeline
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <Select
                    label="Currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SAR">SAR (﷼)</option>
                    <option value="AED">AED (د.إ)</option>
                  </Select>

                  <Input
                    label="Estimated Deal Value"
                    name="estimatedDealValue"
                    type="number"
                    placeholder="e.g. 75000"
                    value={formData.estimatedDealValue}
                    onChange={handleChange}
                  />

                  <Input
                    label="Target Privileged Seats"
                    name="expectedSeatCount"
                    type="number"
                    placeholder="e.g. 150"
                    value={formData.expectedSeatCount}
                    onChange={handleChange}
                  />

                  <Input
                    label="Expected Close Date"
                    name="expectedCloseDate"
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="pt-2">
                  <Select
                    label="Projected Procurement Timeline"
                    name="deploymentTimeline"
                    value={formData.deploymentTimeline}
                    onChange={handleChange}
                  >
                    <option value="Immediate (< 30 Days)">Immediate (&lt; 30 Days)</option>
                    <option value="1 - 3 Months">1 - 3 Months</option>
                    <option value="3 - 6 Months">3 - 6 Months</option>
                    <option value="Budgetary / Next Fiscal Year">Budgetary / Next Fiscal Year</option>
                  </Select>
                </div>
              </div>

              {/* Inner Panel C: Strategic Context */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 dark:bg-[#050B16]/70 border border-white/[0.06] space-y-3">
                <label className="text-xs sm:text-sm font-medium text-slate-200 block">
                  Partner Strategic Notes & Competitive Incumbent Displacement
                </label>
                <textarea
                  name="partnerNotes"
                  rows={3}
                  placeholder="Customer environment, incumbent vendor displacement (e.g. replacing CyberArk, BeyondTrust), key security stakeholders..."
                  className="w-full p-4 rounded-xl bg-slate-950 dark:bg-[#060b17] border border-white/[0.12] text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 transition-all duration-150 resize-y"
                  value={formData.partnerNotes}
                  onChange={handleChange}
                />
              </div>
            </CardContent>

            <CardFooter className="justify-between">
              <Button type="button" variant="outline" size="md" onClick={() => setCurrentStep(1)} className="gap-2 border-white/[0.1] text-slate-300">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!isStep2Valid}
                onClick={() => setCurrentStep(3)}
                className="gap-2 shadow-lg shadow-[#00B8FF]/20"
              >
                <span>Review Deal Summary</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 3: Review & Submit
           ══════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#00B8FF]/10 border border-[#00B8FF]/20 text-[#00B8FF] flex items-center justify-center shrink-0 shadow-inner">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Step 3: Verification & Channel Submission</CardTitle>
                  <CardDescription>
                    Verify all commercial details before submitting to OmniPriv Channel Operations.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Executive Summary Sheet */}
              <div className="rounded-2xl bg-slate-900/80 dark:bg-[#050B16]/80 border border-white/[0.08] overflow-hidden">
                <div className="px-6 py-3.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Deal Registration Summary Sheet
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#00B8FF]/15 text-[#00B8FF] text-[11px] font-mono font-semibold">
                    Draft Pending
                  </span>
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium block">Customer Entity</span>
                    <span className="font-semibold text-slate-100 text-sm block">{formData.customerLegalName}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium block">Verified Domain</span>
                    <span className="font-mono text-[#00B8FF] font-semibold text-sm block">
                      {formData.customerDomain.toLowerCase().trim()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium block">Territory & Industry</span>
                    <span className="text-slate-200 block">
                      {formData.customerCountry} &bull; {formData.customerIndustry}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium block">Executive Sponsor</span>
                    <span className="text-slate-200 block">
                      {formData.customerContactName} ({formData.customerContactEmail})
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium block">OmniPriv Architecture</span>
                    <span className="text-slate-200 block">
                      {formData.productInterest} &bull; {formData.deploymentType}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium block">Commercial Sizing</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm block">
                      {formData.currency} {formData.estimatedDealValue ? Number(formData.estimatedDealValue).toLocaleString() : 'TBD'}{' '}
                      <span className="text-slate-400 font-normal text-xs">({formData.expectedSeatCount} seats)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* OmniPriv 90-Day Protection Notice Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#00B8FF]/10 via-[#0A1D35]/50 to-transparent border border-[#00B8FF]/30 text-xs text-slate-300 space-y-2 shadow-lg shadow-[#00B8FF]/5">
                <div className="font-semibold flex items-center gap-2.5 text-[#00B8FF] text-sm">
                  <Shield className="h-4 w-4" />
                  <span>OmniPriv 90-Day Exclusive Price & Margin Protection Guarantee</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-xs">
                  Upon submission, your deal enters <strong className="text-amber-300">Awaiting Approval</strong>. OmniPriv Channel Operations verifies your customer account against conflicting vendor registrations. Once approved, your organization receives <strong className="text-emerald-400">90 days of exclusive deal protection</strong>, preferred partner pricing discounts, and dedicated Presales engineering support.
                </p>
              </div>

              {/* Mandatory Partner Declaration Box */}
              <div
                className={`p-5 rounded-2xl border transition-all duration-200 ${
                  formData.declarationConfirmed
                    ? 'bg-[#00B8FF]/5 border-[#00B8FF]/40 ring-1 ring-[#00B8FF]/20'
                    : 'bg-slate-900/80 dark:bg-[#050B16]/80 border-white/[0.08]'
                }`}
              >
                <label className="flex items-start gap-3.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="declarationConfirmed"
                    checked={formData.declarationConfirmed}
                    onChange={handleChange}
                    className="mt-1 h-4.5 w-4.5 rounded-lg bg-slate-950 dark:bg-[#060b17] border-white/[0.2] text-[#00B8FF] focus:ring-[#00B8FF] focus:ring-offset-0 cursor-pointer"
                    required
                  />
                  <div className="space-y-1">
                    <span className="text-xs sm:text-sm font-medium text-slate-200 block">
                      Authorized Commercial Engagement Declaration
                    </span>
                    <span className="text-xs text-slate-400 leading-relaxed block">
                      I declare and confirm on behalf of our partner organization that we have established direct, verified commercial engagement with this customer entity regarding OmniPriv Privileged Access Management solutions.
                    </span>
                  </div>
                </label>
                {state?.fieldErrors?.declarationConfirmed && (
                  <p className="text-xs text-rose-400 mt-2.5 ml-8 font-medium">
                    {state.fieldErrors.declarationConfirmed[0]}
                  </p>
                )}
              </div>

              {/* Hidden fields for server action form submission */}
              <input type="hidden" name="customerLegalName" value={formData.customerLegalName} />
              <input type="hidden" name="customerDomain" value={formData.customerDomain} />
              <input type="hidden" name="customerCountry" value={formData.customerCountry} />
              <input type="hidden" name="customerIndustry" value={formData.customerIndustry} />
              <input type="hidden" name="customerContactName" value={formData.customerContactName} />
              <input type="hidden" name="customerContactEmail" value={formData.customerContactEmail} />
              <input type="hidden" name="customerContactPhone" value={formData.customerContactPhone} />
              <input type="hidden" name="productInterest" value={formData.productInterest} />
              <input type="hidden" name="deploymentType" value={formData.deploymentType} />
              <input type="hidden" name="currency" value={formData.currency} />
              <input type="hidden" name="estimatedDealValue" value={formData.estimatedDealValue} />
              <input type="hidden" name="expectedSeatCount" value={formData.expectedSeatCount} />
              <input type="hidden" name="expectedCloseDate" value={formData.expectedCloseDate} />
              <input type="hidden" name="deploymentTimeline" value={formData.deploymentTimeline} />
              <input type="hidden" name="opportunitySource" value={formData.opportunitySource} />
              <input type="hidden" name="partnerNotes" value={formData.partnerNotes} />
            </CardContent>

            <CardFooter className="justify-between">
              <Button type="button" variant="outline" size="md" onClick={() => setCurrentStep(2)} className="gap-2 border-white/[0.1] text-slate-300">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!formData.declarationConfirmed}
                isLoading={isPending}
                className="gap-2 shadow-lg shadow-[#00B8FF]/20"
              >
                <span>Submit Deal Registration</span>
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  );
}
