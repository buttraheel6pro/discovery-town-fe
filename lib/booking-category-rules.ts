/** Category flags that drive household / adult fields on consumer booking flows. */
import type { SchedulingCategory } from '@/lib/types'

export function needsAccompanyingAdultPicker(
  category: Pick<SchedulingCategory, 'requiresAttendee'>,
): boolean {
  return category.requiresAttendee === true
}

export function needsHouseholdChildPicker(
  category: Pick<SchedulingCategory, 'allowFamilyMember'>,
): boolean {
  return category.allowFamilyMember === true
}

export function needsAgeParticipantPicker(
  category: SchedulingCategory,
  serviceAgeMin: number | null,
  serviceAgeMax: number | null,
): boolean {
  if (needsHouseholdChildPicker(category) || needsAccompanyingAdultPicker(category)) {
    return false
  }
  return serviceAgeMin !== null || serviceAgeMax !== null
}

/** Guardian picker — only when admin enables child must attend with an adult. */
export function needsGuardianPicker(
  category: Pick<SchedulingCategory, 'requiresAttendee'>,
): boolean {
  return needsAccompanyingAdultPicker(category)
}
