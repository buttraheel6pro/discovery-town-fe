/** Open Play session pass detection — 2hr / sibling / multi-pass (not membership catalog). */
import { isOpenPlaySchedulingCategory } from '@/lib/open-play-consumer-section'
import { isOpenPlayPassCatalogService } from '@/lib/open-play-pass-catalog'
import type { SchedulingCategory, SchedulingOfferingKind, SchedulingService } from '@/lib/types'

type OpenPlaySessionPassFields = Pick<
  SchedulingService,
  | 'id'
  | 'serviceType'
  | 'bookingMode'
  | 'bookingOfferingKind'
  | 'category'
  | 'categoryId'
  | 'isPackageService'
>

type OpenPlayPassInferenceInput = {
  readonly bookingOfferingKind?: string | null
  readonly bookingMode: string
  readonly serviceType: string
  readonly isPackageService?: boolean | null
  readonly maxPassCount?: number | null
  readonly siblingPrice?: string | number | null
  readonly metadata?: Record<string, unknown> | null
}

export function isOpenPlaySessionPassOffering(service: OpenPlaySessionPassFields): boolean {
  if (isOpenPlayPassCatalogService(service as SchedulingService)) {
    return false
  }
  if (service.isPackageService === true) {
    return false
  }
  if (service.serviceType !== 'OPEN_PLAY' || service.bookingMode !== 'OPEN') {
    return false
  }
  if (service.bookingOfferingKind === 'PASS') {
    return true
  }
  return isOpenPlaySchedulingCategory(
    service.category ?? { id: service.categoryId, name: '' },
  )
}

export function inferOpenPlaySessionPassOfferingKind(
  raw: OpenPlayPassInferenceInput,
  category: Pick<SchedulingCategory, 'id' | 'name'>,
): SchedulingOfferingKind {
  if (raw.bookingOfferingKind === 'PASS' || raw.bookingOfferingKind === 'SERVICE') {
    return raw.bookingOfferingKind
  }
  const metadata = raw.metadata
  if (metadata && typeof metadata === 'object') {
    const metaKind = metadata.bookingOfferingKind ?? metadata.listingKind ?? metadata.offeringKind
    if (metaKind === 'PASS' || metaKind === 'SERVICE') {
      return metaKind
    }
  }
  if (raw.isPackageService === true) {
    return 'SERVICE'
  }
  if (
    raw.bookingMode === 'OPEN' &&
    raw.serviceType === 'OPEN_PLAY' &&
    isOpenPlaySchedulingCategory(category)
  ) {
    return 'PASS'
  }
  if (raw.maxPassCount != null || raw.siblingPrice != null) {
    return 'PASS'
  }
  return 'SERVICE'
}
