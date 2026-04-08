/** Client shell for public private hire page — links picker selection into enquiry form. */
'use client'

import { useCallback, useMemo, useState } from 'react'
import { CalendarDays, PartyPopper, Search, Shield, Users, X } from 'lucide-react'

import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { LocationVenueCard } from '@/components/customer/location-venue-card'
import { PrivateHireAvailabilityPicker } from '@/components/customer/private-hire-availability-picker'
import { PrivateHireInquiryForm } from '@/components/customer/private-hire-inquiry-form'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLocations } from '@/lib/location-store'
import { useScheduling } from '@/lib/scheduling-store'

export function PrivateHirePageClient() {
  const { services } = useScheduling()
  const { locations } = useLocations()
  const hireServices = useMemo(
    () => services.filter((s) => s.serviceType === 'PRIVATE_HIRE' && s.isActive),
    [services],
  )

  const [venueSearch, setVenueSearch] = useState('')
  const [prefilledStartAt, setPrefilledStartAt] = useState<string | undefined>(undefined)
  const [prefilledEndAt, setPrefilledEndAt] = useState<string | undefined>(undefined)

  const filteredVenues = useMemo(() => {
    if (!venueSearch.trim()) return hireServices
    const q = venueSearch.toLowerCase().trim()
    return hireServices.filter((s) => {
      const loc = locations.find((l) => l.id === s.locationId)
      const city = loc?.city ?? s.location ?? ''
      return (
        s.name.toLowerCase().includes(q) ||
        city.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [hireServices, venueSearch])

  const onWindowSelected = useCallback((startAt: string, endAt: string) => {
    setPrefilledStartAt(startAt)
    setPrefilledEndAt(endAt)
    const el = document.getElementById('inquiry-form')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  function scrollToInquiry() {
    document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  function clearVenueSearch() {
    setVenueSearch('')
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-accent">
              Exclusive use
            </p>
            <h1
              className="text-balance text-4xl font-black text-white sm:text-5xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              PRIVATE HIRE
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-white/70">
              Book the whole space for birthday parties, corporate days, and exclusive sessions at
              Discovery Town — Manchester&apos;s family activity centre.
            </p>
            <Button
              type="button"
              size="lg"
              className="mt-8 bg-accent font-bold text-accent-foreground hover:bg-accent/90"
              onClick={scrollToInquiry}
            >
              Enquire now
            </Button>
          </div>
        </section>

        <section
          className="sticky top-16 z-40 border-b border-border bg-card py-4"
          aria-label="Search venues"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="relative min-w-[220px] max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={venueSearch}
                onChange={(e) => setVenueSearch(e.target.value)}
                placeholder="Search by venue name..."
                className="pl-9"
                aria-label="Search venues by name"
              />
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="font-semibold text-foreground">{filteredVenues.length}</span>{' '}
              {filteredVenues.length === 1 ? 'venue' : 'venues'}
            </p>
            {venueSearch ? (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={clearVenueSearch}
                className="gap-1 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden /> Clear
              </Button>
            ) : null}
          </div>
        </section>

        <section className="bg-muted/30 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2
              className="mb-6 text-2xl font-black text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              Venues &amp; packages
            </h2>
            {hireServices.length === 0 ? (
              <p className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
                Venue information coming soon.
              </p>
            ) : filteredVenues.length === 0 ? (
              <div className="space-y-4 py-12 text-center">
                <p className="text-lg font-semibold text-muted-foreground">No venues match your search</p>
                <Button type="button" variant="outline" onClick={clearVenueSearch}>
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredVenues.map((s) => {
                  const loc = locations.find((l) => l.id === s.locationId)
                  return (
                    <LocationVenueCard
                      key={s.id}
                      name={s.name}
                      city={loc?.city ?? s.location ?? null}
                      capacity={s.capacity}
                      imageUrl={s.imageUrl}
                      facilities={
                        s.amenities ?? ['Staff on site', 'Flexible setup', 'Parking nearby']
                      }
                      onCheckAvailability={() =>
                        document
                          .getElementById('availability')
                          ?.scrollIntoView({ behavior: 'smooth' })
                      }
                    />
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section className="bg-background py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2
              className="mb-8 text-center text-2xl font-black text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              What&apos;s included
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Users,
                  title: 'Dedicated host',
                  body: 'Staff on site for your whole booking.',
                },
                {
                  icon: PartyPopper,
                  title: 'Flexible layout',
                  body: 'Zones adapted for your group size.',
                },
                {
                  icon: Shield,
                  title: 'Safety first',
                  body: 'Full venue rules and risk assessments.',
                },
                {
                  icon: CalendarDays,
                  title: '48h+ booking',
                  body: 'We confirm availability within one working day.',
                },
              ].map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card p-5 text-center"
                >
                  <Icon className="mx-auto mb-3 h-8 w-8 text-accent" aria-hidden />
                  <p className="font-bold text-foreground">{title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="availability" className="scroll-mt-20 bg-muted/30 py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2
              className="mb-2 text-2xl font-black text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              Check availability
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Pick a date to see typical windows. Submitting an enquiry does not guarantee the slot
              until our team confirms.
            </p>
            <div className="rounded-xl border border-border bg-card p-6">
              <PrivateHireAvailabilityPicker onWindowSelected={onWindowSelected} />
            </div>
          </div>
        </section>

        <section id="inquiry-form" className="scroll-mt-20 bg-background py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2
              className="mb-2 text-2xl font-black text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              Make an enquiry
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Fill in the form below and our team will confirm availability and pricing within 24
              hours.
            </p>
            <div className="rounded-xl border border-border bg-card p-6">
              <PrivateHireInquiryForm
                prefilledStartAt={prefilledStartAt}
                prefilledEndAt={prefilledEndAt}
              />
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2
              className="mb-4 text-2xl font-black text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              FAQ
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger>What&apos;s included in the hire?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Venue access, on-site staff, basic equipment, and agreed setup time. Catering and
                  add-ons are quoted separately.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>How far in advance do I need to book?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We require at least 48 hours&apos; notice for private hire enquiries. Peak weekends
                  fill quickly — submit early.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger>Is a deposit required?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. A deposit (typically 50%) secures the date once we approve your enquiry.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger>Can I bring my own catering?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Outside catering may be allowed with prior approval and compliance with our kitchen
                  and allergen policies. Ask in your enquiry notes.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
