/** Horizontal-rail card for gym classes — shows age range, schedule, sport type. */
'use client'

import { CalendarDays, Clock3, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListingCard } from '@/components/customer/listing-card'
import type { SchedulingService } from '@/lib/types'

interface GymClassScrollCardProps {
  readonly service: SchedulingService
}

const SPORT_LABELS: Record<string, string> = {
  GYMNASTICS: 'Gymnastics',
  FITNESS: 'Fitness',
  SWIMMING: 'Swim',
  MARTIAL_ARTS: 'Martial Arts',
  DANCE: 'Dance',
  YOGA: 'Yoga',
  PILATES: 'Pilates',
  NINJA: 'Ninja',
  CHEER: 'Cheer',
  SPORTS: 'Multi-Sport',
}

function formatAgeRange(ageMin: number | null, ageMax: number | null): string | null {
  if (ageMin == null && ageMax == null) return null
  const fmt = (years: number) => {
    // ageMin/Max are integer years from the DB; 0 = newborn/infant
    if (years === 0) return 'Newborn'
    if (years < 1) return `${Math.round(years * 12)}mo`
    if (years === 1) return '1 yr'
    return `${years} yrs`
  }
  if (ageMin != null && ageMax != null) {
    // Special case: 0 (newborn) to some max → "Up to X yrs"
    if (ageMin === 0) return `Up to ${fmt(ageMax)}`
    return `Ages ${fmt(ageMin)} – ${fmt(ageMax)}`
  }
  if (ageMin != null) return `${fmt(ageMin)}+`
  return `Up to ${fmt(ageMax!)}`
}

function firstScheduleEntry(
  schedule: { dayOfWeek: string; startTime: string; endTime: string }[] | undefined,
): string | null {
  if (!schedule || schedule.length === 0) return null
  const { dayOfWeek, startTime } = schedule[0]
  // Abbreviate long day strings like "Monday – Thursday" → "Mon – Thu"
  const abbreviated = dayOfWeek
    .replace(/Monday/g, 'Mon')
    .replace(/Tuesday/g, 'Tue')
    .replace(/Wednesday/g, 'Wed')
    .replace(/Thursday/g, 'Thu')
    .replace(/Friday/g, 'Fri')
    .replace(/Saturday/g, 'Sat')
    .replace(/Sunday/g, 'Sun')
  return `${abbreviated} · ${startTime}`
}

export function GymClassScrollCard({ service }: GymClassScrollCardProps) {
  const ageLabel = formatAgeRange(service.ageMin ?? null, service.ageMax ?? null)
  const scheduleLabel = firstScheduleEntry(service.schedule)
  const sport = service.sport ? (SPORT_LABELS[service.sport] ?? service.sport) : null
  const sessionsPerWeek = service.schedule?.length ?? 0

  return (
    <div className="flex w-[280px] shrink-0 snap-start self-stretch sm:w-[300px]">
      <ListingCard
        fillHeight
        className="w-full"
        href={`/classes/${service.id}`}
        title={service.name}
        description={service.description ?? ''}
        imageUrl={service.imageUrl ?? undefined}
        topLeft={
          <div className="flex flex-wrap items-center gap-1.5">
            {sport ? (
              <Badge className="bg-accent text-accent-foreground text-[10px] font-semibold">
                {sport}
              </Badge>
            ) : null}
            {service.level ? (
              <Badge variant="secondary" className="text-[10px] font-semibold">
                {service.level}
              </Badge>
            ) : null}
          </div>
        }
        bottomRight={
          <span className="rounded-md bg-black/70 px-2.5 py-1 text-sm font-bold text-white">
            ${service.basePrice}
            <span className="text-[11px] font-normal">/session</span>
          </span>
        }
        meta={
          <div className="flex min-h-[4.5rem] flex-col justify-start gap-2 text-xs text-muted-foreground">
            {ageLabel ? (
              <p className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>{ageLabel}</span>
              </p>
            ) : null}
            <p className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 shrink-0" />
              <span>{service.durationMinutes} mins</span>
            </p>
            {scheduleLabel ? (
              <p className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">
                  {scheduleLabel}
                  {sessionsPerWeek > 1 ? ` +${sessionsPerWeek - 1} more` : ''}
                </span>
              </p>
            ) : null}
          </div>
        }
        footer={
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
          >
            {service.bookingMode === 'SCHEDULED' ? 'View class' : 'Book now'}
          </Button>
        }
      />
    </div>
  )
}
