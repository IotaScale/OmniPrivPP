import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'neutral';
  size?: 'sm' | 'md';
}

/*
 * Status pills in the omnipriv.com style: fully rounded, hairline border in
 * the tone colour, tinted fill, small semibold label. Tone colours resolve to
 * darker shades in the light theme via the palette remap in globals.css.
 */
export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-brand/10 text-brand-ink border-brand/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    outline: 'bg-transparent text-ink-muted border-line-strong',
    neutral: 'bg-surface-hover text-ink-soft border-line',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[0.6875rem]',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold leading-5 tracking-[0.01em]',
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

/** Partner organization account status. */
export function OrgStatusBadge({ status, size = 'md' }: { status: string; size?: BadgeProps['size'] }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    active: { label: 'Active', variant: 'success' },
    suspended: { label: 'Suspended', variant: 'danger' },
  };
  const conf = map[status] || { label: status, variant: 'neutral' };
  return (
    <Badge variant={conf.variant} size={size}>
      {conf.label}
    </Badge>
  );
}
