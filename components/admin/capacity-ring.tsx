/** Capacity ring — circular booked/capacity indicator for admin views. */

import { cn } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg'

const sizePx: Record<Size, number> = {
  sm: 40,
  md: 60,
  lg: 80,
}

export function CapacityRing({
  booked,
  capacity,
  size = 'md',
}: Readonly<{ booked: number; capacity: number; size?: Size }>) {
  const safeCapacity = Math.max(1, capacity)
  const pct = Math.min(1, Math.max(0, booked / safeCapacity))

  let colorClass = 'text-green-500'
  if (pct >= 0.9) colorClass = 'text-red-500'
  else if (pct >= 0.6) colorClass = 'text-amber-500'

  const r = 16
  const stroke = 4
  const c = 2 * Math.PI * r
  const dash = c * pct

  const px = sizePx[size]

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: px, height: px }}
      aria-label={`${booked}/${capacity} booked`}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 40 40"
        className={cn('block', colorClass)}
        aria-hidden="true"
      >
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={stroke}
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-foreground">
        {booked}/{capacity}
      </span>
    </div>
  )
}

