'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { ClassCard } from '@/components/customer/class-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { classes } from '@/lib/mock-data'
import type { Class } from '@/lib/types'

const levels: Array<Class['level'] | 'All'> = ['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels']
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ClassesPage() {
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState<Class['level'] | 'All'>('All')
  const [day, setDay] = useState<string | 'All'>('All')

  const filtered = useMemo(() => {
    let result = classes.filter((c) => c.isActive)

    if (search) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.sport.toLowerCase().includes(search.toLowerCase()) ||
          c.instructorName.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (level !== 'All') {
      result = result.filter((c) => c.level === level)
    }

    if (day !== 'All') {
      result = result.filter((c) => c.schedule.some((s) => s.dayOfWeek === day))
    }

    return result
  }, [search, level, day])

  const clearFilters = () => {
    setSearch('')
    setLevel('All')
    setDay('All')
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-accent text-sm font-bold uppercase tracking-widest mb-3">Expert-Led</p>
            <h1
              className="text-4xl sm:text-5xl font-black text-white text-balance"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              CLASSES &amp; TRAINING
            </h1>
            <p className="text-white/70 mt-3 max-w-xl leading-relaxed">
              Join structured classes led by professional instructors. From beginner-friendly sessions to elite training programmes.
            </p>
          </div>
        </section>

        {/* Filters */}
        <div className="bg-card border-b border-border py-5 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search classes or instructors..."
                  className="pl-9"
                />
              </div>
              {(search || level !== 'All' || day !== 'All') && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                  <X className="w-3.5 h-3.5" /> Clear
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by level">
              {levels.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    level === l
                      ? 'bg-accent text-accent-foreground border-accent'
                      : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                  }`}
                >
                  {l}
                </button>
              ))}
              <span className="w-px h-6 bg-border self-center mx-1" aria-hidden />
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => setDay(day === d ? 'All' : d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    day === d
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-muted-foreground mb-6">
              <span className="font-semibold text-foreground">{filtered.length}</span> class{filtered.length !== 1 ? 'es' : ''} available
            </p>
            {filtered.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <p className="text-2xl font-bold text-muted-foreground">No classes found</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((cls) => (
                  <ClassCard key={cls.id} cls={cls} />
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
