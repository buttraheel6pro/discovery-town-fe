/** Browse crumbs + section shells for Gym / Play / Events (placement-aware). */

import type { SchedulingCatalogSlug } from '@/lib/catalog-slugs'
import {
  isOpenPlaySchedulingCategory,
  isOpenPlaySchedulingSectionId,
} from '@/lib/open-play-consumer-section'
import type { OpenPlayMembershipOffer } from '@/lib/open-play-membership-offers'
import { filterConsumerSchedulingCategoriesForMenu } from '@/lib/scheduling-visibility'
import type { SchedulingCategory, SchedulingService } from '@/lib/types'

export interface SchedulingMenuBrowseCrumb {
  readonly id: string
  readonly label: string
  readonly href: string
}

export interface SchedulingMenuContentSection {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly services: SchedulingService[]
  readonly membershipOffers: readonly OpenPlayMembershipOffer[]
}

export function schedulingCategoriesForConsumerMenu(
  menuSlug: SchedulingCatalogSlug,
  categories: readonly SchedulingCategory[],
): SchedulingCategory[] {
  return filterConsumerSchedulingCategoriesForMenu(menuSlug, categories).filter(
    (category) => !isOpenPlaySchedulingCategory(category),
  )
}

function isOpenPlayBrowseCrumb(crumb: SchedulingMenuBrowseCrumb): boolean {
  if (isOpenPlaySchedulingSectionId(crumb.id)) {
    return true
  }
  return crumb.label.trim().toLowerCase() === 'open play'
}

function dedupeSchedulingMenuBrowseCrumbs(
  crumbs: readonly SchedulingMenuBrowseCrumb[],
): SchedulingMenuBrowseCrumb[] {
  const seenIds = new Set<string>()
  let seenOpenPlay = false

  return crumbs.filter((crumb) => {
    if (seenIds.has(crumb.id)) {
      return false
    }
    if (isOpenPlayBrowseCrumb(crumb)) {
      if (seenOpenPlay) {
        return false
      }
      seenOpenPlay = true
    }
    seenIds.add(crumb.id)
    return true
  })
}

/** Crumbs in the same order sections appear on the page (caller supplies DOM order). */
export function buildSchedulingMenuBrowseCrumbsFromPageOrder(
  sectionsInPageOrder: readonly SchedulingMenuBrowseCrumb[],
): SchedulingMenuBrowseCrumb[] {
  return dedupeSchedulingMenuBrowseCrumbs(sectionsInPageOrder)
}

/** Gym / Play — product sub-categories placed on a scheduling menu. */
export function schedulingMenuProductRailsCrumbs(
  sections: readonly { readonly id: string; readonly title: string }[],
): SchedulingMenuBrowseCrumb[] {
  return sections.map((section) => ({
    id: `product-menu-${section.id}`,
    label: section.title,
    href: `#product-menu-${section.id}`,
  }))
}

/** Gym / Play — scheduling category rails. */
export function schedulingMenuServiceRailsCrumbs(
  sections: readonly { readonly id: string; readonly title: string }[],
): SchedulingMenuBrowseCrumb[] {
  return sections.map((section) => ({
    id: section.id,
    label: section.title,
    href: `#${section.id}`,
  }))
}

/** Store / Rentals — scheduling sections from SchedulingProductMenuRails. */
export function schedulingProductMenuRailsCrumbs(
  sections: readonly { readonly id: string; readonly title: string }[],
): SchedulingMenuBrowseCrumb[] {
  return sections.map((section) => ({
    id: `scheduling-${section.id}`,
    label: section.title,
    href: `#scheduling-${section.id}`,
  }))
}

/** Events page grouped sections. */
export function eventsMenuSectionCrumbs(
  sections: readonly { readonly key: string; readonly title: string }[],
): SchedulingMenuBrowseCrumb[] {
  return sections.map((section) => ({
    id: section.key,
    label: section.title,
    href: `#events-section-${section.key}`,
  }))
}

/** Gym / Play browse pills in DOM order (scheduling first or product rails first). */
export function buildSchedulingMenuPageBrowseCrumbs(params: {
  readonly productSections: readonly { readonly id: string; readonly title: string }[]
  readonly contentSections: readonly { readonly id: string; readonly title: string }[]
  readonly productSectionsLast?: boolean
}): SchedulingMenuBrowseCrumb[] {
  const schedulingCrumbs = schedulingMenuServiceRailsCrumbs(params.contentSections)
  const productCrumbs = schedulingMenuProductRailsCrumbs(params.productSections)
  const ordered = params.productSectionsLast
    ? [...schedulingCrumbs, ...productCrumbs]
    : [...productCrumbs, ...schedulingCrumbs]
  return buildSchedulingMenuBrowseCrumbsFromPageOrder(ordered)
}
