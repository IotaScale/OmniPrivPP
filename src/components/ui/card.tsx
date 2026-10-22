import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        clsx(
          'relative rounded-2xl bg-gradient-to-b from-[#0c182c]/95 via-[#081222]/95 to-[#060c18]/95 border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.45)] text-slate-100 backdrop-blur-md overflow-hidden ring-1 ring-white/[0.03]',
          className
        )
      )}
      {...props}
    >
      {/* Subtle top inner sheen line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00B8FF]/20 to-transparent" />
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
        clsx(
          'px-6 sm:px-8 py-5 sm:py-6 border-b border-white/[0.06] bg-gradient-to-r from-white/[0.02] via-transparent to-transparent flex flex-col gap-1.5',
          className
        )
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
          'text-base sm:text-lg font-semibold text-slate-100 tracking-tight flex items-center gap-2.5',
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
      className={twMerge(
        clsx('text-xs sm:text-sm text-slate-400 leading-relaxed', className)
      )}
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
    <div className={twMerge(clsx('px-6 sm:px-8 py-6 sm:py-7', className))} {...props}>
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
          'px-6 sm:px-8 py-4 sm:py-5 border-t border-white/[0.06] bg-[#040813]/90 flex items-center justify-between',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
