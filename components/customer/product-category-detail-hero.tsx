/** Facility-style hero for product category detail pages (rentals, shop menus). */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

export interface ProductCategoryDetailHeroProps {
  readonly name: string
  readonly badgeLabel?: string
  readonly imageSrc: string
  readonly description: string
  readonly backHref: string
  readonly backLabel: string
}

export function ProductCategoryDetailHero({
  name,
  badgeLabel,
  imageSrc,
  description,
  backHref,
  backLabel,
}: Readonly<ProductCategoryDetailHeroProps>) {
  const badge = badgeLabel ?? name

  return (
    <div className="relative h-36 sm:h-48">
      {imageSrc ? (
        <Image src={imageSrc} alt={name} fill className="object-cover" priority />
      ) : (
        <div className="absolute inset-0 bg-secondary" aria-hidden />
      )}
      <div className="absolute inset-0 bg-primary/60" />
      <div className="absolute inset-0 flex flex-col p-6 sm:p-10">
        <Link
          href={backHref}
          className="flex w-fit items-center gap-1 pt-1 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </Link>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge className="mb-2 bg-accent text-accent-foreground">{badge}</Badge>
            <h1
              className="text-3xl font-black text-balance text-white sm:text-4xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {name}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/80">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
