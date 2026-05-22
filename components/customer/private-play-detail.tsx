/** Private Play party listing — package tiers and guided booking (Play UX). */
'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Clock3, Users } from 'lucide-react'

import { EventBookingWidget } from '@/components/customer/event-booking-widget'
import { PrivatePlayPackageSelector } from '@/components/customer/private-play-package-selector'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  privatePlayListingFromPrice,
  privatePlayPackageSectionTitle,
  PRIVATE_PLAY_CATEGORY_ID,
  resolvePrivatePlayListingPackages,
} from '@/lib/private-play-packages'
import { useScheduling } from '@/lib/scheduling-store'
import { formatPrice } from '@/lib/utils'
import type { EventOccasion, SchedulingService } from '@/lib/types'

interface PrivatePlayDetailProps {
  readonly service: SchedulingService
}

export function PrivatePlayDetail({ service }: Readonly<PrivatePlayDetailProps>) {
  const { packages } = useScheduling()
  const listingPackages = useMemo(
    () => resolvePrivatePlayListingPackages(service, packages),
    [packages, service],
  )
  const fromPrice = useMemo(
    () => privatePlayListingFromPrice(service, listingPackages),
    [listingPackages, service],
  )
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [flowSummary, setFlowSummary] = useState<{
    occasion: EventOccasion
    birthdayName: string
    birthdayAge: number | null
    packageName: string | null
    date: string | null
    timeRange: string | null
    children: number
    adults: number
    selectedAddOnCount: number
  } | null>(null)

  const selectedPackage = useMemo(
    () => listingPackages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [listingPackages, selectedPackageId],
  )

  return (
    <>
      <div className="relative h-72 sm:h-96">
        {service.imageUrl ? (
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-secondary" aria-hidden />
        )}
        <div className="absolute inset-0 bg-primary/60" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <Link
            href={`/play#${PRIVATE_PLAY_CATEGORY_ID}`}
            className="mb-4 flex w-fit items-center gap-1 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Play
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge className="mb-2 bg-accent text-accent-foreground">
                {service.category.name}
              </Badge>
              <h1
                className="text-3xl font-black text-balance text-white sm:text-4xl"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                {service.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 shrink-0" />
                  {service.durationMinutes} mins
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 shrink-0" />
                  Up to {service.capacity} guests
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-white/60">Packages from</p>
              <p className="text-3xl font-black text-accent">{formatPrice(fromPrice)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-xl font-bold">About this experience</h2>
            <p className="leading-relaxed text-muted-foreground">
              {service.description ?? '—'}
            </p>
          </section>

          <Separator />

          <section id="private-play-packages" className="space-y-4">
            <h2 className="text-xl font-bold">Choose your package</h2>
            <PrivatePlayPackageSelector
              packages={listingPackages}
              selectedId={selectedPackageId}
              onSelect={setSelectedPackageId}
              defaultDurationMinutes={service.durationMinutes}
              sectionTitle={privatePlayPackageSectionTitle(service.id)}
            />
          </section>
        </div>

        <aside>
          <Card className="sticky top-24 border-border shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Plan your private event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPackage ? (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <p className="font-semibold text-foreground">
                    Selected: {selectedPackage.name}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {formatPrice(selectedPackage.basePrice)} ·{' '}
                    {selectedPackage.duration ?? service.durationMinutes} min party time
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Choose a package above to unlock occasion, date, and guest details.
                </p>
              )}

              {flowSummary ? (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  <p>
                    Occasion: {flowSummary.occasion.replace(/_/g, ' ')}
                  </p>
                  <p>
                    Date: {flowSummary.date ?? 'Not set'}
                    {flowSummary.timeRange ? ` · ${flowSummary.timeRange}` : ''}
                  </p>
                  <p>
                    Guests: {flowSummary.children} children · {flowSummary.adults} adults
                  </p>
                  <p>Add-ons: {flowSummary.selectedAddOnCount} selected</p>
                </div>
              ) : null}

              <EventBookingWidget
                key={selectedPackageId ?? 'private-play-flow'}
                serviceId={service.id}
                bookingPackages={listingPackages}
                embedded
                showOccasionStep
                showPackageStep={false}
                externalSelectedPackageId={selectedPackageId}
                canStart
                onProgressChange={setFlowSummary}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  )
}
