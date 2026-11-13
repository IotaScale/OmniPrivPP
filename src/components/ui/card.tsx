import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/*
 * Cards follow omnipriv.com surfaces: white with a navy-at-8% hairline and a
 * barely-there shadow in light; #15171A with a white-at-8% hairline in dark.
 */
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        clsx(
          'relative rounded-2xl bg-surface border border-line text-ink-soft shadow-[var(--op-card-shadow)] transition-colors duration-200 overflow-hidden',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        clsx('px-5 sm:px-6 py-4 sm:py-5 border-b border-line flex flex-col gap-1', className)
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={twMerge(
        clsx(
          'font-heading text-base sm:text-[1.0625rem] font-bold text-ink tracking-[-0.015em] leading-snug flex items-center gap-2',
          className
        )
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={twMerge(clsx('text-[0.8125rem] sm:text-sm text-ink-muted leading-relaxed', className))}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge(clsx('px-6 py-5', className))} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        clsx(
          'px-5 sm:px-6 py-4 border-t border-line bg-surface-muted flex flex-wrap items-center justify-between gap-3',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
