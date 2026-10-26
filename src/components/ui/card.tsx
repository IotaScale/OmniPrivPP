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
          'relative rounded-xl bg-slate-900 dark:bg-[#0d1424] border border-slate-800 text-slate-100 shadow-sm transition-colors duration-160 overflow-hidden',
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
        clsx(
          'px-6 py-5 border-b border-slate-800 flex flex-col gap-1',
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
          'text-base sm:text-lg font-semibold text-slate-100 tracking-tight flex items-center gap-2',
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
        clsx('text-xs sm:text-sm text-slate-400 leading-normal', className)
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
          'px-6 py-4 border-t border-slate-800 bg-slate-950/60 dark:bg-[#0a0f1a] flex items-center justify-between',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
