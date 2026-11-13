'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { revealPartnerLicenseKeyAction } from '@/lib/actions/partner-licenses';

/**
 * Copies a license key for Partner Owners. The full key is fetched on click
 * (and audited) rather than embedded in the page.
 */
export function CopyLicenseKeyButton({ licenseId, keyTail }: { licenseId: string; keyTail: string }) {
  const [state, setState] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function fetchKey(): Promise<string> {
    const res = await revealPartnerLicenseKeyAction(licenseId);
    if (!res.licenseKey) throw new Error(res.error || 'Could not copy the license key.');
    return res.licenseKey;
  }

  async function handleCopy() {
    setState('copying');
    setMessage(null);
    try {
      // Safari only allows clipboard writes inside the click gesture, so hand
      // it a pending ClipboardItem; other browsers can await then write.
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const blob = fetchKey().then((key) => new Blob([key], { type: 'text/plain' }));
        await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
      } else {
        const key = await fetchKey();
        await navigator.clipboard.writeText(key);
      }
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error && err.message ? err.message : 'Could not copy the license key.');
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleCopy}
        disabled={state === 'copying'}
        aria-label={`Copy full license key ending ${keyTail}`}
        title="Copy full license key"
        className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-line-strong px-2.5 text-[0.75rem] font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:bg-brand/[0.06] hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-60"
      >
        {state === 'copied' ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span>{state === 'copying' ? 'Copying…' : 'Copy key'}</span>
          </>
        )}
      </button>
      <span aria-live="polite" className="text-[0.6875rem] text-rose-400">
        {state === 'error' ? message : null}
      </span>
    </span>
  );
}
