/** Menu landing hero — image background with category grid overlapping below. */
'use client'

import type { ReactNode } from 'react'

import { CatalogListingHighlightCards } from '@/components/customer/catalog-listing-highlight-cards'
import { LazyFadeImage } from '@/components/customer/lazy-fade-image'
import { MenuLandingPartyCta } from '@/components/customer/menu-landing-party-cta'
import {
  MENU_LANDING_HERO_IMAGES,
  type MenuLandingHeroKey,
} from '@/lib/menu-landing-hero-config'
import { cn } from '@/lib/utils'

export interface MenuLandingHeroProps {
  readonly menuKey: MenuLandingHeroKey
  readonly overline: string
  readonly title: string
  readonly description: string
  readonly imageAlt: string
  readonly children: ReactNode
  readonly heroExtra?: ReactNode
  readonly className?: string
}

export function MenuLandingHero({
  menuKey,
  overline,
  title,
  description,
  imageAlt,
  children,
  heroExtra,
  className,
}: Readonly<MenuLandingHeroProps>) {
  const imageSrc = MENU_LANDING_HERO_IMAGES[menuKey]

  return (
    <div className={cn('relative bg-brand-cream', className)}>
      <section className="relative isolate min-h-[12rem] overflow-hidden sm:min-h-[14rem] lg:min-h-[16rem]">
        <div className="absolute inset-0">
          <LazyFadeImage
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-brand-navy/80 via-brand-navy/45 to-brand-navy/15"
            aria-hidden
          />
          <div className="absolute inset-0 bg-black/15" aria-hidden />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8 lg:pb-20 lg:pt-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">
            {overline}
          </p>
          <h1
            className="text-4xl font-black tracking-tight text-primary-foreground sm:text-5xl"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-primary-foreground/90 md:text-base">
            {description}
          </p>
          {heroExtra ? <div className="mt-4">{heroExtra}</div> : null}
        </div>
      </section>

      <section className="relative z-10 -mt-10 px-2 pb-8 sm:-mt-14 sm:px-2.5 sm:pb-10 lg:-mt-16">
        <div className="mx-auto max-w-7xl">
          {children}
          <CatalogListingHighlightCards moduleKey={menuKey} className="mt-8 sm:mt-10" />
          <MenuLandingPartyCta moduleKey={menuKey} className="mt-8 sm:mt-10" />
        </div>
      </section>
    </div>
  )
}
