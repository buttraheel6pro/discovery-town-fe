/** Category flags that drive household / adult fields on consumer booking flows. */
import {
  CAMP_PLAY_CATEGORY_ID,
  SUMMER_CAMP_PLAY_CATEGORY_ID,
} from '@/lib/scheduling-slot-availability'
import type { SchedulingCategory } from '@/lib/types'

export function isCampPlayCategory(
  category: Pick<SchedulingCategory, 'id'>,
): boolean {
  return (
    category.id === CAMP_PLAY_CATEGORY_ID ||
    category.id === SUMMER_CAMP_PLAY_CATEGORY_ID
  )
}

/** Camps and summer camps always require a named participant at checkout. */
export function needsCampParticipantPicker(
  category: Pick<SchedulingCategory, 'id'>,
): boolean {
  return isCampPlayCategory(category)
}

/** Admin "Child must attend with an adult" (`requiresAttendee` on the subcategory). */
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
  if (needsHouseholdChildPicker(category)) {
    return false
  }
  if (needsCampParticipantPicker(category)) {
    return true
  }
  return serviceAgeMin !== null || serviceAgeMax !== null
}

/**
 * Guardian picker — when admin enables child must attend with an adult.
 * Shown together with the participant picker (not instead of it).
 */
export function needsGuardianPicker(
  category: Pick<SchedulingCategory, 'requiresAttendee'>,
): boolean {
  return needsAccompanyingAdultPicker(category)
}
