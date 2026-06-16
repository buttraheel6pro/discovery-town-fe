/** Learn module helpers — service type checks, labels, and catalog routing. */

import type {
  GradeLevel,
  LearningFormat,
  ProgramTerm,
  SchedulingService,
  SchedulingServiceType,
  SubjectArea,
} from '@/lib/types'
import { SchedulingServiceTypeEnum } from '@/lib/types'

export const LEARN_SERVICE_TYPES: readonly SchedulingServiceType[] = [
  SchedulingServiceTypeEnum.TUTORING_SESSION,
  SchedulingServiceTypeEnum.TEST_PREP,
  SchedulingServiceTypeEnum.ENRICHMENT_CLASS,
] as const

export const GRADE_LEVEL_OPTIONS: readonly GradeLevel[] = [
  'K-2',
  '3-5',
  '6-8',
  '9-12',
  'Adult',
  'All',
] as const

export const SUBJECT_AREA_OPTIONS: readonly SubjectArea[] = [
  'Math',
  'Literacy',
  'Writing',
  'Science',
  'History',
  'Foreign Language',
  'Test Prep',
  'Technology',
  'Life Skills',
  'Arts',
  'Other',
] as const

export const LEARNING_FORMAT_OPTIONS: readonly LearningFormat[] = [
  'individual',
  'small-group',
  'group',
  'bootcamp',
  'workshop',
] as const

export const PROGRAM_TERM_OPTIONS: readonly ProgramTerm[] = [
  'Fall',
  'Spring',
  'Summer',
  'Year-Round',
  'Custom',
] as const

export function isLearnServiceType(serviceType: SchedulingServiceType): boolean {
  return (LEARN_SERVICE_TYPES as readonly string[]).includes(serviceType)
}

export function isLearnCategoryId(categoryId: string): boolean {
  return categoryId.startsWith('cat-learn-')
}

export function isLearnSchedulingService(service: SchedulingService): boolean {
  return (
    isLearnCategoryId(service.categoryId) || isLearnServiceType(service.serviceType)
  )
}

export interface AdminLearnServiceFormHrefParams {
  readonly categoryId?: string
  readonly serviceId?: string
  readonly serviceType?: SchedulingServiceType
  readonly returnTo?: string
}

/** Admin create/edit URL for learn programs (not the generic scheduling form). */
export function buildAdminLearnServiceFormHref(
  params: AdminLearnServiceFormHrefParams,
): string {
  const search = new URLSearchParams()
  const categoryId = params.categoryId?.trim()
  const serviceId = params.serviceId?.trim()
  const serviceType = params.serviceType?.trim()
  const returnTo = params.returnTo?.trim()

  if (categoryId) {
    search.set('categoryId', categoryId)
  }
  if (serviceId) {
    search.set('serviceId', serviceId)
  }
  if (serviceType) {
    search.set('serviceType', serviceType)
  }
  if (returnTo) {
    search.set('returnTo', returnTo)
  }

  const query = search.toString()
  return query.length > 0
    ? `/admin/learn/services/new?${query}`
    : '/admin/learn/services/new'
}

export function formatLearningFormat(format: LearningFormat | undefined): string {
  switch (format) {
    case 'individual':
      return 'Individual (1:1)'
    case 'small-group':
      return 'Small group (2–4)'
    case 'group':
      return 'Group (5–8)'
    case 'bootcamp':
      return 'Bootcamp'
    case 'workshop':
      return 'Workshop'
    default:
      return '—'
  }
}

export function formatProgramTermLabel(
  term: ProgramTerm | undefined,
  year: number | undefined,
): string {
  if (!term) {
    return '—'
  }
  if (year != null && term !== 'Year-Round' && term !== 'Custom') {
    return `${term} ${year}`
  }
  return term
}
