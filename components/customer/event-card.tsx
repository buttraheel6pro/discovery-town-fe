import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, MapPin, Users, Ticket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Event } from '@/lib/types'

interface EventCardProps {
  event: Event
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function EventCard({ event }: EventCardProps) {
  const spotsLeft = event.maxAttendees - event.registeredCount
  const fillPct = Math.round((event.registeredCount / event.maxAttendees) * 100)
  const isSoldOut = spotsLeft === 0

  return (
    <article className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge className="bg-accent text-accent-foreground text-xs font-semibold">{event.sport}</Badge>
        </div>
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-destructive text-white font-bold px-4 py-2 rounded-lg text-sm uppercase tracking-wider">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-bold text-foreground text-base leading-tight">{event.title}</h3>
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span>{formatDate(event.startDate)}{event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ''}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>{event.startTime} – {event.endTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> {event.registeredCount}/{event.maxAttendees} registered
            </span>
            <span className={spotsLeft <= 5 ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
              {spotsLeft > 0 ? `${spotsLeft} left` : 'Full'}
            </span>
          </div>
          <Progress value={fillPct} className="h-1.5" />
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-foreground font-bold">
            <Ticket className="w-4 h-4 text-accent" />
            <span>{event.ticketPrice > 0 ? `£${event.ticketPrice}` : 'Free'}</span>
          </div>
          <Link href={`/events/${event.id}`}>
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              disabled={isSoldOut}
            >
              {isSoldOut ? 'Sold Out' : 'Register'}
            </Button>
          </Link>
        </div>
      </div>
    </article>
  )
}
