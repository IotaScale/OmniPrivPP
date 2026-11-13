'use client';

import React, { useState } from 'react';
import { createRenewalAction } from '@/lib/actions/admin-partners';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { RefreshCw, Plus, Calendar, DollarSign, Building } from 'lucide-react';

interface PartnerOption {
  id: string;
  display_name: string;
}

interface RenewalRow {
  id: string;
  customer_name: string;
  product_plan: string;
  contracted_capacity?: string | null;
  renewal_date: Date | string;
  contract_value?: number | null;
  currency: string;
  commercial_status: string;
  organization: {
    id: string;
    display_name: string;
  };
}

export function ChannelAdminRenewalsClient({
  renewals,
  partners,
}: {
  renewals: RenewalRow[];
  partners: PartnerOption[];
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createRenewalAction(fd);
    setIsSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setShowCreateModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <RefreshCw className="h-6 w-6 text-cyan-400" />
            <span>Commercial Renewals Operations</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global channel renewals pipeline, contracted PAM seats, and partner assignment.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreateModal(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Renewal Record</span>
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {renewals.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 border border-slate-800 rounded-xl bg-slate-900/50">
          No renewal records found across partner organizations.
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl bg-slate-900/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-6 font-semibold">Customer Account</th>
                  <th className="py-3 px-6 font-semibold">Managing Partner</th>
                  <th className="py-3 px-6 font-semibold">Product Plan</th>
                  <th className="py-3 px-6 font-semibold">Contracted Capacity</th>
                  <th className="py-3 px-6 font-semibold">Contract Value</th>
                  <th className="py-3 px-6 font-semibold">Renewal Date</th>
                  <th className="py-3 px-6 font-semibold">Commercial Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {renewals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-100">
                      {r.customer_name}
                    </td>
                    <td className="py-3.5 px-6 text-slate-200">
                      {r.organization.display_name}
                    </td>
                    <td className="py-3.5 px-6 text-slate-300">{r.product_plan}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-300">
                      {r.contracted_capacity || 'Standard'}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-medium text-emerald-400">
                      {r.contract_value ? `${r.currency} ${r.contract_value.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-300">
                      {new Date(r.renewal_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={r.commercial_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Renewal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-cyan-400" />
              <span>Create Customer Renewal</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Managing Partner</label>
                <select
                  name="partnerOrgId"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                >
                  <option value="">Select Partner Organization...</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <Input label="Customer Name" name="customerName" placeholder="e.g. Barclays Bank" required />
              <Input label="Product Plan" name="productPlan" placeholder="OmniPriv Enterprise PAM Platform" required />
              <Input label="Contracted Capacity" name="contractedCapacity" placeholder="250 Managed Targets" />

              <div className="grid grid-cols-2 gap-3">
                <Input label="Renewal Date" name="renewalDate" type="date" required />
                <Input label="Contract Value (USD)" name="contractValue" type="number" placeholder="85000" />
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
                 
                >
                  Save Renewal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
