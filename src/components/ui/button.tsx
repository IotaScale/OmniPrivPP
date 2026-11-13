import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

/*
 * Buttons follow omnipriv.com (`hp-btn-primary`, `hp-btn-secondary`,
 * `op-btn-ghost`): one 10px radius, semibold label, solid brand cyan with a
 * soft cyan glow for the primary action, hairline outline for the rest.
 */
const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold rounded-[10px] select-none cursor-pointer ' +
  'transition-[background-color,border-color,box-shadow,color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ' +
  'active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-page ' +
  'disabled:opacity-55 disabled:cursor-not-allowed disabled:active:translate-y-0';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-on-brand border border-transparent hover:bg-brand-hover ' +
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_24px_-10px_rgba(0,184,219,0.6)] ' +
    'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_30px_-10px_rgba(0,184,219,0.75)]',
  secondary:
    'bg-surface text-ink border border-line-strong hover:bg-surface-hover hover:border-ink/25',
  outline:
    'bg-transparent text-ink border border-line-strong hover:border-brand/50 hover:bg-brand/[0.06]',
  danger:
    'bg-rose-600 text-[#ffffff] border border-transparent hover:bg-rose-500 shadow-[0_8px_24px_-12px_rgba(225,29,72,0.6)] focus-visible:ring-rose-500/50',
  ghost:
    'bg-transparent text-ink-muted border border-transparent hover:text-ink hover:bg-surface-hover',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[0.8125rem] gap-1.5',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[0.9375rem]',
};

/** Class string for a button look, for links styled as buttons. */
export function buttonVariants({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return twMerge(clsx(base, variants[variant], sizes[size], className));
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={buttonVariants({ variant, size, className })}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
