/** Child age checks for service-specific booking restrictions. */
import { PARENTS_NIGHT_OUT_SERVICE_ID } from '@/lib/booking-household'
import type { SchedulingService } from '@/lib/types'

export const PARENTS_NIGHT_AGE_RESTRICTION_LABEL = 'Ages 6 months to 7 years' as const

const PARENTS_NIGHT_MIN_AGE_MONTHS = 6
const PARENTS_NIGHT_MAX_AGE_YEARS = 7

export interface ServiceChildAgeRules {
  readonly label: string
  readonly isEligible: (dateOfBirth: string | undefined) => boolean
}

export function childAgeInMonths(dateOfBirth: string | undefined): number | null {
  if (!dateOfBirth?.trim()) {
    return null
  }
  const normalized = dateOfBirth.includes('T')
    ? dateOfBirth
    : `${dateOfBirth}T00:00:00`
  const dob = new Date(normalized)
  if (Number.isNaN(dob.getTime())) {
    return null
  }
  const now = new Date()
  let months =
    (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth())
  if (now.getDate() < dob.getDate()) {
    months -= 1
  }
  if (months < 0) {
    return null
  }
  return months
}

export function isChildEligibleForParentsNight(
  dateOfBirth: string | undefined,
): boolean {
  const months = childAgeInMonths(dateOfBirth)
  if (months == null) {
    return false
  }
  if (months < PARENTS_NIGHT_MIN_AGE_MONTHS) {
    return false
  }
  const years = Math.floor(months / 12)
  return years <= PARENTS_NIGHT_MAX_AGE_YEARS
}

export function resolveServiceChildAgeRules(
  service: SchedulingService,
): ServiceChildAgeRules | null {
  if (service.id === PARENTS_NIGHT_OUT_SERVICE_ID) {
    return {
      label: PARENTS_NIGHT_AGE_RESTRICTION_LABEL,
      isEligible: isChildEligibleForParentsNight,
    }
  }
  return null
}
