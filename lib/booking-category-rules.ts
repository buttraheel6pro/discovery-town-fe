/** Category flags that drive household / adult fields on consumer booking flows. */
import {
  CAMP_PLAY_CATEGORY_ID,
  SPECIAL_PLAY_EVENTS_CATEGORY_ID,
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

export function isSpecialPlayEventsCategory(
  category: Pick<SchedulingCategory, 'id'>,
): boolean {
  return category.id === SPECIAL_PLAY_EVENTS_CATEGORY_ID
}

/** Summer camps and special play events share the same registration form. */
export function usesCampStyleRegistrationForm(
  category: Pick<SchedulingCategory, 'id'>,
): boolean {
  return isCampPlayCategory(category) || isSpecialPlayEventsCategory(category)
}

/** Camps, summer camps, and special play events require a named participant. */
export function needsCampParticipantPicker(
  category: Pick<SchedulingCategory, 'id'>,
): boolean {
  return usesCampStyleRegistrationForm(category)
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
