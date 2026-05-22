/** Class listing card — Beginner Yoga visual pattern, backed by scheduling service. */
import { Clock, Users, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ListingCard } from '@/components/customer/listing-card'
import type { Class, SchedulingService, SchedulingSlot } from '@/lib/types'

interface ClassCardProps {
  readonly service: SchedulingService
  /** Nearest upcoming bookable slot for spot counts; optional. */
  readonly nextSlot?: SchedulingSlot
}

const levelColors: Record<Class['level'], string> = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
  'All Levels': 'bg-blue-100 text-blue-700',
}

export function ClassCard({ service, nextSlot }: ClassCardProps) {
  const capacity = nextSlot?.effectiveCapacity ?? service.capacity
  const booked = nextSlot?.bookedCount ?? 0
  const spotsLeft = Math.max(0, capacity - booked)
  const isFull = spotsLeft === 0 && Boolean(nextSlot)
  const level = service.level ?? 'All Levels'
  const levelClass =
    level in levelColors ? levelColors[level as Class['level']] : levelColors['All Levels']
  const instructorName = service.instructorName ?? 'TBC'
  const sessionsPerWeek = service.schedule?.length ?? 1
  const avatarSrc = service.imageUrl ?? undefined

  return (
    <ListingCard
      href={`/classes/${service.id}`}
      title={service.name}
      description={service.description ?? ''}
      imageUrl={service.imageUrl ?? undefined}
      topLeft={
        <>
          <Badge className="bg-accent text-accent-foreground text-xs">
            {service.sport ?? 'CLASS'}
          </Badge>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelClass}`}
          >
            {level}
          </span>
        </>
      }
      meta={
        <>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={avatarSrc} alt={instructorName} />
              <AvatarFallback className="text-xs bg-secondary">
                {instructorName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{instructorName}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {service.durationMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {nextSlot
                ? spotsLeft > 0
                  ? `${spotsLeft} spots left`
                  : 'Full'
                : `${service.capacity} max`}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {sessionsPerWeek}x/week
            </span>
          </div>
        </>
      }
      footer={
        <div className="flex items-center justify-between">
          <span className="font-bold text-foreground text-base">
            ${service.basePrice}
            <span className="text-xs font-normal text-muted-foreground">/session</span>
          </span>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            disabled={isFull}
          >
            {isFull ? 'Full' : 'Enrol'}
          </Button>
        </div>
      }
    />
  )
}
