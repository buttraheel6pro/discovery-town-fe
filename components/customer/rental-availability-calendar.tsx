/** Mock availability calendar for rental products. */
import { rentalBookedDates } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface RentalAvailabilityCalendarProps {
  readonly productId: string
  readonly stockQuantity: number
}

function getUpcomingDates(): string[] {
  const now = new Date()
  const dates: string[] = []
  for (let index = 0; index < 28; index += 1) {
    const next = new Date(now)
    next.setDate(now.getDate() + index)
    dates.push(next.toISOString().slice(0, 10))
  }
  return dates
}

export function RentalAvailabilityCalendar({
  productId,
  stockQuantity,
}: Readonly<RentalAvailabilityCalendarProps>) {
  const days = getUpcomingDates()
  const availabilityMap = new Map(
    (rentalBookedDates[productId] ?? []).map((entry) => [entry.date, entry.bookedUnits]),
  )

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-lg font-bold text-foreground">Availability (next 4 weeks)</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
        {days.map((day) => {
          const bookedUnits = availabilityMap.get(day) ?? 0
          const isFullyBooked = bookedUnits >= stockQuantity && stockQuantity > 0
          const isPartial = bookedUnits > 0 && !isFullyBooked
          return (
            <div
              key={day}
              className={cn(
                'rounded-md border px-2 py-2 text-xs',
                isFullyBooked && 'border-red-200 bg-red-100 text-red-700',
                isPartial && 'border-amber-200 bg-amber-100 text-amber-700',
                !isFullyBooked && !isPartial && 'border-green-200 bg-green-100 text-green-700',
              )}
            >
              <p className="font-semibold">{day.slice(5)}</p>
              <p>{isFullyBooked ? 'Fully booked' : isPartial ? 'Partially booked' : 'Available'}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
