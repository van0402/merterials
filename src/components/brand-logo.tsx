import React from 'react';

import { cn } from '@/lib/utils';

export const SMEE_LOGO_SRC = '/images/smee-logo.png';

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  alt?: string;
}

export function BrandLogo({
  className,
  imageClassName,
  alt = 'SMEE logo',
}: BrandLogoProps) {
  return (
    <div className={cn('flex items-center justify-center overflow-hidden', className)}>
      <img
        src={SMEE_LOGO_SRC}
        alt={alt}
        className={cn('h-full w-full object-contain', imageClassName)}
      />
    </div>
  );
}
