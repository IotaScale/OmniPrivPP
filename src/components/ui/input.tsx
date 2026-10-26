import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs sm:text-sm font-medium text-slate-200">
            {label}
            {props.required && <span className="text-cyan-400 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            clsx(
              'w-full h-11 px-3.5 rounded-xl bg-slate-900/90 dark:bg-[#0b1120] border text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-1 transition-[border-color,box-shadow,background-color] duration-160 ease-[cubic-bezier(0.23,1,0.32,1)]',
              error
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20',
              className
            )
          )}
          {...props}
        />
        {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
        {!error && helperText && <span className="text-xs text-slate-500">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
