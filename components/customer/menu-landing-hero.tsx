/** Menu landing hero — unified SVG background with category grid overlapping below. */
'use client'

import type { ReactNode } from 'react'

import { MenuLandingHeroArt } from '@/components/customer/menu-landing-hero-art'
import { MenuLandingHeroIllustration } from '@/components/customer/menu-landing-hero-illustrations'
import { CatalogListingHighlightCards } from '@/components/customer/catalog-listing-highlight-cards'
import { MenuLandingPartyCta } from '@/components/customer/menu-landing-party-cta'
import type { MenuLandingHeroKey } from '@/lib/menu-landing-hero-config'
import { cn } from '@/lib/utils'

export interface MenuLandingHeroProps {
  readonly menuKey: MenuLandingHeroKey
  readonly overline: string
  readonly title: string
  readonly description: string
  readonly children: ReactNode
  readonly heroExtra?: ReactNode
  readonly className?: string
}

export function MenuLandingHero({
  menuKey,
  overline,
  title,
  description,
  children,
  heroExtra,
  className,
}: Readonly<MenuLandingHeroProps>) {
  return (
    <div className={cn('relative bg-brand-cream', className)}>
      <section className="relative isolate min-h-[12rem] overflow-hidden sm:min-h-[14rem] lg:min-h-[16rem]">
        <div className="absolute inset-0">
          <MenuLandingHeroArt />
        </div>

        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 pb-14 pt-8 sm:gap-6 sm:px-6 sm:pb-16 sm:pt-10 lg:gap-8 lg:px-8 lg:pb-20 lg:pt-12">
          <div className="min-w-0 flex-1">
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

          <div className="shrink-0 self-center">
            <MenuLandingHeroIllustration menuKey={menuKey} />
          </div>
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
