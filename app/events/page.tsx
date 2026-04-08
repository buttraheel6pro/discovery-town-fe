'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { EventCard } from '@/components/customer/event-card'
import { FilterSidebar } from '@/components/customer/filter-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useScheduling } from '@/lib/scheduling-store'
import type { Event, SchedulingServiceType } from '@/lib/types'

const statuses: Array<'All' | Event['status']> = ['All', 'PUBLISHED', 'DRAFT']

const eventServiceTypes: SchedulingServiceType[] = ['PARTY_PACKAGE', 'WORKSHOP', 'CAMP']

export default function EventsPage() {
  const { services, slots } = useScheduling()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All' | Event['status']>('All')

  function handleClear() {
    setSearch('')
    setStatus('All')
  }

  const eventCatalog = useMemo(
    () =>
      services.filter(
        (s) =>
          s.isActive &&
          s.bookingMode === 'SCHEDULED' &&
          eventServiceTypes.includes(s.serviceType),
      ),
    [services],
  )

  const slotByServiceId = useMemo(() => {
    const map = new Map<string, (typeof slots)[0]>()
    for (const sl of slots) {
      if (!map.has(sl.serviceId)) map.set(sl.serviceId, sl)
    }
    return map
  }, [slots])

  const filtered = useMemo(() => {
    let result = [...eventCatalog]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.sport?.toLowerCase().includes(q) ?? false) ||
          (s.description?.toLowerCase().includes(q) ?? false),
      )
    }

    if (status !== 'All') {
      result = result.filter((s) => s.eventStatus === status)
    }

    return result
  }, [eventCatalog, search, status])

  const hasActiveFilters = Boolean(search) || status !== 'All'
  const activeCount = (search ? 1 : 0) + (status !== 'All' ? 1 : 0)

  const filterBody = (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Status
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              status === s
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-secondary'
            }`}
          >
            {s === 'All' ? 'All Events' : s === 'PUBLISHED' ? 'Open' : 'Coming Soon'}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-accent">
              Compete &amp; Celebrate
            </p>
            <h1
              className="text-balance text-4xl font-black text-white sm:text-5xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              SPORTS EVENTS
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-white/70">
              Tournaments, galas, wellness retreats, and more. Register today and be part of the
              action.
            </p>
          </div>
        </section>

        <section
          className="sticky top-16 z-40 border-b border-border bg-card py-4"
          aria-label="Search events"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="relative min-w-[220px] max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="pl-9"
                aria-label="Search events"
              />
            </div>
            {hasActiveFilters ? (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleClear}
                className="gap-1 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            ) : null}
          </div>
        </section>

        <section className="bg-background py-12" aria-live="polite" aria-label="Event results">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <FilterSidebar
                title="Event filters"
                activeCount={activeCount}
                onClear={hasActiveFilters ? handleClear : undefined}
              >
                {filterBody}
              </FilterSidebar>

              <div className="min-w-0 flex-1">
                <p className="mb-6 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
                  {filtered.length === 1 ? 'event' : 'events'}
                </p>
                {filtered.length === 0 ? (
                  <div className="space-y-4 py-20 text-center">
                    <p className="text-2xl font-bold text-muted-foreground">No events found</p>
                    <Button type="button" onClick={handleClear}>
                      View all events
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((svc) => (
                      <EventCard key={svc.id} service={svc} slot={slotByServiceId.get(svc.id)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
