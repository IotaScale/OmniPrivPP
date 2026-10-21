import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    outline: 'bg-transparent text-slate-300 border-slate-700',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase font-semibold',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    draft: { label: 'Draft', variant: 'neutral' },
    awaiting_approval: { label: 'Awaiting Approval', variant: 'warning' },
    approved: { label: 'Approved & Protected', variant: 'success' },
    declined: { label: 'Declined', variant: 'danger' },
    closed_won: { label: 'Closed Won', variant: 'success' },
    closed_lost: { label: 'Closed Lost', variant: 'outline' },
    expired: { label: 'Protection Expired', variant: 'danger' },
    pending: { label: 'Pending Acceptance', variant: 'warning' },
    accepted: { label: 'Accepted', variant: 'success' },
    working: { label: 'In Progress', variant: 'info' },
    qualified: { label: 'Qualified', variant: 'success' },
    disqualified: { label: 'Disqualified', variant: 'outline' },
    converted: { label: 'Converted to Deal', variant: 'info' },
    active: { label: 'Active', variant: 'success' },
    suspended: { label: 'Suspended', variant: 'danger' },
  };

  const conf = map[status] || { label: status, variant: 'neutral' };
  return <Badge variant={conf.variant}>{conf.label}</Badge>;
}
