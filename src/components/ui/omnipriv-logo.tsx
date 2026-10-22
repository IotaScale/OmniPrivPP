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

export function OmniPrivLogo({
  variant = 'full',
  href,
  className = '',
  iconOnly = false,
  priority = true,
  showBadge = true,
  size = 'md',
}: OmniPrivLogoProps) {
  const heightClass = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-10' : 'h-8';

  const content = (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {iconOnly ? (
        <div className="relative h-8 w-8 flex-shrink-0">
          <Image
            src="/icon.svg"
            alt="OmniPriv"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority={priority}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <div className={`relative ${heightClass} w-auto flex-shrink-0 flex items-center`}>
            <Image
              src="/omniprivdark.png"
              alt="OmniPriv"
              width={160}
              height={40}
              className={`${heightClass} w-auto object-contain`}
              priority={priority}
            />
          </div>

          {showBadge && variant === 'partner' && (
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#00B8FF]/10 text-[#00B8FF] border border-[#00B8FF]/30 whitespace-nowrap">
              Partner
            </span>
          )}

          {showBadge && variant === 'admin' && (
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 whitespace-nowrap">
              Channel Admin
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
