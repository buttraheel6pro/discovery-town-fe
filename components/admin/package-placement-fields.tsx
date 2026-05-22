/** Category, sub-category, and linked service row — matches Create Event layout. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { locations } from '@/lib/mock-data'
import {
  displayPageFromTopLevel,
  placementDraftFromSubCategory,
  topLevelFromPlacementDraft,
  type PackagePlacementDraft,
} from '@/lib/package-placement'
import {
  getSchedulingTopLevelId,
  getSchedulingTopLevelLabel,
  isConsumerAlignedCategoryId,
  SCHEDULING_TOP_LEVEL_ORDER,
  type SchedulingTopLevelId,
} from '@/lib/scheduling-consumer-categories'
import { useScheduling } from '@/lib/scheduling-store'
import type { EventPackage, SchedulingService } from '@/lib/types'

type Tier = EventPackage['tier']

export interface PackagePlacementFieldsProps {
  readonly assignableServices: readonly SchedulingService[]
  readonly draftServiceId: string
  readonly setDraftServiceId: (value: string) => void
  readonly draftTier: Tier
  readonly setDraftTier: (value: Tier) => void
  readonly draftBasePrice: string
  readonly setDraftBasePrice: (value: string) => void
  readonly value: PackagePlacementDraft
  readonly onChange: (next: PackagePlacementDraft) => void
  readonly lockedSubCategoryId?: string | null
}

export function PackagePlacementFields({
  assignableServices,
  draftServiceId,
  setDraftServiceId,
  draftTier,
  setDraftTier,
  draftBasePrice,
  setDraftBasePrice,
  value,
  onChange,
  lockedSubCategoryId = null,
}: Readonly<PackagePlacementFieldsProps>) {
  const { categories } = useScheduling()

  const sortedCategories = useMemo(() => {
    return categories
      .filter((entry) => isConsumerAlignedCategoryId(entry.id))
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }, [categories])

  const [programArea, setProgramArea] = useState<SchedulingTopLevelId>(() =>
    topLevelFromPlacementDraft(value),
  )

  const subCategoryId = value.schedulingCategoryIds[0] ?? ''

  const subCategoriesInProgramArea = useMemo(() => {
    return sortedCategories.filter(
      (entry) => getSchedulingTopLevelId(entry.id) === programArea,
    )
  }, [programArea, sortedCategories])

  const servicesForSubCategory = useMemo(() => {
    if (!subCategoryId) {
      return [...assignableServices]
    }
    return assignableServices.filter((service) => service.categoryId === subCategoryId)
  }, [assignableServices, subCategoryId])

  const selectedService = useMemo(() => {
    return assignableServices.find((service) => service.id === draftServiceId) ?? null
  }, [assignableServices, draftServiceId])

  const locationLabel = useMemo(() => {
    const locationId = selectedService?.locationId
    if (!locationId) {
      return '—'
    }
    return locations.find((entry) => entry.id === locationId)?.name ?? locationId
  }, [selectedService?.locationId])

  const lockedTopLevel =
    lockedSubCategoryId != null ? getSchedulingTopLevelId(lockedSubCategoryId) : null

  useEffect(() => {
    if (lockedSubCategoryId) {
      setProgramArea(getSchedulingTopLevelId(lockedSubCategoryId))
    }
  }, [lockedSubCategoryId])

  useEffect(() => {
    const fallback = subCategoriesInProgramArea[0]?.id ?? ''
    if (!fallback || subCategoriesInProgramArea.some((entry) => entry.id === subCategoryId)) {
      return
    }
    onChange(placementDraftFromSubCategory(fallback))
  }, [onChange, subCategoriesInProgramArea, subCategoryId])

  useEffect(() => {
    if (servicesForSubCategory.length === 0) {
      return
    }
    const stillValid = servicesForSubCategory.some((service) => service.id === draftServiceId)
    if (!stillValid) {
      setDraftServiceId(servicesForSubCategory[0]?.id ?? 'unassigned')
    }
  }, [draftServiceId, servicesForSubCategory, setDraftServiceId])

  function handleProgramAreaChange(nextTopLevel: SchedulingTopLevelId) {
    setProgramArea(nextTopLevel)
    const nextSub = sortedCategories.find(
      (entry) => getSchedulingTopLevelId(entry.id) === nextTopLevel,
    )
    if (nextSub) {
      onChange(placementDraftFromSubCategory(nextSub.id))
    } else {
      onChange({
        displayPages: [displayPageFromTopLevel(nextTopLevel)],
        schedulingCategoryIds: [],
      })
    }
  }

  function handleSubCategoryChange(categoryId: string) {
    onChange(placementDraftFromSubCategory(categoryId))
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label>Category</Label>
          {lockedTopLevel != null ? (
            <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm font-medium text-foreground">
              {getSchedulingTopLevelLabel(lockedTopLevel)}
            </div>
          ) : (
            <Select
              value={programArea}
              onValueChange={(next) => handleProgramAreaChange(next as SchedulingTopLevelId)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULING_TOP_LEVEL_ORDER.map((topLevelId) => (
                  <SelectItem key={topLevelId} value={topLevelId}>
                    {getSchedulingTopLevelLabel(topLevelId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <Label>Sub-category</Label>
          {lockedSubCategoryId ? (
            <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm font-medium text-foreground">
              {sortedCategories.find((entry) => entry.id === lockedSubCategoryId)?.name ??
                lockedSubCategoryId}
            </div>
          ) : (
            <Select value={subCategoryId} onValueChange={handleSubCategoryChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sub-category" />
              </SelectTrigger>
              <SelectContent>
                {subCategoriesInProgramArea.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
        <div className="min-w-0 space-y-2">
          <Label>Linked service</Label>
          <Select value={draftServiceId} onValueChange={setDraftServiceId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {servicesForSubCategory.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label>Package tier</Label>
          <Select value={draftTier} onValueChange={(tier) => setDraftTier(tier as Tier)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SILVER">SILVER</SelectItem>
              <SelectItem value="GOLD">GOLD</SelectItem>
              <SelectItem value="PLATINUM">PLATINUM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="pkg-header-price">Base price</Label>
          <Input
            id="pkg-header-price"
            type="number"
            min={0}
            step={0.01}
            value={draftBasePrice}
            onChange={(event) => setDraftBasePrice(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
        <div className="min-w-0 space-y-2">
          <Label>Location</Label>
          <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground">
            {locationLabel}
          </div>
        </div>
        <div className="min-w-0 space-y-2">
          <Label>Booking mode</Label>
          <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground">
            {selectedService?.bookingMode ?? '—'}
          </div>
        </div>
        <div className="min-w-0 space-y-2">
          <Label>Event Type</Label>
          <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground">
            {selectedService?.serviceType ?? '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
