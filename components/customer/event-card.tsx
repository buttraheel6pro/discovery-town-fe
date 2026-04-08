/** Event listing card — detailed event pattern, backed by scheduling service. */
import { Calendar, Clock, MapPin, Users, Ticket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ListingCard } from '@/components/customer/listing-card'
import type { SchedulingService, SchedulingSlot } from '@/lib/types'

interface EventCardProps {
  readonly service: SchedulingService
  readonly slot?: SchedulingSlot
}

function formatDateLabel(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  )
}

export function EventCard({ service, slot }: EventCardProps) {
  const max = slot?.effectiveCapacity ?? service.maxAttendees ?? service.capacity
  const registered = slot?.bookedCount ?? service.registeredCount ?? 0
  const spotsLeft = Math.max(0, max - registered)
  const fillPct = max > 0 ? Math.round((registered / max) * 100) : 0
  const isSoldOut = spotsLeft === 0
  const startD = service.startDate
  const endD = service.endDate
  const title = service.name
  const timeRange =
    service.startTime && service.endTime
      ? `${service.startTime} – ${service.endTime}`
      : '—'
  const location = service.location ?? 'TBC'
  const ticketPrice = service.basePrice
  const status = service.eventStatus
  const published = status === 'PUBLISHED'

  return (
    <ListingCard
      href={`/events/${service.id}`}
      title={title}
      description={service.description ?? ''}
      imageUrl={service.imageUrl ?? undefined}
      topLeft={
        <Badge className="bg-accent text-accent-foreground text-xs font-semibold">
          {service.sport ?? 'EVENT'}
        </Badge>
      }
      topRight={
        isSoldOut ? (
          <Badge variant="destructive" className="text-xs">
            Sold Out
          </Badge>
        ) : null
      }
      meta={
        <>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>
                {formatDateLabel(startD)}
                {endD && endD !== startD ? ` – ${formatDateLabel(endD)}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>{timeRange}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              <span className="truncate">{location}</span>
            </div>
          </div>

          <div className="space-y-1 mt-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" /> {registered}/{max} registered
              </span>
              <span
                className={
                  spotsLeft <= 5 && spotsLeft > 0
                    ? 'text-destructive font-semibold'
                    : 'text-muted-foreground'
                }
              >
                {spotsLeft > 0 ? `${spotsLeft} left` : 'Full'}
              </span>
            </div>
            <Progress value={fillPct} className="h-1.5" />
          </div>
        </>
      }
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-foreground font-bold">
            <Ticket className="w-4 h-4 text-accent" />
            <span>{ticketPrice > 0 ? `£${ticketPrice}` : 'Free'}</span>
          </div>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            disabled={isSoldOut || !published}
          >
            {!published ? 'Coming Soon' : isSoldOut ? 'Sold Out' : 'Register'}
          </Button>
        </div>
      }
    />
  )
}
