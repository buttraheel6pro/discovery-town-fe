/** Compact blocks: description, benefits, play add-ons, and play coupons for plan cards. */
'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface MembershipPlanExtrasCompactProps {
  readonly description?: string
  /** When false, omit description (e.g. ListingCard already shows it). Default true. */
  readonly showDescription?: boolean
  readonly benefits: readonly string[]
  readonly addOnLines: readonly string[]
  readonly couponLines: readonly string[]
  readonly maxBenefits?: number
  readonly className?: string
}

const sectionTitleClass =
  'text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'

export function MembershipPlanExtrasCompact({
  description,
  showDescription = true,
  benefits,
  addOnLines,
  couponLines,
  maxBenefits,
  className,
}: Readonly<MembershipPlanExtrasCompactProps>) {
  const benefitSlice =
    maxBenefits !== undefined ? benefits.slice(0, maxBenefits) : [...benefits]
  const hiddenBenefitCount =
    maxBenefits !== undefined ? Math.max(0, benefits.length - maxBenefits) : 0

  const hasAny =
    (showDescription && Boolean(description?.trim())) ||
    benefitSlice.length > 0 ||
    addOnLines.length > 0 ||
    couponLines.length > 0

  if (!hasAny) {
    return null
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {showDescription && description?.trim() ? (
        <p className="line-clamp-3 text-xs leading-snug text-muted-foreground">
          {description.trim()}
        </p>
      ) : null}

      {benefitSlice.length > 0 ? (
        <div className="space-y-0.5">
          <p className={sectionTitleClass}>Benefits</p>
          <ul className="space-y-0.5 text-[11px] leading-snug text-muted-foreground">
            {benefitSlice.map((b, i) => (
              <li key={`${b}-${i}`} className="flex gap-1">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          {hiddenBenefitCount > 0 ? (
            <p className="text-[10px] text-muted-foreground">
              +{hiddenBenefitCount} more
            </p>
          ) : null}
        </div>
      ) : null}

      {addOnLines.length > 0 ? (
        <div className="space-y-0.5">
          <p className={sectionTitleClass}>Play add-ons</p>
          <div className="flex flex-wrap gap-1">
            {addOnLines.map((line, i) => (
              <Badge
                key={`${line}-${i}`}
                variant="outline"
                className="h-auto max-w-full whitespace-normal px-1.5 py-0 text-[10px] font-normal leading-tight text-muted-foreground"
              >
                {line}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {couponLines.length > 0 ? (
        <div className="space-y-0.5">
          <p className={sectionTitleClass}>Play coupons</p>
          <div className="flex flex-wrap gap-1">
            {couponLines.map((line, i) => (
              <Badge
                key={`${line}-${i}`}
                variant="secondary"
                className="h-auto px-1.5 py-0 text-[10px] font-medium leading-tight"
              >
                {line}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
