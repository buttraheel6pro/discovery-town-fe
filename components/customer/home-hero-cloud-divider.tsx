/** Cream cloud divider below the homepage navbar — overlaps the hero image top edge. */
import Image from 'next/image'

import { cn } from '@/lib/utils'

const HOME_HERO_CLOUD_DIVIDER_SRC = '/Group 1.svg'

interface HomeHeroCloudDividerProps {
  readonly className?: string
  readonly priority?: boolean
}

export function HomeHeroCloudDivider({
  className,
  priority = false,
}: HomeHeroCloudDividerProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 z-0 w-full leading-none',
        className,
      )}
      aria-hidden
    >
      <Image
        src={HOME_HERO_CLOUD_DIVIDER_SRC}
        alt=""
        width={1440}
        height={166}
        priority={priority}
        className="block h-auto w-full"
      />
    </div>
  )
}
