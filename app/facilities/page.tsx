'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { FacilityCard } from '@/components/customer/facility-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { facilities } from '@/lib/mock-data'
import type { SportType } from '@/lib/types'

const sportTypes: SportType[] = ['Football', 'Basketball', 'Tennis', 'Swimming', 'Gym', 'Yoga', 'Badminton', 'Boxing']

const sortOptions = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A–Z' },
]

export default function FacilitiesPage() {
  const [search, setSearch] = useState('')
  const [selectedSport, setSelectedSport] = useState<SportType | 'All'>('All')
  const [sort, setSort] = useState('rating')
  const [showUnavailable, setShowUnavailable] = useState(true)

  const filtered = useMemo(() => {
    let result = [...facilities]

    if (search) {
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.description.toLowerCase().includes(search.toLowerCase()) ||
          f.sport.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (selectedSport !== 'All') {
      result = result.filter((f) => f.sport === selectedSport)
    }

    if (!showUnavailable) {
      result = result.filter((f) => f.isAvailable)
    }

    result.sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating
      if (sort === 'price-asc') return a.pricePerHour - b.pricePerHour
      if (sort === 'price-desc') return b.pricePerHour - a.pricePerHour
      if (sort === 'name') return a.name.localeCompare(b.name)
      return 0
    })

    return result
  }, [search, selectedSport, sort, showUnavailable])

  const clearFilters = () => {
    setSearch('')
    setSelectedSport('All')
    setSort('rating')
    setShowUnavailable(true)
  }

  const hasActiveFilters = search || selectedSport !== 'All' || !showUnavailable

  return (
    <>
      <CustomerNavbar />
      <main>
        {/* Page header */}
        <section className="bg-primary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-accent text-sm font-bold uppercase tracking-widest mb-3">World-Class Venues</p>
            <h1
              className="text-4xl sm:text-5xl font-black text-white text-balance"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              OUR FACILITIES
            </h1>
            <p className="text-white/70 mt-3 max-w-xl leading-relaxed">
              Browse and book from our full range of sports facilities. Filter by sport, price, or availability and find the perfect venue for your session.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-card border-b border-border py-5 sticky top-16 z-40" aria-label="Facility filters">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search facilities..."
                  className="pl-9"
                  aria-label="Search facilities"
                />
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-44" aria-label="Sort by">
                  <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={showUnavailable ? 'outline' : 'secondary'}
                size="sm"
                onClick={() => setShowUnavailable(!showUnavailable)}
              >
                {showUnavailable ? 'Hide Unavailable' : 'Show All'}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                  <X className="w-3.5 h-3.5" /> Clear filters
                </Button>
              )}
            </div>

            {/* Sport filters */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by sport">
              <button
                onClick={() => setSelectedSport('All')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  selectedSport === 'All'
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                }`}
              >
                All Sports
              </button>
              {sportTypes.map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    selectedSport === sport
                      ? 'bg-accent text-accent-foreground border-accent'
                      : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-12 bg-background" aria-live="polite" aria-label="Facility results">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-muted-foreground mb-6">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> facilit{filtered.length !== 1 ? 'ies' : 'y'}
              {selectedSport !== 'All' && (
                <> in <Badge variant="secondary" className="ml-1">{selectedSport}</Badge></>
              )}
            </p>

            {filtered.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <p className="text-2xl font-bold text-muted-foreground">No facilities found</p>
                <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((facility) => (
                  <FacilityCard key={facility.id} facility={facility} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
