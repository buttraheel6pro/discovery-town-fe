/** Homepage hero CTA bar — pill buttons in a clean band below the hero image. */
'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Calendar, PartyPopper, Users } from 'lucide-react'

import { cn } from '@/lib/utils'

interface HomeHeroCtaBarProps {
  readonly playLabel: string
  readonly eventsLabel: string
  readonly showPlayCta: boolean
}

interface HeroCtaButtonProps {
  readonly href: string
  readonly icon: ReactNode
  readonly lineOne: string
  readonly lineTwo: string
  readonly className: string
}

function HeroCtaButton({
  href,
  icon,
  lineOne,
  lineTwo,
  className,
}: HeroCtaButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-h-[3.5rem] w-full items-center justify-center gap-3',
        'rounded-full border-2 border-white px-5 py-3 text-white shadow-lg sm:min-h-[3.75rem] sm:w-auto sm:min-w-[11rem] sm:px-6',
        'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:brightness-110',
        className,
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider opacity-90 sm:text-xs">
          {lineOne}
        </span>
        <span className="text-sm font-black uppercase tracking-wide sm:text-base">
          {lineTwo}
        </span>
      </span>
    </Link>
  )
}

export function HomeHeroCtaBar({
  playLabel,
  eventsLabel,
  showPlayCta,
}: HomeHeroCtaBarProps) {
  return (
    <section
      className="relative z-20 border-b border-border/40 bg-white px-3 py-5 sm:px-4 sm:py-6"
      aria-label="Quick booking actions"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-stretch gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
        {showPlayCta ? (
          <HeroCtaButton
            href="/play"
            icon={<Calendar className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />}
            lineOne="Book"
            lineTwo={playLabel}
            className="bg-primary"
          />
        ) : null}
        <HeroCtaButton
          href="/events"
          icon={<PartyPopper className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />}
          lineOne="Book"
          lineTwo={eventsLabel}
          className="bg-accent"
        />
        <HeroCtaButton
          href="/membership"
          icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />}
          lineOne="Membership"
          lineTwo="Benefits"
          className="bg-chart-5"
        />
      </div>
    </section>
  )
}
