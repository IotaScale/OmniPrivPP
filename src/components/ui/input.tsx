import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  fieldBaseClass,
  fieldErrorClass,
  fieldHelperClass,
  fieldLabelClass,
  fieldStateClass,
} from './field-styles';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const describedBy = inputId && (error || helperText) ? `${inputId}-desc` : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={fieldLabelClass}>
            {label}
            {props.required && <span className="text-brand-ink ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={twMerge(
            clsx(
              fieldBaseClass,
              'h-11 px-3.5',
              error ? fieldStateClass.error : fieldStateClass.normal,
              className
            )
          )}
          {...props}
        />
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

Input.displayName = 'Input';
