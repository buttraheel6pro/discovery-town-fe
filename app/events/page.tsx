'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { EventCard } from '@/components/customer/event-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { events } from '@/lib/mock-data'

const statuses = ['All', 'PUBLISHED', 'DRAFT'] as const

export default function EventsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All' | 'PUBLISHED' | 'DRAFT'>('All')

  const filtered = useMemo(() => {
    let result = [...events]

    if (search) {
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.sport.toLowerCase().includes(search.toLowerCase()) ||
          e.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status !== 'All') {
      result = result.filter((e) => e.status === status)
    }

    return result
  }, [search, status])

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-accent text-sm font-bold uppercase tracking-widest mb-3">Compete &amp; Celebrate</p>
            <h1
              className="text-4xl sm:text-5xl font-black text-white text-balance"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              SPORTS EVENTS
            </h1>
            <p className="text-white/70 mt-3 max-w-xl leading-relaxed">
              Tournaments, galas, wellness retreats, and more. Register today and be part of the action.
            </p>
          </div>
        </section>

        {/* Filters */}
        <div className="bg-card border-b border-border py-5 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2" role="group" aria-label="Filter by status">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    status === s
                      ? 'bg-accent text-accent-foreground border-accent'
                      : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                  }`}
                >
                  {s === 'All' ? 'All Events' : s === 'PUBLISHED' ? 'Open' : 'Coming Soon'}
                </button>
              ))}
            </div>
            {(search || status !== 'All') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatus('All') }} className="gap-1 text-muted-foreground">
                <X className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>

        <section className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-muted-foreground mb-6">
              <span className="font-semibold text-foreground">{filtered.length}</span> event{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-2xl font-bold text-muted-foreground mb-4">No events found</p>
                <Button onClick={() => { setSearch(''); setStatus('All') }}>View All Events</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((event) => (
                  <EventCard key={event.id} event={event} />
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
