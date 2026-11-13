'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { Megaphone, Plus, Send, X } from 'lucide-react';
import { createCampaignAction, type CreateCampaignState } from '@/lib/actions/admin-campaigns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import {
  fieldBaseClass,
  fieldErrorClass,
  fieldHelperClass,
  fieldLabelClass,
  fieldStateClass,
} from '@/components/ui/field-styles';

function TextArea({
  name,
  label,
  rows = 4,
  required,
  helper,
  error,
  placeholder,
}: {
  name: string;
  label: string;
  rows?: number;
  required?: boolean;
  helper?: string;
  error?: string;
  placeholder?: string;
}) {
  const id = `campaign-${name}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
        {!required && <span className="ml-1 font-normal text-ink-subtle">(optional)</span>}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={`${fieldBaseClass} ${error ? fieldStateClass.error : fieldStateClass.normal} px-3.5 py-2.5 leading-relaxed`}
      />
      {error ? <p className={fieldErrorClass}>{error}</p> : helper ? <p className={fieldHelperClass}>{helper}</p> : null}
    </div>
  );
}

export function CreateCampaignForm({ partnerUserCount }: { partnerUserCount: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<CreateCampaignState | undefined, FormData>(
    createCampaignAction,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state?.fieldErrors;

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      if (!state.recipients) {
        toast.success('Campaign published', 'Partners were notified in the portal.');
      } else if (state.emailConfigured) {
        toast.success(
          'Campaign published',
          `Emailing ${state.recipients} partner user${state.recipients === 1 ? '' : 's'} from partner@omnipriv.com.`
        );
      } else {
        toast.info(
          'Campaign published — email not configured',
          'Partners were notified in the portal. Set SMTP_* on the server to email them too.'
        );
      }
      formRef.current?.reset();
      setOpen(false);
    } else if (state.error) {
      toast.error('Campaign not created', state.error);
    }
  }, [state]);

  if (!open) {
    return (
      <Button type="button" variant="primary" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New campaign
      </Button>
    );
  }

  return (
    <section
      aria-labelledby="new-campaign-heading"
      className="w-full p-5 sm:p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="new-campaign-heading" className="text-base font-bold text-white flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-cyan-400" />
            New campaign
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Published campaigns appear for every partner in the portal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          aria-label="Close new campaign form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form ref={formRef} action={formAction} className="space-y-4">
        <Input name="title" label="Campaign title" required maxLength={160} error={fe?.title?.[0]} placeholder="e.g. Secure AI Agents Q3 push" />
        <TextArea name="summary" label="Summary" required rows={3} error={fe?.summary?.[0]} placeholder="What the campaign is about and who it helps." />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input name="relatedProduct" label="Product" required maxLength={120} error={fe?.relatedProduct?.[0]} placeholder="OmniPriv AI-PAM Enterprise Platform" />
          <Input name="targetAudience" label="Target audience" required maxLength={300} error={fe?.targetAudience?.[0]} placeholder="CISOs, Heads of Infrastructure" />
          <Input name="startDate" label="Start date" type="date" required error={fe?.startDate?.[0]} />
          <Input name="endDate" label="End date (optional)" type="date" error={fe?.endDate?.[0]} />
        </div>

        <Input
          name="assetsUrl"
          label="Assets link (optional)"
          type="url"
          placeholder="https://…"
          error={fe?.assetsUrl?.[0]}
          helperText="Shared folder with decks, banners and one-pagers."
        />
        <TextArea name="emailCopy" label="Email copy for partners" rows={5} error={fe?.emailCopy?.[0]} helper="Ready-to-send copy partners can use with their customers." />
        <TextArea name="socialCopy" label="Social copy" rows={3} error={fe?.socialCopy?.[0]} />

        <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/40 cursor-pointer">
          <input type="checkbox" name="notifyPartners" defaultChecked className="mt-0.5 h-4 w-4 accent-cyan-500" />
          <span className="text-sm">
            <span className="font-semibold text-slate-200">Email all partners</span>
            <span className="block text-xs text-slate-400 mt-0.5">
              Sends an announcement from partner@omnipriv.com to {partnerUserCount} active partner user
              {partnerUserCount === 1 ? '' : 's'}. Every partner organization also gets an in-portal notification.
            </span>
          </span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" className="gap-1.5" isLoading={isPending}>
            <Send className="h-4 w-4" />
            Publish campaign
          </Button>
        </div>
      </form>
    </section>
  );
}
