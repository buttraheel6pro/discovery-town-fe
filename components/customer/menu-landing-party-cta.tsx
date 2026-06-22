/** Full-width party planning CTA banner below menu landing highlight cards. */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import {
  getMenuLandingPartyCta,
  type MenuLandingPartyCtaModuleKey,
} from '@/lib/menu-landing-party-cta'
import { cn } from '@/lib/utils'

export interface MenuLandingPartyCtaProps {
  readonly moduleKey?: MenuLandingPartyCtaModuleKey
  readonly className?: string
}

export function MenuLandingPartyCta({
  moduleKey = 'default',
  className,
}: Readonly<MenuLandingPartyCtaProps>) {
  const cta = getMenuLandingPartyCta(moduleKey)

  return (
    <section
      className={cn(
        'relative isolate min-h-[14rem] overflow-hidden rounded-2xl sm:min-h-[16rem]',
        className,
      )}
      aria-labelledby="menu-landing-party-cta-heading"
    >
      <Image
        src={cta.imageSrc}
        alt={cta.imageAlt}
        fill
        className="object-cover object-center"
        sizes="(max-width: 1280px) 100vw, 80rem"
      />
      <div className="absolute inset-0 bg-foreground/55" aria-hidden />

      <div className="relative flex min-h-[14rem] flex-col items-center justify-center px-4 py-10 text-center sm:min-h-[16rem] sm:px-8 sm:py-12">
        <h2
          id="menu-landing-party-cta-heading"
          className="max-w-3xl text-balance text-2xl font-black uppercase tracking-wide text-primary-foreground sm:text-3xl md:text-4xl"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {cta.title}
        </h2>
        <p className="mt-3 max-w-xl text-sm text-primary-foreground/90 sm:text-base">
          {cta.description.replace('Email us anytime.', '')}
          <a
            href={`mailto:${cta.email}`}
            className="font-medium underline underline-offset-2 hover:text-primary-foreground"
          >
            Email us anytime.
          </a>
        </p>

        <div className="mt-6 flex w-full max-w-xl flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href={cta.bookNowHref}
            className={cn(
              'inline-flex min-h-11 items-center justify-center gap-2 rounded-full',
              'bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground',
              'transition-colors hover:bg-accent/90',
            )}
          >
            <span>{cta.bookNowLabel}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground text-accent">
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>

          <Link
            href={cta.calendarHref}
            className={cn(
              'inline-flex min-h-11 items-center justify-center rounded-full',
              'bg-brand-gold px-6 py-2.5 text-sm font-semibold text-foreground',
              'transition-colors hover:bg-brand-gold/90',
            )}
          >
            {cta.calendarLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}
