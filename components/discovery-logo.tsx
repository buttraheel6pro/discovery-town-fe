/** Brand logo — Discovery-logo.svg from /public. */
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export const DISCOVERY_LOGO_SRC = '/Discovery-logo.svg' as const
export const DISCOVERY_LOGO_ALT = 'Discovery Town' as const

/** Cropped viewBox aspect ratio (1101 × 643). */
const LOGO_WIDTH = 1101
const LOGO_HEIGHT = 643

export type DiscoveryLogoSize = 'nav' | 'admin' | 'footer'

const SIZE_CLASS: Record<DiscoveryLogoSize, string> = {
  nav: 'h-12 w-auto min-w-[10.5rem] sm:h-14 sm:min-w-[12rem]',
  admin: 'h-12 w-auto min-w-[10.5rem]',
  footer: 'h-16 w-auto min-w-[12rem] sm:h-[4.5rem] sm:min-w-[14rem]',
}

interface DiscoveryLogoProps {
  readonly className?: string
  readonly imageClassName?: string
  readonly size?: DiscoveryLogoSize
  /** Set to `false` to render without a link wrapper. */
  readonly href?: string | false
  readonly priority?: boolean
}

export function DiscoveryLogo({
  className,
  imageClassName,
  size = 'nav',
  href = '/',
  priority = false,
}: DiscoveryLogoProps) {
  const image = (
    <Image
      src={DISCOVERY_LOGO_SRC}
      alt={DISCOVERY_LOGO_ALT}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={cn('object-contain object-left', SIZE_CLASS[size], imageClassName)}
      priority={priority}
    />
  )

  if (href === false) {
    return <div className={cn('flex items-center shrink-0', className)}>{image}</div>
  }

  return (
    <Link href={href} className={cn('flex items-center shrink-0', className)}>
      {image}
    </Link>
  )
}
