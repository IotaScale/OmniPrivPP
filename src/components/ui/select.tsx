import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';
import {
  fieldBaseClass,
  fieldErrorClass,
  fieldHelperClass,
  fieldLabelClass,
  fieldStateClass,
} from './field-styles';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const describedBy = selectId && (error || helperText) ? `${selectId}-desc` : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className={fieldLabelClass}>
            {label}
            {props.required && <span className="text-brand-ink ml-1">*</span>}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={twMerge(
              clsx(
                fieldBaseClass,
                'h-11 pl-3.5 pr-10 appearance-none cursor-pointer',
                error ? fieldStateClass.error : fieldStateClass.normal,
                className
              )
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink-subtle">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && (
          <span id={describedBy} className={fieldErrorClass}>
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={describedBy} className={fieldHelperClass}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
