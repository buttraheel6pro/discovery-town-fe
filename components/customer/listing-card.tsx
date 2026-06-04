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
  /** Stretch card to parent height so footers align in horizontal rails. */
  fillHeight?: boolean
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
  fillHeight = false,
}: Readonly<ListingCardProps>) {
  const [usePlaceholder, setUsePlaceholder] = useState(false)
  const showRemoteImage = Boolean(imageUrl) && !usePlaceholder

  return (
    <Link href={href} className={cn('block', fillHeight && 'h-full min-h-0 w-full')}>
      <Card
        className={cn(
          'group overflow-hidden rounded-xl border border-border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
          fillHeight && 'h-full min-h-[28rem] gap-0 py-0',
          className,
        )}
      >
        <div className="relative h-48 shrink-0 overflow-hidden">
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

        <CardContent
          className={cn(
            'flex flex-col gap-3 p-5',
            fillHeight && 'min-h-0 flex-1',
          )}
        >
          <div className={cn('space-y-1', fillHeight && 'min-h-[4.5rem] shrink-0')}>
            <h3
              className={cn(
                'text-base font-bold leading-tight text-foreground',
                fillHeight && 'line-clamp-2 min-h-[2.5rem]',
              )}
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {title}
            </h3>
            {description || fillHeight ? (
              <p
                className={cn(
                  'line-clamp-2 text-sm leading-relaxed text-muted-foreground',
                  fillHeight && 'min-h-[2.75rem]',
                )}
              >
                {description ?? ''}
              </p>
            ) : null}
          </div>

          {meta ? (
            <div className={fillHeight ? 'min-h-0 flex-1' : undefined}>{meta}</div>
          ) : fillHeight ? (
            <div className="min-h-0 flex-1" aria-hidden />
          ) : null}
          {footer ? (
            <div className={cn('pt-1', fillHeight && 'mt-auto shrink-0')}>{footer}</div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  )
}
