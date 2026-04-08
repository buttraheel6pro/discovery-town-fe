/** Venue card for private hire marketing — matches facility card visual weight. */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Car, ImageOff, Music, UtensilsCrossed, Wifi } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const PLACEHOLDER_SRC = '/placeholder.svg'

export interface LocationVenueCardProps {
  readonly name: string
  readonly city: string | null
  readonly capacity: number
  readonly imageUrl: string | null
  readonly facilities: string[]
  readonly onCheckAvailability?: () => void
  readonly className?: string
}

function facilityIcon(label: string) {
  const key = label.toLowerCase()
  if (key.includes('wifi')) return Wifi
  if (key.includes('park')) return Car
  if (key.includes('cater') || key.includes('food')) return UtensilsCrossed
  if (key.includes('sound') || key.includes('music')) return Music
  return Wifi
}

export function LocationVenueCard({
  name,
  city,
  capacity,
  imageUrl,
  facilities,
  onCheckAvailability,
  className,
}: Readonly<LocationVenueCardProps>) {
  const [usePlaceholder, setUsePlaceholder] = useState(false)
  const showRemoteImage = Boolean(imageUrl) && !usePlaceholder

  return (
    <Card className={cn('overflow-hidden border-border shadow-sm', className)}>
      <div className="relative aspect-video bg-muted">
        {showRemoteImage ? (
          <Image
            src={imageUrl as string}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            onError={() => setUsePlaceholder(true)}
          />
        ) : (
          <div className="relative h-full w-full bg-secondary" aria-hidden>
            <Image
              src={PLACEHOLDER_SRC}
              alt=""
              fill
              className="object-cover opacity-40"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageOff className="h-10 w-10 text-muted-foreground/80" aria-hidden />
            </div>
          </div>
        )}
      </div>
      <CardContent className="space-y-3 p-4">
        <div>
          <h3
            className="text-lg font-black tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {name}
          </h3>
          {city ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{city}</p>
          ) : null}
          <p className="mt-2 inline-block rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
            Up to {capacity} guests
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {facilities.map((f) => {
            const Icon = facilityIcon(f)
            return (
              <li
                key={f}
                className="flex items-center gap-1.5 rounded-md bg-secondary/60 px-2 py-1 text-xs text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden />
                {f}
              </li>
            )
          })}
        </ul>
        {onCheckAvailability ? (
          <Button
            type="button"
            className="w-full bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
            onClick={onCheckAvailability}
          >
            Check availability
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
