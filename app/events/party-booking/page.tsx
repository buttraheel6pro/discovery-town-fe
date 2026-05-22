/** Standalone party booking page with full customer shell and private-event widget. */
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { EventBookingWidget } from '@/components/customer/event-booking-widget'
import { PackageSelector } from '@/components/customer/package-selector'
import { Button } from '@/components/ui/button'
import {
  meetingRoomPackagesFromCatalog,
  partyRoomPackagesFromCatalog,
  PRIVATE_PLAY_MEETING_ROOMS_SERVICE_ID,
  wholeVenuePackagesFromCatalog,
} from '@/lib/event-package-catalog'
import { schedulingServices } from '@/lib/mock-data'
import { useScheduling } from '@/lib/scheduling-store'

export default function PartyBookingPage() {
  const { packages } = useScheduling()
  const featuredServiceId = useMemo(
    () =>
      schedulingServices.find(
        (entry) =>
          entry.isActive &&
          entry.bookingMode === 'SCHEDULED' &&
          entry.serviceType === 'PARTY_PACKAGE',
      )?.id ?? 'svc-5',
    [],
  )
  const privateRoomPackages = useMemo(
    () => partyRoomPackagesFromCatalog(packages),
    [packages],
  )
  const wholeVenuePackages = useMemo(
    () => wholeVenuePackagesFromCatalog(packages),
    [packages],
  )
  const meetingRoomPackages = useMemo(
    () => meetingRoomPackagesFromCatalog(packages),
    [packages],
  )
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-accent">
              Private Events
            </p>
            <h1
              className="text-balance text-4xl font-black text-white sm:text-5xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              PARTY BOOKING
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-white/70">
              Choose a package, set your event details, and submit booking in one flow.
            </p>
            <div className="mt-4">
              <Link href="/events">
                <Button variant="secondary" type="button">
                  Back to all events
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-background py-12">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Private room booking
                </p>
                <PackageSelector
                  packages={privateRoomPackages}
                  selectedId={selectedPackageId}
                  onSelect={setSelectedPackageId}
                  variant="full"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Whole venue</p>
                <PackageSelector
                  packages={wholeVenuePackages}
                  selectedId={selectedPackageId}
                  onSelect={setSelectedPackageId}
                  variant="full"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Meeting room packages
                </p>
                <PackageSelector
                  packages={meetingRoomPackages}
                  selectedId={selectedPackageId}
                  onSelect={setSelectedPackageId}
                  variant="full"
                />
              </div>
            </div>
            <div className="lg:col-span-1">
              <EventBookingWidget
                embedded
                serviceId={
                  selectedPackageId != null &&
                  meetingRoomPackages.some((pkg) => pkg.id === selectedPackageId)
                    ? PRIVATE_PLAY_MEETING_ROOMS_SERVICE_ID
                    : featuredServiceId
                }
                bookingPackages={
                  selectedPackageId != null &&
                  meetingRoomPackages.some((pkg) => pkg.id === selectedPackageId)
                    ? meetingRoomPackages
                    : [...privateRoomPackages, ...wholeVenuePackages]
                }
                showPackageStep={false}
                externalSelectedPackageId={selectedPackageId}
                canStart={Boolean(selectedPackageId)}
              />
            </div>
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
