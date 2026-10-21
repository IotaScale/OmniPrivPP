'use client';

import React, { useState } from 'react';
import { createLeadAction, assignLeadAction } from '@/lib/actions/leads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import {
  Inbox,
  UserPlus,
  FileSpreadsheet,
  Plus,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { evaluateLeadSla } from '@/lib/utils/sla';

interface PartnerOption {
  id: string;
  display_name: string;
  tier: string;
}

interface LeadRow {
  id: string;
  public_reference: string;
  company: string;
  customer_domain?: string | null;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  country: string;
  lead_source: string;
  product_interest?: string | null;
  status: string;
  created_at: Date | string;
  assignments: Array<{
    id: string;
    partner_acceptance_status: string;
    acceptance_deadline_at: Date | string;
    accepted_at?: Date | string | null;
    current_status: string;
    organization: { id: string; display_name: string };
    converted_deal?: { id: string; public_reference: string } | null;
  }>;
}

export function LeadManagementClient({
  leads,
  partners,
}: {
  leads: LeadRow[];
  partners: PartnerOption[];
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [assigningLead, setAssigningLead] = useState<LeadRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createLeadAction(fd);
    setIsSubmitting(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setShowCreateModal(false);
    }
  };

  const handleAssignLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (assigningLead) {
      fd.append('leadId', assigningLead.id);
    }
    const res = await assignLeadAction(fd);
    setIsSubmitting(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setAssigningLead(null);
    }
  };

  // CSV Import handler
  const handleCsvImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get('csvFile') as File;

    if (!file || file.size === 0) {
      setError('Please choose a valid CSV file.');
      setIsSubmitting(false);
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setError('CSV must contain a header row and at least one lead row.');
        setIsSubmitting(false);
        return;
      }

      // Expected columns: company, domain, firstName, lastName, email, country, leadSource
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 6) {
          const itemFd = new FormData();
          itemFd.append('company', parts[0]);
          itemFd.append('customerDomain', parts[1]);
          itemFd.append('contactFirstName', parts[2]);
          itemFd.append('contactLastName', parts[3]);
          itemFd.append('contactEmail', parts[4]);
          itemFd.append('country', parts[5]);
          itemFd.append('leadSource', parts[6] || 'CSV Import');
          await createLeadAction(itemFd);
        }
      }

      setShowCsvModal(false);
    } catch {
      setError('Failed to parse CSV file. Ensure valid comma-delimited columns.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Inbox className="h-6 w-6 text-indigo-400" />
            <span>Channel Lead Operations</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Capture inbound demand, assign leads to eligible partners with 7-day SLAs, and monitor conversions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowCsvModal(true)}
            className="gap-2 text-slate-300"
          >
            <Upload className="h-4 w-4" />
            <span>Import CSV</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 border-indigo-500/30"
          >
            <Plus className="h-4 w-4" />
            <span>Create Inbound Lead</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Leads Table */}
      {leads.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 border border-slate-800 rounded-xl bg-slate-900/50">
          No inbound leads recorded yet. Use Create Lead or Import CSV to get started.
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl bg-slate-900/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-6 font-semibold">Reference</th>
                  <th className="py-3 px-6 font-semibold">Company / Domain</th>
                  <th className="py-3 px-6 font-semibold">Contact Person</th>
                  <th className="py-3 px-6 font-semibold">Source</th>
                  <th className="py-3 px-6 font-semibold">Assigned Partner</th>
                  <th className="py-3 px-6 font-semibold">Partner Acceptance</th>
                  <th className="py-3 px-6 font-semibold">SLA Status</th>
                  <th className="py-3 px-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {leads.map((lead) => {
                  const assignment = lead.assignments[0];
                  const sla = assignment
                    ? evaluateLeadSla(
                        new Date(assignment.acceptance_deadline_at),
                        assignment.accepted_at ? new Date(assignment.accepted_at) : null
                      )
                    : null;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-medium text-indigo-300">
                        {lead.public_reference}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-100">
                        <div>{lead.company}</div>
                        <span className="font-mono text-[11px] text-cyan-400 font-normal">
                          {lead.customer_domain || lead.country}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="text-slate-200">
                          {lead.contact_first_name} {lead.contact_last_name}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {lead.contact_email}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-400">{lead.lead_source}</td>
                      <td className="py-3.5 px-6">
                        {assignment ? (
                          <div className="font-medium text-slate-200">
                            {assignment.organization.display_name}
                          </div>
                        ) : (
                          <span className="text-amber-400 font-semibold text-[11px]">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        {assignment ? (
                          <StatusBadge status={assignment.partner_acceptance_status} />
                        ) : (
                          <StatusBadge status="new" />
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        {sla ? (
                          <span
                            className={
                              sla.isBreached
                                ? 'text-rose-400 font-bold'
                                : sla.isUrgent
                                ? 'text-amber-400 font-semibold'
                                : 'text-slate-400'
                            }
                          >
                            {assignment.partner_acceptance_status === 'accepted'
                              ? 'Accepted'
                              : sla.formattedRemaining}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setAssigningLead(lead)}
                        >
                          {assignment ? 'Reassign' : 'Assign Partner'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Partner Modal */}
      {assigningLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-indigo-400" />
              <span>Assign Lead: {assigningLead.company}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Select an authorized partner company. The partner will receive a notification and a 7-day acceptance deadline.
            </p>

            <form onSubmit={handleAssignLead} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Target Partner Organization <span className="text-cyan-400">*</span>
                </label>
                <select
                  name="partnerOrgId"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Choose an eligible partner...</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name} ({p.tier} Tier)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAssigningLead(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500"
                >
                  Confirm Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              <span>Create Inbound Lead</span>
            </h3>

            <form onSubmit={handleCreateLead} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Company Name" name="company" placeholder="e.g. Etihad Airways" required />
                <Input label="Company Domain" name="customerDomain" placeholder="e.g. etihad.ae" />
                <Input label="First Name" name="contactFirstName" placeholder="Ali" required />
                <Input label="Last Name" name="contactLastName" placeholder="Al-Nuaimi" required />
                <Input label="Email" name="contactEmail" type="email" placeholder="ali@etihad.ae" required />
                <Input label="Phone" name="contactPhone" placeholder="+971 2 511 0000" />
                <Input label="Country" name="country" placeholder="United Arab Emirates" required />
                <Input label="Lead Source" name="leadSource" defaultValue="OmniPriv Website Inbound" required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Assign to Partner (Optional)</label>
                <select
                  name="partnerOrgId"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                >
                  <option value="">Leave Unassigned</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name} ({p.tier} Tier)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Prospect Comment / Notes</label>
                <textarea
                  name="customerComment"
                  rows={2}
                  placeholder="Inbound interest notes..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500"
                >
                  Create Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="h-4 w-4 text-indigo-400" />
              <span>Import Leads from CSV</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a valid CSV file with columns:{' '}
              <code className="text-cyan-400">company,domain,firstName,lastName,email,country,source</code>
            </p>

            <form onSubmit={handleCsvImport} className="space-y-4">
              <input
                type="file"
                name="csvFile"
                accept=".csv"
                required
                className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCsvModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500"
                >
                  Import Leads
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
