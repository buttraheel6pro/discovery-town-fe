'use client'

import { useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Ticket,
  CheckCircle2, Share2, Tag,
} from 'lucide-react'
import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { events } from '@/lib/mock-data'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const event = events.find((e) => e.id === id) ?? events[0]

  const [ticketCount, setTicketCount] = useState(1)
  const [registered, setRegistered] = useState(false)

  const spotsLeft = event.maxAttendees - event.registeredCount
  const fillPct = Math.round((event.registeredCount / event.maxAttendees) * 100)
  const total = event.ticketPrice * ticketCount

  const handleRegister = () => setRegistered(true)

  return (
    <>
      <CustomerNavbar />
      <main>
        {/* Hero */}
        <div className="relative h-72 sm:h-96">
          <Image src={event.imageUrl} alt={event.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-primary/65" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
            <Link href="/events" className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 w-fit">
              <ArrowLeft className="w-4 h-4" /> Back to Events
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-accent text-accent-foreground">{event.sport}</Badge>
                  <Badge variant={event.status === 'PUBLISHED' ? 'default' : 'secondary'} className="text-xs">
                    {event.status === 'PUBLISHED' ? 'Registration Open' : event.status}
                  </Badge>
                </div>
                <h1
                  className="text-3xl sm:text-4xl font-black text-white text-balance"
                  style={{ fontFamily: 'var(--font-barlow)' }}
                >
                  {event.title}
                </h1>
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" aria-label="Share">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Calendar, label: 'Date', value: formatDate(event.startDate) + (event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : '') },
                { icon: Clock, label: 'Time', value: `${event.startTime} – ${event.endTime}` },
                { icon: MapPin, label: 'Location', value: event.location },
                { icon: Users, label: 'Organiser', value: event.organizer },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 p-4 rounded-xl bg-secondary border border-border">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <section>
              <h2 className="text-xl font-bold mb-3">About this Event</h2>
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>
            </section>

            {/* Agenda */}
            {event.agenda.length > 0 && (
              <>
                <Separator />
                <section>
                  <h2 className="text-xl font-bold mb-5">Schedule / Agenda</h2>
                  <div className="space-y-1 relative">
                    <div className="absolute left-[52px] top-5 bottom-5 w-px bg-border" aria-hidden />
                    {event.agenda.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <span className="text-xs font-bold text-accent bg-accent/10 rounded-md px-2.5 py-1.5 w-14 text-center shrink-0">
                          {item.time}
                        </span>
                        <div className="relative flex items-start gap-3 pb-4">
                          <div className="w-2.5 h-2.5 rounded-full bg-accent border-2 border-background mt-1.5 shrink-0" aria-hidden />
                          <div>
                            <p className="font-semibold text-foreground text-sm">{item.title}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Tags */}
            {event.tags.length > 0 && (
              <>
                <Separator />
                <div className="flex items-center flex-wrap gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  {event.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Registration card */}
          <aside>
            <Card className="sticky top-24 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Register for this Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {registered ? (
                  <div className="text-center py-6 space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="font-bold text-lg">You&apos;re Registered!</p>
                    <p className="text-sm text-muted-foreground">
                      {ticketCount} ticket{ticketCount > 1 ? 's' : ''} for {event.title}
                    </p>
                    <Link href="/account">
                      <Button variant="outline" className="w-full mt-2">View My Events</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Capacity */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {event.registeredCount}/{event.maxAttendees} registered
                        </span>
                        <span className={spotsLeft <= 5 ? 'text-destructive font-bold' : ''}>
                          {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                        </span>
                      </div>
                      <Progress value={fillPct} className="h-2" />
                    </div>

                    <Separator />

                    <div>
                      <label className="text-sm font-semibold mb-2 block">Number of Tickets</label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                          disabled={ticketCount <= 1}
                          aria-label="Decrease ticket count"
                        >
                          –
                        </Button>
                        <span className="font-bold text-base w-12 text-center">{ticketCount}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setTicketCount(Math.min(Math.min(4, spotsLeft), ticketCount + 1))}
                          disabled={ticketCount >= Math.min(4, spotsLeft)}
                          aria-label="Increase ticket count"
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5" />
                          £{event.ticketPrice} × {ticketCount}
                        </span>
                        <span>£{total}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span className="text-accent">£{total.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
                      disabled={spotsLeft === 0 || event.status !== 'PUBLISHED'}
                      onClick={handleRegister}
                    >
                      {spotsLeft === 0 ? 'Sold Out' : event.status !== 'PUBLISHED' ? 'Coming Soon' : 'Register Now'}
                    </Button>
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
