'use client'

import { useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Star, Users, MapPin, Clock, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { facilities } from '@/lib/mock-data'

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00',
]

// Simulate some booked slots
const bookedSlots: Record<string, string[]> = {
  '2025-07-08': ['10:00', '11:00', '14:00'],
  '2025-07-09': ['07:00', '09:00', '18:00', '19:00'],
  '2025-07-10': ['06:00', '12:00', '13:00'],
}

function formatDateDisplay(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function getWeekDates(baseDate: Date) {
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate)
    d.setDate(baseDate.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export default function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const facility = facilities.find((f) => f.id === id) ?? facilities[0]

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [duration, setDuration] = useState(1)
  const [booked, setBooked] = useState(false)

  const baseDate = new Date(today)
  baseDate.setDate(today.getDate() + weekOffset * 7)
  const weekDates = getWeekDates(baseDate)

  const dayBooked = bookedSlots[selectedDate] ?? []
  const total = facility.pricePerHour * duration

  const handleBook = () => {
    if (selectedTime) setBooked(true)
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        {/* Back + hero */}
        <div className="relative h-72 sm:h-96">
          <Image
            src={facility.imageUrl}
            alt={facility.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-primary/60" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
            <Link href="/facilities" className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 w-fit">
              <ArrowLeft className="w-4 h-4" /> Back to Facilities
            </Link>
            <div className="flex flex-wrap items-end gap-4 justify-between">
              <div>
                <Badge className="bg-accent text-accent-foreground mb-2">{facility.sport}</Badge>
                <h1
                  className="text-3xl sm:text-4xl font-black text-white text-balance"
                  style={{ fontFamily: 'var(--font-barlow)' }}
                >
                  {facility.name}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {facility.rating} ({facility.reviewCount} reviews)
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {facility.floor}, {facility.section}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" /> Capacity: {facility.capacity}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs uppercase tracking-wider">From</p>
                <p className="text-3xl font-black text-accent">£{facility.pricePerHour}<span className="text-base font-normal text-white/80">/hr</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Info */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-3">About this facility</h2>
              <p className="text-muted-foreground leading-relaxed">{facility.description}</p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-bold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {facility.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Calendar / time slot picker */}
            <section>
              <h2 className="text-xl font-bold mb-4">Availability</h2>

              {/* Week nav */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                  disabled={weekOffset === 0}
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-semibold text-muted-foreground">
                  {formatDateDisplay(weekDates[0])} – {formatDateDisplay(weekDates[6])}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setWeekOffset(weekOffset + 1)}
                  aria-label="Next week"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Day selector */}
              <div className="grid grid-cols-7 gap-1 mb-6">
                {weekDates.map((date) => {
                  const d = new Date(date + 'T00:00:00')
                  const isSelected = date === selectedDate
                  const isPast = date < todayStr
                  return (
                    <button
                      key={date}
                      onClick={() => !isPast && setSelectedDate(date)}
                      disabled={isPast}
                      className={`flex flex-col items-center py-3 px-1 rounded-lg text-xs font-semibold transition-colors border ${
                        isSelected
                          ? 'bg-accent text-accent-foreground border-accent'
                          : isPast
                          ? 'bg-muted text-muted-foreground border-border opacity-40 cursor-not-allowed'
                          : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span className="text-[10px] uppercase tracking-wider">
                        {d.toLocaleDateString('en-GB', { weekday: 'short' })}
                      </span>
                      <span className="text-base mt-0.5">{d.getDate()}</span>
                    </button>
                  )
                })}
              </div>

              {/* Time slots */}
              <div>
                <p className="text-sm font-semibold mb-3 text-muted-foreground">
                  Available times for {formatDateDisplay(selectedDate)}
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                  {timeSlots.map((time) => {
                    const isBooked = dayBooked.includes(time)
                    const isSelected = selectedTime === time
                    return (
                      <button
                        key={time}
                        onClick={() => !isBooked && setSelectedTime(isSelected ? null : time)}
                        disabled={isBooked}
                        className={`py-2.5 text-xs font-semibold rounded-lg border transition-colors ${
                          isBooked
                            ? 'bg-muted text-muted-foreground border-border cursor-not-allowed line-through opacity-50'
                            : isSelected
                            ? 'bg-accent text-accent-foreground border-accent'
                            : 'bg-card text-foreground border-border hover:bg-secondary'
                        }`}
                        aria-pressed={isSelected}
                        aria-disabled={isBooked}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-accent inline-block" /> Selected
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-muted inline-block opacity-50" /> Booked
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Right: Booking card */}
          <aside>
            <Card className="sticky top-24 shadow-xl border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Book this Facility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {booked ? (
                  <div className="text-center py-6 space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="font-bold text-lg">Booking Confirmed!</p>
                    <p className="text-sm text-muted-foreground">
                      {facility.name} — {selectedDate} at {selectedTime}
                    </p>
                    <Link href="/account/bookings">
                      <Button variant="outline" className="w-full mt-2">View My Bookings</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-semibold">{formatDateDisplay(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Time</span>
                        <span className="font-semibold">{selectedTime ?? '—'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 block">Duration</label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDuration(Math.max(1, duration - 1))}
                          disabled={duration <= 1}
                          aria-label="Decrease duration"
                        >
                          –
                        </Button>
                        <span className="font-bold text-base w-16 text-center">
                          {duration} hr{duration > 1 ? 's' : ''}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDuration(Math.min(4, duration + 1))}
                          disabled={duration >= 4}
                          aria-label="Increase duration"
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>£{facility.pricePerHour} × {duration} hr{duration > 1 ? 's' : ''}</span>
                        <span>£{facility.pricePerHour * duration}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span className="text-accent">£{total.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
                      disabled={!selectedTime}
                      onClick={handleBook}
                    >
                      {selectedTime ? `Confirm Booking` : 'Select a Time Slot'}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Free cancellation up to 24 hours before your booking
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
