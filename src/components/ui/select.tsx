import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs sm:text-sm font-medium text-slate-200">
            {label}
            {props.required && <span className="text-cyan-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId}
            className={twMerge(
              clsx(
                'w-full h-11 pl-3.5 pr-10 rounded-xl bg-slate-900/90 dark:bg-[#0b1120] border text-slate-100 text-sm focus:outline-none focus:ring-1 transition-[border-color,box-shadow,background-color] duration-160 ease-[cubic-bezier(0.23,1,0.32,1)] appearance-none cursor-pointer',
                error
                  ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20',
                className
              )
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
        {!error && helperText && <span className="text-xs text-slate-500">{helperText}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
