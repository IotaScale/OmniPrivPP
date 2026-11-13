'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

let toasts: ToastItem[] = [];
let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const toast = {
  success: (title: string, description?: string) => {
    addToast('success', title, description);
  },
  error: (title: string, description?: string) => {
    addToast('error', title, description);
  },
  info: (title: string, description?: string) => {
    addToast('info', title, description);
  },
};

function addToast(type: ToastType, title: string, description?: string) {
  const id = Math.random().toString(36).substring(2, 9);
  toasts = [...toasts, { id, type, title, description }];
  emitChange();

  if (typeof window !== 'undefined') {
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  }
}

function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emitChange();
}

export function useToast() {
  return toast;
}

export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const update = () => setCurrentToasts([...toasts]);
    listeners.push(update);
    update();
    return () => {
      listeners = listeners.filter((l) => l !== update);
    };
  }, []);

  if (currentToasts.length === 0) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-full sm:max-w-sm z-[9999] flex flex-col gap-2.5 pointer-events-none"
    >
      {currentToasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="toast-in pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-4 pl-5 text-ink shadow-[var(--op-pop-shadow)]"
        >
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 w-1 ${
              t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-rose-500' : 'bg-brand'
            }`}
          />
          <div className="shrink-0 mt-0.5">
            {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            {t.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-400" />}
            {t.type === 'info' && <Info className="h-5 w-5 text-brand-ink" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[0.875rem] font-semibold text-ink">{t.title}</div>
            {t.description && (
              <div className="text-[0.8125rem] text-ink-muted mt-0.5 leading-relaxed">{t.description}</div>
            )}
          </div>

          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
            className="shrink-0 -m-1 p-1.5 rounded-lg text-ink-subtle hover:text-ink hover:bg-surface-hover transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
