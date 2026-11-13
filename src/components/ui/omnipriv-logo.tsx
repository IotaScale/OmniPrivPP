import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface OmniPrivLogoProps {
  variant?: 'full' | 'icon' | 'partner' | 'admin';
  href?: string;
  className?: string;
  iconOnly?: boolean;
  priority?: boolean;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/*
 * Wordmark as used in the omnipriv.com header: `omnipriv-light.png` on light
 * surfaces, `omniprivdark.png` on dark ones, 32px tall. The product label sits
 * beside it as a small cyan chip ("Partner Portal" / "Channel Admin").
 */
export function OmniPrivLogo({
  variant = 'full',
  href,
  className = '',
  iconOnly = false,
  priority = true,
  showBadge = true,
  size = 'md',
}: OmniPrivLogoProps) {
  const heightClass = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-9' : 'h-8';
  const badgeLabel = variant === 'partner' ? 'Partner Portal' : variant === 'admin' ? 'Channel Admin' : null;

  const content = (
    <span className={`flex items-center gap-2.5 select-none min-w-0 ${className}`}>
      {iconOnly ? (
        <Image
          src="/omnipriv-icon.png"
          alt="OmniPriv"
          width={32}
          height={32}
          className="h-8 w-8 object-contain shrink-0"
          priority={priority}
        />
      ) : (
        <>
          <span className={`relative ${heightClass} w-auto shrink-0 flex items-center`}>
            <Image
              src="/omnipriv-light.png"
              alt="OmniPriv"
              width={160}
              height={40}
              className={`${heightClass} w-auto object-contain dark:hidden`}
              priority={priority}
            />
            <Image
              src="/omniprivdark.png"
              alt="OmniPriv"
              width={160}
              height={40}
              className={`${heightClass} w-auto object-contain hidden dark:block`}
              priority={priority}
            />
          </span>

          {showBadge && badgeLabel && (
            <span className="hidden min-[400px]:inline-flex items-center text-[0.6875rem] font-semibold leading-5 px-2 rounded-md whitespace-nowrap bg-brand/10 text-brand-ink border border-brand/20">
              {badgeLabel}
            </span>
          )}
        </>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={badgeLabel ? `OmniPriv ${badgeLabel}` : 'OmniPriv'}
        className="inline-flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 hover:opacity-90 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return content;
}
