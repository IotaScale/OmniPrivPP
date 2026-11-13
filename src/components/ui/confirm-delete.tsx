'use client';

import React, { useCallback, useEffect, useId, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from './button';
import { Input } from './input';
import { toast } from './toast';

export interface ConfirmDeleteResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface ConfirmDeleteProps {
  /** Dialog heading, e.g. "Delete partner organization". */
  title: string;
  /** Name of the record, shown in bold in the dialog body. */
  entityName: string;
  /** Optional extra sentence under the name. */
  description?: React.ReactNode;
  /** What will be removed, e.g. ["3 users", "5 deals"]. */
  impacts?: string[];
  /** Highlighted warning (e.g. external systems affected). */
  warning?: React.ReactNode;
  /** When set, the admin must type this exact text to enable the confirm button. */
  confirmPhrase?: string;
  /** Server action wrapper. Receives the typed confirmation text ('' when none). */
  action: (confirmation: string) => Promise<ConfirmDeleteResult>;
  /** Called after a successful delete (before any redirect). */
  onDeleted?: () => void;
  /** Navigate here after a successful delete. */
  redirectTo?: string;
  /** Trigger label (default "Delete"). */
  triggerLabel?: string;
  /** Icon-only trigger (still has an accessible label). */
  iconOnly?: boolean;
  /** When set, the trigger is disabled and this explains why (tooltip + sr text). */
  disabledReason?: string;
  className?: string;
}

const triggerClass =
  'h-7 px-2.5 text-xs gap-1 text-rose-600 dark:text-rose-400 border-rose-500/30 ' +
  'hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-700 dark:hover:text-rose-300 ' +
  'focus-visible:ring-rose-500/40';

/**
 * Destructive action pattern for the Channel Admin console: a small "Delete"
 * danger button that opens a confirm dialog listing what will be removed.
 * Authorization is enforced by the server action, never by this component.
 */
export function ConfirmDelete({
  title,
  entityName,
  description,
  impacts,
  warning,
  confirmPhrase,
  action,
  onDeleted,
  redirectTo,
  triggerLabel = 'Delete',
  iconOnly = false,
  disabledReason,
  className,
}: ConfirmDeleteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();
  const inputId = useId();

  const phraseOk = !confirmPhrase || typed.trim() === confirmPhrase.trim();

  const close = useCallback(() => {
    if (isPending) return;
    setOpen(false);
    setTyped('');
    setError(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, [isPending]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTarget = confirmPhrase ? inputRef.current : cancelRef.current;
    focusTarget?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, confirmPhrase]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleConfirm = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!phraseOk || isPending) return;
    setError(null);
    startTransition(async () => {
      let res: ConfirmDeleteResult;
      try {
        res = await action(confirmPhrase ? typed : '');
      } catch {
        res = { success: false, error: 'The delete request failed. Please try again.' };
      }
      if (!res?.success) {
        setError(res?.error || 'Delete failed.');
        toast.error('Delete failed', res?.error);
        return;
      }
      toast.success('Deleted', res.message);
      setOpen(false);
      setTyped('');
      onDeleted?.();
      if (redirectTo) router.push(redirectTo);
    });
  };

  const trigger = (
    <Button
      ref={triggerRef}
      type="button"
      variant="outline"
      size="sm"
      className={twMerge(clsx(triggerClass, iconOnly && 'w-7 px-0', className))}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabledReason) setOpen(true);
      }}
      disabled={Boolean(disabledReason)}
      title={disabledReason || `${triggerLabel} ${entityName}`}
      aria-label={iconOnly ? `${triggerLabel} ${entityName}` : undefined}
      aria-haspopup="dialog"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      {!iconOnly && <span>{triggerLabel}</span>}
      {disabledReason && <span className="sr-only">({disabledReason})</span>}
    </Button>
  );

  const dialog =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            // Clicks inside a portal still bubble through the React tree (e.g. to a
            // clickable table row); stop them here.
            onClick={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) close();
            }}
            onKeyDown={handleKeyDown}
          >
            <div
              ref={panelRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descId}
              className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface text-ink-soft shadow-[var(--op-pop-shadow)]"
            >
              <form onSubmit={handleConfirm}>
                <div className="flex items-start gap-3 px-5 pt-5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 id={titleId} className="font-heading text-base font-bold text-ink leading-snug">
                      {title}
                    </h2>
                    <p id={descId} className="mt-1 text-[0.8125rem] text-ink-muted leading-relaxed break-words">
                      <strong className="font-semibold text-ink">{entityName}</strong> will be permanently
                      deleted. This cannot be undone.
                      {description ? <> {description}</> : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    disabled={isPending}
                    aria-label="Close"
                    className="-m-1 shrink-0 rounded-lg p-1.5 text-ink-subtle hover:bg-surface-hover hover:text-ink transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 px-5 py-4">
                  {impacts && impacts.length > 0 && (
                    <div className="rounded-xl border border-line bg-surface-muted px-3.5 py-3">
                      <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
                        Also removed
                      </div>
                      <ul className="mt-1.5 space-y-1 text-[0.8125rem] text-ink-soft">
                        {impacts.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span aria-hidden="true" className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-rose-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {warning && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-amber-800 dark:text-amber-300">
                      {warning}
                    </div>
                  )}

                  {confirmPhrase && (
                    <div className="space-y-1.5">
                      <label htmlFor={inputId} className="block text-[0.8125rem] text-ink-soft">
                        Type <strong className="font-semibold text-ink select-all">{confirmPhrase}</strong> to
                        confirm.
                      </label>
                      <Input
                        ref={inputRef}
                        id={inputId}
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        disabled={isPending}
                        aria-invalid={typed.length > 0 && !phraseOk ? true : undefined}
                      />
                    </div>
                  )}

                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[0.8125rem] text-rose-700 dark:text-rose-300"
                    >
                      {error}
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-muted px-5 py-3.5 sm:flex-row sm:justify-end">
                  <Button
                    ref={cancelRef}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={close}
                    disabled={isPending}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    isLoading={isPending}
                    disabled={!phraseOk}
                    className="w-full sm:w-auto"
                  >
                    {!isPending && <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                    <span>{isPending ? 'Deleting…' : 'Delete permanently'}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {disabledReason ? (
        // Disabled buttons do not show tooltips in every browser; the wrapper does.
        <span title={disabledReason} className="inline-flex">
          {trigger}
        </span>
      ) : (
        trigger
      )}
      {dialog}
    </>
  );
}
