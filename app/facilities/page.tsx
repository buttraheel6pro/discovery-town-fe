'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { FacilityCard } from '@/components/customer/facility-card'
import { FilterSidebar } from '@/components/customer/filter-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useScheduling } from '@/lib/scheduling-store'
import type { SchedulingServiceType } from '@/lib/types'

const facilityServiceTypes: SchedulingServiceType[] = [
  'COURT_BOOKING',
  'OPEN_PLAY',
  'PRIVATE_HIRE',
]

const sortOptions = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A–Z' },
]

export default function FacilitiesPage() {
  const { services } = useScheduling()
  const [search, setSearch] = useState('')
  const [selectedSport, setSelectedSport] = useState<string>('All')
  const [sort, setSort] = useState('rating')
  const [showInactive, setShowInactive] = useState(false)

  const facilityServices = useMemo(
    () =>
      services.filter(
        (s) => s.bookingMode === 'OPEN' && facilityServiceTypes.includes(s.serviceType),
      ),
    [services],
  )

  const sportChips = useMemo(() => {
    const set = new Set<string>()
    for (const s of facilityServices) {
      if (s.sport) set.add(s.sport)
    }
    return Array.from(set).sort()
  }, [facilityServices])

  const filtered = useMemo(() => {
    let result = [...facilityServices]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description?.toLowerCase().includes(q) ?? false) ||
          (s.sport?.toLowerCase().includes(q) ?? false),
      )
    }

    if (selectedSport !== 'All') {
      result = result.filter((s) => s.sport === selectedSport)
    }

    if (!showInactive) {
      result = result.filter((s) => s.isActive)
    }

    result.sort((a, b) => {
      const ra = a.rating ?? 0
      const rb = b.rating ?? 0
      if (sort === 'rating') return rb - ra
      if (sort === 'price-asc') return a.basePrice - b.basePrice
      if (sort === 'price-desc') return b.basePrice - a.basePrice
      if (sort === 'name') return a.name.localeCompare(b.name)
      return 0
    })

    return result
  }, [facilityServices, search, selectedSport, sort, showInactive])

  const clearFilters = () => {
    setSearch('')
    setSelectedSport('All')
    setSort('rating')
    setShowInactive(false)
  }

  const hasActiveFilters = Boolean(search) || selectedSport !== 'All' || showInactive
  const activeCount =
    (search ? 1 : 0) +
    (selectedSport !== 'All' ? 1 : 0) +
    (showInactive ? 1 : 0) +
    (sort !== 'rating' ? 1 : 0)

  const filterBody = (
    <>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sort
        </p>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Availability
        </p>
        <Button
          variant={showInactive ? 'secondary' : 'outline'}
          size="sm"
          type="button"
          onClick={() => setShowInactive(!showInactive)}
          className="w-full"
        >
          {showInactive ? 'Showing inactive' : 'Hide inactive'}
        </Button>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sport / category
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by sport">
          <button
            type="button"
            onClick={() => setSelectedSport('All')}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedSport === 'All'
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-secondary'
            }`}
          >
            All
          </button>
          {sportChips.map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedSport(sport)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedSport === sport
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-secondary'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
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
              World-Class Venues
            </p>
            <h1
              className="text-balance text-4xl font-black text-white sm:text-5xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              OUR FACILITIES
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-white/70">
              Browse and book from our full range of sports facilities. Filter by sport, price, or
              availability and find the perfect venue for your session.
            </p>
          </div>
        </section>

        <section
          className="sticky top-16 z-40 border-b border-border bg-card py-4"
          aria-label="Search facilities"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="relative min-w-[220px] max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search facilities..."
                className="pl-9"
                aria-label="Search facilities"
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

        <section className="bg-background py-12" aria-live="polite" aria-label="Facility results">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <FilterSidebar
                title="Facility filters"
                activeCount={activeCount}
                onClear={hasActiveFilters || sort !== 'rating' ? clearFilters : undefined}
              >
                {filterBody}
              </FilterSidebar>

              <div className="min-w-0 flex-1">
                <p className="mb-6 text-sm text-muted-foreground">
                  Showing{' '}
                  <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
                  {filtered.length === 1 ? 'facility' : 'facilities'}
                  {selectedSport !== 'All' ? (
                    <>
                      {' '}
                      in <Badge variant="secondary" className="ml-1">{selectedSport}</Badge>
                    </>
                  ) : null}
                </p>

                {filtered.length === 0 ? (
                  <div className="space-y-4 py-20 text-center">
                    <p className="text-2xl font-bold text-muted-foreground">No facilities found</p>
                    <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
                    <Button type="button" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((service) => (
                      <FacilityCard key={service.id} service={service} />
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
