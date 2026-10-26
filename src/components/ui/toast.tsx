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
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {currentToasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
            t.type === 'success'
              ? 'bg-[#0f172a]/95 border-emerald-500/30 text-white'
              : t.type === 'error'
              ? 'bg-[#0f172a]/95 border-rose-500/30 text-white'
              : 'bg-[#0f172a]/95 border-cyan-500/30 text-white'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            {t.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-400" />}
            {t.type === 'info' && <Info className="h-5 w-5 text-cyan-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold tracking-wide text-white">{t.title}</div>
            {t.description && (
              <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{t.description}</div>
            )}
          </div>

          <button
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
            className="shrink-0 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
