/** Homepage explore card — scroll-reveal, lazy image, and hover interactions. */
'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { LazyFadeImage } from '@/components/customer/lazy-fade-image'
import { useInView } from '@/hooks/use-in-view'
import { cn } from '@/lib/utils'

export type HomeExploreCardAccent = 'primary' | 'accent' | 'chart-4' | 'chart-5'
export type HomeExploreCardSize = 'tile' | 'wide' | 'banner'
export type HomeExploreCardReveal = 'up' | 'left' | 'right'

const ACCENT_BUTTON_CLASSES: Record<HomeExploreCardAccent, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
  'chart-4': 'bg-chart-4 text-white hover:brightness-110',
  'chart-5': 'bg-chart-5 text-foreground hover:brightness-110',
}

const ACCENT_RING_CLASSES: Record<HomeExploreCardAccent, string> = {
  primary: 'hover:ring-primary/40',
  accent: 'hover:ring-accent/40',
  'chart-4': 'hover:ring-chart-4/40',
  'chart-5': 'hover:ring-chart-5/40',
}

const EXPLORE_CARD_IMAGE_OVERLAY_CLASS = 'bg-[#DA7C35]/30'

const SIZE_CLASSES: Record<HomeExploreCardSize, string> = {
  tile: 'min-h-[13.5rem] sm:min-h-[15rem] md:min-h-[17.5rem]',
  wide: 'min-h-[13.5rem] sm:min-h-[15rem]',
  banner: 'min-h-[14rem] sm:min-h-[16rem] md:min-h-[18rem]',
}

function hiddenRevealClass(revealFrom: HomeExploreCardReveal): string {
  switch (revealFrom) {
    case 'left':
      return '-translate-x-12 scale-[0.96] opacity-0'
    case 'right':
      return 'translate-x-12 scale-[0.96] opacity-0'
    default:
      return 'translate-y-16 scale-[0.96] opacity-0'
  }
}

function hiddenContentClass(revealFrom: HomeExploreCardReveal): string {
  switch (revealFrom) {
    case 'left':
      return '-translate-x-6 opacity-0'
    case 'right':
      return 'translate-x-6 opacity-0'
    default:
      return 'translate-y-8 opacity-0'
  }
}

export interface HomeExploreCardProps {
  readonly href: string
  readonly title: string
  readonly description: string
  readonly imageSrc: string
  readonly accent?: HomeExploreCardAccent
  readonly revealDelay?: number
  readonly revealFrom?: HomeExploreCardReveal
  readonly tiled?: boolean
  readonly size?: HomeExploreCardSize
  readonly className?: string
  readonly style?: CSSProperties
}

export function HomeExploreCard({
  href,
  title,
  description,
  imageSrc,
  accent = 'primary',
  revealDelay = 0,
  revealFrom = 'up',
  tiled = false,
  size = 'tile',
  className,
  style,
}: HomeExploreCardProps) {
  const [shineActive, setShineActive] = useState(false)
  const { ref, inView } = useInView<HTMLAnchorElement>({
    rootMargin: '0px 0px -12% 0px',
    threshold: 0.08,
    once: true,
  })

  const heightClass = SIZE_CLASSES[size]
  const imageSizes =
    size === 'banner' || size === 'wide'
      ? '100vw'
      : '(max-width: 640px) 100vw, 33vw'

  return (
    <Link
      ref={ref}
      href={href}
      aria-label={`Explore ${title}`}
      onMouseEnter={() => setShineActive(true)}
      onMouseLeave={() => setShineActive(false)}
      style={{
        ...style,
        transitionDelay: inView ? `${revealDelay}ms` : '0ms',
      }}
      className={cn(
        'group relative block w-full overflow-hidden rounded-2xl border-[3px] border-white md:rounded-3xl',
        heightClass,
        'shadow-md transition-all duration-700 ease-out',
        'hover:-translate-y-2 hover:shadow-2xl hover:ring-2',
        ACCENT_RING_CLASSES[accent],
        'active:scale-[0.995]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        inView
          ? 'translate-x-0 translate-y-0 scale-100 opacity-100'
          : hiddenRevealClass(revealFrom),
        !inView && 'pointer-events-none',
        tiled && 'shadow-none hover:shadow-2xl',
        className,
      )}
    >
      <div className="absolute inset-0">
        <LazyFadeImage
          src={imageSrc}
          alt=""
          fill
          shouldLoad={inView}
          sizes={imageSizes}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className={cn('absolute inset-0', EXPLORE_CARD_IMAGE_OVERLAY_CLASS)} aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10 transition-all duration-500 group-hover:from-black/90 group-hover:via-black/45"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div
            className={cn(
              'absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-transparent via-white/30 to-transparent',
              shineActive && 'home-card-shine',
            )}
          />
        </div>
      </div>

      <div
        className={cn(
          'relative z-10 flex h-full flex-col items-center justify-end px-4 pb-6 pt-12 text-center sm:px-6 sm:pb-8 sm:pt-16',
          heightClass,
          'transition-all duration-700 ease-out',
          inView ? 'translate-x-0 translate-y-0 opacity-100' : hiddenContentClass(revealFrom),
        )}
        style={{ transitionDelay: inView ? `${revealDelay + 150}ms` : '0ms' }}
      >
        <h3
          className="text-xl font-black uppercase tracking-wide text-white drop-shadow-sm transition-transform duration-300 group-hover:scale-105 sm:text-2xl md:text-3xl"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {title}
        </h3>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-white/90 transition-all duration-300 group-hover:text-white sm:mt-2 sm:text-base">
          {description}
        </p>
        <span
          className={cn(
            'mt-4 flex h-10 w-10 items-center justify-center rounded-full shadow-lg sm:mt-5 sm:h-11 sm:w-11',
            'home-card-cta-pulse rotate-[-4deg] transition-all duration-300 group-hover:rotate-0 group-hover:scale-125',
            ACCENT_BUTTON_CLASSES[accent],
          )}
          aria-hidden
        >
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 sm:h-5 sm:w-5" />
        </span>
      </div>
    </Link>
  )
}
