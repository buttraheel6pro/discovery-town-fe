/** Modal to duplicate a package with category placement and linked service. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { PackagePlacementFields } from '@/components/admin/package-placement-fields'
import { filterAssignableServices } from '@/components/admin/scheduling-package-fields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  buildPackagePlacementPatch,
  EMPTY_PACKAGE_PLACEMENT,
  placementDraftFromPackage,
  placementDraftFromSubCategory,
  type PackagePlacementDraft,
} from '@/lib/package-placement'
import { useScheduling } from '@/lib/scheduling-store'
import type { EventPackage, SchedulingService } from '@/lib/types'

export interface DuplicatePackageDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly sourcePackage: EventPackage | null
  readonly defaultServiceId?: string | null
  readonly defaultSubCategoryId?: string | null
  readonly onConfirm: (input: {
    packageId: string
    serviceId: string
    placement: PackagePlacementDraft
  }) => void
}

function filterPackageOnlyServices(
  services: readonly SchedulingService[],
): SchedulingService[] {
  const packageServices = services.filter((service) => service.isPackageService === true)
  if (packageServices.length > 0) {
    return packageServices
  }
  return [...services]
}

export function DuplicatePackageDialog({
  open,
  onOpenChange,
  sourcePackage,
  defaultServiceId = null,
  defaultSubCategoryId = null,
  onConfirm,
}: Readonly<DuplicatePackageDialogProps>) {
  const { services } = useScheduling()
  const assignableServices = useMemo(
    () => filterPackageOnlyServices(filterAssignableServices(services)),
    [services],
  )

  const [draftServiceId, setDraftServiceId] = useState('unassigned')
  const [draftTier, setDraftTier] = useState<EventPackage['tier']>('SILVER')
  const [draftBasePrice, setDraftBasePrice] = useState('0')
  const [placementDraft, setPlacementDraft] =
    useState<PackagePlacementDraft>(EMPTY_PACKAGE_PLACEMENT)

  useEffect(() => {
    if (!open || !sourcePackage) {
      return
    }

    const basePlacement = placementDraftFromPackage(sourcePackage)
    const nextPlacement =
      defaultSubCategoryId != null
        ? placementDraftFromSubCategory(defaultSubCategoryId)
        : basePlacement

    setPlacementDraft(nextPlacement)
    setDraftTier(sourcePackage.tier)
    setDraftBasePrice(String(sourcePackage.basePrice))

    const preferredServiceId =
      defaultServiceId ??
      (defaultSubCategoryId != null
        ? (assignableServices.find(
            (service) =>
              service.categoryId === defaultSubCategoryId && service.isPackageService === true,
          )?.id ??
          assignableServices.find((service) => service.categoryId === defaultSubCategoryId)?.id)
        : null) ??
      sourcePackage.serviceId

    const resolvedService =
      assignableServices.find((service) => service.id === preferredServiceId)?.id ??
      assignableServices.find((service) => service.categoryId === nextPlacement.schedulingCategoryIds[0])
        ?.id ??
      assignableServices[0]?.id ??
      'unassigned'

    setDraftServiceId(resolvedService)
  }, [
    assignableServices,
    defaultServiceId,
    defaultSubCategoryId,
    open,
    sourcePackage,
  ])

  function handleConfirm() {
    if (!sourcePackage || draftServiceId === 'unassigned') {
      return
    }
    onConfirm({
      packageId: sourcePackage.id,
      serviceId: draftServiceId,
      placement: placementDraft,
    })
    onOpenChange(false)
  }

  const canSubmit = draftServiceId !== 'unassigned' && placementDraft.schedulingCategoryIds.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Duplicate package</DialogTitle>
          <DialogDescription>
            Choose where the copy appears and which package-only service it belongs to.
          </DialogDescription>
        </DialogHeader>

        {sourcePackage ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copying{' '}
              <span className="font-semibold text-foreground">
                {sourcePackage.tier} · {sourcePackage.name}
              </span>
            </p>
            <PackagePlacementFields
              assignableServices={assignableServices}
              draftServiceId={draftServiceId}
              setDraftServiceId={setDraftServiceId}
              draftTier={draftTier}
              setDraftTier={setDraftTier}
              draftBasePrice={draftBasePrice}
              setDraftBasePrice={setDraftBasePrice}
              value={placementDraft}
              onChange={setPlacementDraft}
              lockedSubCategoryId={defaultSubCategoryId}
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={handleConfirm}>
            Duplicate package
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function buildDuplicatePackagePatch(
  serviceId: string,
  placement: PackagePlacementDraft,
): Pick<EventPackage, 'serviceId' | 'displayPages' | 'schedulingCategoryIds'> {
  return {
    serviceId,
    ...buildPackagePlacementPatch(placement),
  }
}
