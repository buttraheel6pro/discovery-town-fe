'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { ClassCard } from '@/components/customer/class-card'
import { FilterSidebar } from '@/components/customer/filter-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useScheduling } from '@/lib/scheduling-store'
import type { Class, SchedulingServiceType } from '@/lib/types'

const levels: Array<Class['level'] | 'All'> = [
  'All',
  'Beginner',
  'Intermediate',
  'Advanced',
  'All Levels',
]

const classServiceTypes: SchedulingServiceType[] = [
  'GYM_CLASS',
  'SWIM_CLASS',
  'COACHING_SESSION',
  'FITNESS_ASSESSMENT',
]

const typeLabels: Partial<Record<SchedulingServiceType, string>> = {
  GYM_CLASS: 'Gym',
  SWIM_CLASS: 'Swim',
  COACHING_SESSION: 'Coaching',
  FITNESS_ASSESSMENT: 'Assessment',
}

export default function ClassesPage() {
  const { services, slots } = useScheduling()
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState<Class['level'] | 'All'>('All')
  const [typeFilter, setTypeFilter] = useState<SchedulingServiceType | 'All'>('All')
  const [availableOnly, setAvailableOnly] = useState(false)

  const classCatalog = useMemo(
    () =>
      services.filter(
        (s) =>
          s.isActive &&
          s.bookingMode === 'SCHEDULED' &&
          classServiceTypes.includes(s.serviceType),
      ),
    [services],
  )

  const nextSlotByServiceId = useMemo(() => {
    const map = new Map<string, (typeof slots)[0]>()
    const now = new Date().getTime()
    const sorted = [...slots].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    )
    for (const slot of sorted) {
      if (slot.status === 'CANCELLED' || slot.status === 'COMPLETED') continue
      if (new Date(slot.startAt).getTime() < now) continue
      if (!map.has(slot.serviceId)) map.set(slot.serviceId, slot)
    }
    return map
  }, [slots])

  const filtered = useMemo(() => {
    let result = [...classCatalog]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.sport?.toLowerCase().includes(q) ?? false) ||
          (s.instructorName?.toLowerCase().includes(q) ?? false),
      )
    }

    if (level !== 'All') {
      result = result.filter((s) => s.level === level)
    }

    if (typeFilter !== 'All') {
      result = result.filter((s) => s.serviceType === typeFilter)
    }

    if (availableOnly) {
      result = result.filter((s) => {
        const slot = nextSlotByServiceId.get(s.id)
        if (!slot) return false
        return slot.bookedCount < slot.effectiveCapacity
      })
    }

    return result
  }, [classCatalog, search, level, typeFilter, availableOnly, nextSlotByServiceId])

  const clearFilters = () => {
    setSearch('')
    setLevel('All')
    setTypeFilter('All')
    setAvailableOnly(false)
  }

  const hasActiveFilters =
    Boolean(search) || level !== 'All' || typeFilter !== 'All' || availableOnly
  const activeCount =
    (search ? 1 : 0) +
    (level !== 'All' ? 1 : 0) +
    (typeFilter !== 'All' ? 1 : 0) +
    (availableOnly ? 1 : 0)

  const filterBody = (
    <>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Level
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by level">
          {levels.map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => setLevel(lv)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                level === lv
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border bg-background text-muted-foreground'
              }`}
            >
              {lv}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Type
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by class type">
          <button
            type="button"
            onClick={() => setTypeFilter('All')}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              typeFilter === 'All'
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            All
          </button>
          {classServiceTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                typeFilter === t
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border bg-background text-muted-foreground'
              }`}
            >
              {typeLabels[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Availability
        </p>
        <Button
          variant={availableOnly ? 'secondary' : 'outline'}
          size="sm"
          type="button"
          className="w-full"
          onClick={() => setAvailableOnly(!availableOnly)}
        >
          {availableOnly ? 'Showing available only' : 'Available sessions only'}
        </Button>
      </div>
    </>
  )

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-accent">
              Structured Training
            </p>
            <h1
              className="text-balance text-4xl font-black text-white sm:text-5xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              EXPERT-LED CLASSES &amp; TRAINING
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-white/70">
              Join structured classes led by professional instructors. From beginner-friendly
              sessions to elite training programmes.
            </p>
          </div>
        </section>

        <section
          className="sticky top-16 z-40 border-b border-border bg-card py-4"
          aria-label="Search classes"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="relative min-w-[220px] max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search classes or instructors..."
                className="pl-9"
                aria-label="Search classes"
              />
            </div>
            {hasActiveFilters ? (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={clearFilters}
                className="gap-1 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            ) : null}
          </div>
        </section>

        <section className="bg-background py-12" aria-live="polite" aria-label="Class results">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <FilterSidebar
                title="Class filters"
                activeCount={activeCount}
                onClear={hasActiveFilters ? clearFilters : undefined}
              >
                {filterBody}
              </FilterSidebar>

              <div className="min-w-0 flex-1">
                <p className="mb-6 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
                  {filtered.length === 1 ? 'class' : 'classes'} available
                </p>
                {filtered.length === 0 ? (
                  <div className="space-y-4 py-20 text-center">
                    <p className="text-2xl font-bold text-muted-foreground">No classes found</p>
                    <Button type="button" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filtered.map((svc) => (
                      <ClassCard
                        key={svc.id}
                        service={svc}
                        nextSlot={nextSlotByServiceId.get(svc.id)}
                      />
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
