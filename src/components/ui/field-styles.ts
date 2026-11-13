/**
 * Shared form field tokens, matching omnipriv.com `lib/form-styles.ts`:
 * 12px radius, hairline border, white (light) / #0B0C0E (dark) fill and a
 * cyan focus ring. 16px text on phones prevents iOS Safari zoom on focus.
 */
export const fieldLabelClass = 'block text-[0.8125rem] font-semibold text-ink-soft';

export const fieldBaseClass =
  'w-full rounded-xl border bg-field text-ink placeholder:text-ink-subtle text-base sm:text-[0.9375rem] ' +
  'outline-none transition-[border-color,box-shadow,background-color] duration-200 ' +
  'focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed';

export const fieldStateClass = {
  normal: 'border-field-line hover:border-line-strong focus:border-brand/70 focus:ring-brand/20',
  error: 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/20',
} as const;

export const fieldErrorClass = 'text-[0.8125rem] font-medium text-rose-400';

export const fieldHelperClass = 'text-[0.8125rem] text-ink-subtle';
