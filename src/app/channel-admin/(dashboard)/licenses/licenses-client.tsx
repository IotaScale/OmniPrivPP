'use client';

import React, { useState, useMemo } from 'react';
import {
  generateProductLicenseAction,
  renewProductLicenseAction,
  revokeProductLicenseAction,
  type ProductLicenseView,
} from '@/lib/actions/admin-licenses';
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  XCircle,
  ClipboardPaste,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ORG_CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]{3,63}$/;

function isValidOrgIdClient(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 4 || trimmed.length > 64) return false;
  return UUID_REGEX.test(trimmed) || ORG_CODE_REGEX.test(trimmed);
}

function computePreviewExpiry(
  durationValue: number,
  durationUnit: 'days' | 'months' | 'years'
): Date {
  const d = new Date();
  if (durationUnit === 'days') d.setDate(d.getDate() + durationValue);
  else if (durationUnit === 'months') d.setMonth(d.getMonth() + durationValue);
  else if (durationUnit === 'years') d.setFullYear(d.getFullYear() + durationValue);
  return d;
}

export function LicensesClient({
  initialLicenses,
}: {
  initialLicenses: ProductLicenseView[];
}) {
  const [orgId, setOrgId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState<'days' | 'months' | 'years'>('years');
  const [maxAssets, setMaxAssets] = useState('');
  const [maxUsers, setMaxUsers] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatedExpiry, setGeneratedExpiry] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const trimmedOrgId = orgId.trim();
  const orgIdValid = trimmedOrgId.length > 0 && isValidOrgIdClient(trimmedOrgId);
  const orgIdInvalid = trimmedOrgId.length > 0 && !orgIdValid;

  const existingActiveForOrg = useMemo(
    () =>
      initialLicenses.find(
        (l) => l.org_id === trimmedOrgId && l.status === 'active'
      ),
    [initialLicenses, trimmedOrgId]
  );

  const previewExpiry = useMemo(
    () => computePreviewExpiry(Math.max(1, Number(durationValue) || 1), durationUnit),
    [durationValue, durationUnit]
  );

  async function handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setOrgId(text.trim());
        setError(null);
      }
    } catch {
      setError('Unable to read clipboard automatically — please press Ctrl+V in the Org ID field.');
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidOrgIdClient(trimmedOrgId)) {
      setError(
        'Invalid OmniPrive Org ID. Paste a valid Organization UUID (e.g. 550e8400-e29b-41d4-a716-446655440000) or ORG-XXXX identifier.'
      );
      return;
    }
    if (!durationValue || Number(durationValue) <= 0) {
      setError('Duration must be a positive whole number.');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedKey(null);
    setGeneratedExpiry(null);
    try {
      const res = await generateProductLicenseAction({
        orgId: trimmedOrgId,
        customerName,
        durationValue: Number(durationValue),
        durationUnit,
        maxAssets: maxAssets.trim() !== '' ? Number(maxAssets) : null,
        maxUsers: maxUsers.trim() !== '' ? Number(maxUsers) : null,
      });
      if (!res.success) {
        setError(res.error || 'Failed to generate license');
      } else {
        setGeneratedKey(res.licenseKey || null);
        setGeneratedExpiry(res.expiresAt || null);
        setOrgId('');
        setCustomerName('');
        setMaxAssets('');
        setMaxUsers('');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Generation Form */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">
              Generate OmniPrive Organization License Key
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Step 1: Paste Org ID from OmniPrive → Step 2: Select Duration & Limits → Step 3: Copy Key back to OmniPrive
          </span>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Org ID with Paste button and live validation */}
            <div className="md:col-span-5">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                OmniPrive Organization ID (<code className="text-cyan-300">org_id</code>) *
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  required
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs text-white font-mono bg-slate-950 ${orgIdInvalid
                    ? 'border-rose-500/70'
                    : orgIdValid
                      ? 'border-emerald-500/70'
                      : 'border-slate-700'
                    }`}
                />
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-2 text-xs text-slate-200 transition"
                  title="Paste Org ID from clipboard"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Paste
                </button>
              </div>
              {orgIdInvalid && (
                <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Invalid format — expected an OmniPrive UUID or ORG-XXXX ID (no spaces).
                </p>
              )}
              {orgIdValid && !existingActiveForOrg && (
                <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Valid OmniPrive Org ID ready for license generation.
                </p>
              )}
              {orgIdValid && existingActiveForOrg && (
                <p className="mt-1 text-[11px] text-amber-300 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> This Org ID already has active key {existingActiveForOrg.license_key}. Generating a new key will automatically supersede it.
                </p>
              )}
            </div>

            {/* Customer / Org Name */}
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Organization / Customer Name
              </label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </div>

            {/* Duration */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                License Duration *
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={3650}
                  required
                  value={durationValue}
                  onChange={(e) => setDurationValue(Number(e.target.value))}
                  className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white"
                />
                <select
                  value={durationUnit}
                  onChange={(e) =>
                    setDurationUnit(e.target.value as 'days' | 'months' | 'years')
                  }
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white"
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>

            {/* Max Assets & Max Users */}
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Max Assets
              </label>
              <input
                type="number"
                min={1}
                placeholder="∞"
                value={maxAssets}
                onChange={(e) => setMaxAssets(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Max Users
              </label>
              <input
                type="number"
                min={1}
                placeholder="∞"
                value={maxUsers}
                onChange={(e) => setMaxUsers(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              <span>
                Expiration preview:{' '}
                <strong className="text-slate-200">
                  {previewExpiry.toISOString().slice(0, 10)}
                </strong>{' '}
                (00:00 UTC daily sync)
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || orgIdInvalid}
              className="rounded-lg bg-[#00B8DB] hover:bg-[#33C6E2] disabled:opacity-50 px-5 py-2 text-xs font-semibold text-[#03121c] transition"
            >
              {loading ? 'Generating & Saving in Supabase…' : 'Generate License Key'}
            </button>
          </div>
        </form>

        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {generatedKey && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-300">
                License Key Generated & Saved in Supabase (Expires:{' '}
                {generatedExpiry ? generatedExpiry.slice(0, 10) : '—'})
              </div>
              <div className="mt-1 font-mono text-sm text-white">{generatedKey}</div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(generatedKey)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-600/50"
            >
              {copiedKey === generatedKey ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy License Key
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Licenses Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Issued Organization Licenses ({initialLicenses.length})
          </h3>
        </div>

        {initialLicenses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No licenses generated yet. Paste an OmniPrive Org ID above to generate a license key.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Org ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">License Key</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Limits (Assets / Users)</th>
                  <th className="px-4 py-3">Expires & Time Left</th>
                  <th className="px-4 py-3">Last Verified by OmniPrive</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {initialLicenses.map((lic) => {
                  const exp = new Date(lic.expires_at);
                  const now = new Date();
                  const diffSec = Math.max(0, Math.floor((exp.getTime() - now.getTime()) / 1000));
                  const daysLeft = Math.floor(diffSec / 86400);
                  const hoursLeft = Math.floor((diffSec % 86400) / 3600);
                  const isExpired = diffSec <= 0 && lic.status === 'active';
                  const displayStatus = isExpired ? 'expired' : lic.status;

                  return (
                    <tr key={lic.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono text-slate-200">{lic.org_id}</td>
                      <td className="px-4 py-3 text-slate-300">{lic.customer_name || '—'}</td>
                      <td className="px-4 py-3 font-mono text-cyan-300">
                        <div className="flex items-center gap-2">
                          <span>{lic.license_key}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(lic.license_key)}
                            className="text-slate-400 hover:text-white"
                            title="Copy License Key"
                          >
                            {copiedKey === lic.license_key ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${displayStatus === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : displayStatus === 'revoked'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                        >
                          {displayStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">
                        {lic.max_assets ?? '∞'} / {lic.max_users ?? '∞'}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <div>{exp.toISOString().slice(0, 10)}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {displayStatus === 'active'
                            ? `${daysLeft}d ${hoursLeft}h remaining`
                            : '0d remaining'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {lic.last_verified_at
                          ? new Date(lic.last_verified_at).toLocaleString()
                          : 'Pending first sync'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            renewProductLicenseAction({
                              id: lic.id,
                              durationValue: 1,
                              durationUnit: 'years',
                            })
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                          title="Extend 1 Year"
                        >
                          <RefreshCw className="h-3 w-3" /> +1Yr
                        </button>
                        {displayStatus === 'active' && (
                          <button
                            type="button"
                            onClick={() => revokeProductLicenseAction(lic.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                            title="Revoke License"
                          >
                            <XCircle className="h-3 w-3" /> Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
