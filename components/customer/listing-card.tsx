/** Listing card — shared card shell for all customer listing pages. */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ImageOff } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const PLACEHOLDER_SRC = '/placeholder.svg'

export interface ListingCardProps {
  href: string
  title: string
  description?: string | null
  imageUrl?: string | null
  topLeft?: React.ReactNode
  topRight?: React.ReactNode
  bottomRight?: React.ReactNode
  meta?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function ListingCard({
  href,
  title,
  description,
  imageUrl,
  topLeft,
  topRight,
  bottomRight,
  meta,
  footer,
  className,
}: Readonly<ListingCardProps>) {
  const [usePlaceholder, setUsePlaceholder] = useState(false)
  const showRemoteImage = Boolean(imageUrl) && !usePlaceholder

  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          'group overflow-hidden rounded-xl border border-border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
          className,
        )}
      >
        <div className="relative h-48 overflow-hidden">
          {showRemoteImage ? (
            <Image
              src={imageUrl as string}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setUsePlaceholder(true)}
            />
          ) : (
            <div className="relative h-full w-full bg-secondary" aria-hidden>
              <Image
                src={PLACEHOLDER_SRC}
                alt=""
                fill
                className="object-cover opacity-40"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageOff className="h-10 w-10 text-muted-foreground/80" aria-hidden />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          {topLeft ? (
            <div className="absolute left-3 top-3 flex items-center gap-2">
              {topLeft}
            </div>
          ) : null}
          {topRight ? (
            <div className="absolute right-3 top-3 flex items-center gap-2">
              {topRight}
            </div>
          ) : null}
          {bottomRight ? (
            <div className="absolute bottom-3 right-3">{bottomRight}</div>
          ) : null}
        </div>

        <CardContent className="flex flex-col gap-3 p-5">
          <div className="space-y-1">
            <h3
              className="text-base font-bold leading-tight text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {title}
            </h3>
            {description ? (
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          {meta ? <div>{meta}</div> : null}
          {footer ? <div className="mt-auto pt-1">{footer}</div> : null}
        </CardContent>
      </Card>
    </Link>
  )
}
