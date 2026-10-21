'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { submitDealRegistrationAction } from '@/lib/actions/deals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  Shield,
  Layers,
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
    customerIndustry: initialData?.customerIndustry || 'Financial Services',
    customerContactName: initialData?.customerContactName || '',
    customerContactEmail: initialData?.customerContactEmail || '',
    customerContactPhone: initialData?.customerContactPhone || '',
    productInterest: initialData?.productInterest || 'OmniPriv Enterprise PAM Platform',
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Wizard Steps Indicator */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Register Customer Opportunity
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit deal for OmniPriv review. Protection window begins upon Channel Admin approval.
          </p>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: 'Customer' },
            { num: 2, label: 'Opportunity' },
            { num: 3, label: 'Review & Submit' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (s.num === 1) setCurrentStep(1);
                  if (s.num === 2 && isStep1Valid) setCurrentStep(2);
                  if (s.num === 3 && isStep1Valid && isStep2Valid) setCurrentStep(3);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  currentStep === s.num
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : currentStep > s.num
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                <span>{s.num}.</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {s.num < 3 && <span className="text-slate-700">/</span>}
            </div>
          ))}
        </div>
      </div>

      {state?.error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="leadAssignmentId" value={formData.leadAssignmentId} />

        {/* STEP 1: Customer Details */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-cyan-400" />
                <span>Step 1: Customer Details & Normalized Domain</span>
              </CardTitle>
              <CardDescription>
                Provide the legal entity and primary domain of the prospective client.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  placeholder="e.g. sc.com or standardchartered.com"
                  helperText="Used for automated channel domain conflict checking"
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

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Industry / Sector</label>
                  <select
                    name="customerIndustry"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
                  Customer Primary Contact
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <Button type="button" variant="outline" size="sm">
                  Cancel
                </Button>
              </Link>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!isStep1Valid}
                onClick={() => setCurrentStep(2)}
                className="gap-1.5"
              >
                <span>Continue to Opportunity</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 2: Opportunity Details */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <span>Step 2: Opportunity & Scope Details</span>
              </CardTitle>
              <CardDescription>
                Specify the PAM solution plan, capacity, expected value, and timelines.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Product / Plan Interest <span className="text-cyan-400">*</span>
                  </label>
                  <select
                    name="productInterest"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={formData.productInterest}
                    onChange={handleChange}
                  >
                    <option value="OmniPriv Enterprise PAM Platform">OmniPriv Enterprise PAM Platform</option>
                    <option value="OmniPriv Cloud-Native PAM (SaaS)">OmniPriv Cloud-Native PAM (SaaS)</option>
                    <option value="OmniPriv Zero-Trust Privilege Broker">OmniPriv Zero-Trust Privilege Broker</option>
                    <option value="OmniPriv Endpoint Privilege Management">OmniPriv Endpoint Privilege Management</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Deployment Architecture <span className="text-cyan-400">*</span>
                  </label>
                  <select
                    name="deploymentType"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={formData.deploymentType}
                    onChange={handleChange}
                  >
                    <option value="Cloud SaaS (Dedicated Tenant)">Cloud SaaS (Dedicated Tenant)</option>
                    <option value="Customer-Hosted / Air-Gapped Appliance">Customer-Hosted / Air-Gapped Appliance</option>
                    <option value="Hybrid Multi-Cloud Deployment">Hybrid Multi-Cloud Deployment</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">Currency</label>
                    <select
                      name="currency"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-sm"
                      value={formData.currency}
                      onChange={handleChange}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="SAR">SAR (﷼)</option>
                      <option value="AED">AED (د.إ)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      label="Estimated Total Deal Value"
                      name="estimatedDealValue"
                      type="number"
                      placeholder="e.g. 75000"
                      value={formData.estimatedDealValue}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <Input
                  label="Expected Target Privileged Seats"
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

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Deployment Timeline</label>
                  <select
                    name="deploymentTimeline"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-sm"
                    value={formData.deploymentTimeline}
                    onChange={handleChange}
                  >
                    <option value="Immediate (< 30 Days)">Immediate (&lt; 30 Days)</option>
                    <option value="1 - 3 Months">1 - 3 Months</option>
                    <option value="3 - 6 Months">3 - 6 Months</option>
                    <option value="Budgetary / Next Fiscal Year">Budgetary / Next Fiscal Year</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Partner Strategic Notes & Technical Context
                  </label>
                  <textarea
                    name="partnerNotes"
                    rows={3}
                    placeholder="Customer environment, incumbent vendor displacement (e.g. replacing CyberArk), key security stakeholders..."
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={formData.partnerNotes}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!isStep2Valid}
                onClick={() => setCurrentStep(3)}
                className="gap-1.5"
              >
                <span>Review Deal Summary</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 3: Review & Submit */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>Step 3: Review Opportunity & Confirm Declaration</span>
              </CardTitle>
              <CardDescription>
                Verify commercial facts before submitting to OmniPriv Channel review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block">Customer Entity:</span>
                  <span className="font-semibold text-slate-200 text-sm">{formData.customerLegalName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Normalized Domain:</span>
                  <span className="font-mono text-cyan-400 font-semibold">{formData.customerDomain.toLowerCase().trim()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Location & Sector:</span>
                  <span className="text-slate-300">{formData.customerCountry} • {formData.customerIndustry}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Primary Stakeholder:</span>
                  <span className="text-slate-300">{formData.customerContactName} ({formData.customerContactEmail})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">PAM Product & Architecture:</span>
                  <span className="text-slate-300">{formData.productInterest} • {formData.deploymentType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estimated Commercial Scope:</span>
                  <span className="text-slate-300 font-mono">
                    {formData.currency} {formData.estimatedDealValue ? Number(formData.estimatedDealValue).toLocaleString() : 'TBD'} • {formData.expectedSeatCount} seats
                  </span>
                </div>
              </div>

              {/* Protection Notice Box */}
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 space-y-1.5">
                <div className="font-semibold flex items-center gap-2 text-cyan-300">
                  <Shield className="h-4 w-4" />
                  <span>OmniPriv 90-Day Protection Notice</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Your deal registration will enter <strong className="text-amber-400">Awaiting Approval</strong> status. OmniPriv Channel Ops reviews registrations against active protections and domain conflicts. Once approved, your organization receives <strong className="text-emerald-400">90-day exclusive deal protection</strong> and registered pricing support.
                </p>
              </div>

              {/* Mandatory Declaration Checkbox */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="declarationConfirmed"
                    checked={formData.declarationConfirmed}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    required
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    I declare and confirm that our partner company has established active, verified commercial engagement with this customer entity regarding OmniPriv Privileged Access Management solutions.
                  </span>
                </label>
                {state?.fieldErrors?.declarationConfirmed && (
                  <p className="text-xs text-rose-400 mt-2 ml-7">
                    {state.fieldErrors.declarationConfirmed[0]}
                  </p>
                )}
              </div>

              {/* Hidden fields for actual form submission */}
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
              <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!formData.declarationConfirmed}
                isLoading={isPending}
                className="gap-2"
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
