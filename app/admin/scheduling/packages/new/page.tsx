/** Admin package create page — placement, service link, and tier details. */
'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import {
  filterAssignableServices,
  SchedulingPackageFields,
} from '@/components/admin/scheduling-package-fields'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  buildPackagePlacementPatch,
  DEFAULT_EVENT_PRIVATE_PARTY_PACKAGE_PLACEMENT,
  DEFAULT_EVENT_WHOLE_PLACE_PACKAGE_PLACEMENT,
  DEFAULT_PRIVATE_PLAY_PACKAGE_PLACEMENT,
  EMPTY_PACKAGE_PLACEMENT,
  EVENT_PRIVATE_PARTY_ROOM_SUBCATEGORY_ID,
  EVENT_WHOLE_PLACE_SUBCATEGORY_ID,
  type PackagePlacementDraft,
} from '@/lib/package-placement'
import { useScheduling } from '@/lib/scheduling-store'
import type { EventPackage } from '@/lib/types'

type Tier = EventPackage['tier']

function parseFloatOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number.parseFloat(trimmed)
  return Number.isFinite(n) ? n : null
}

function parseIntOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number.parseInt(trimmed, 10)
  return Number.isFinite(n) ? n : null
}

function AdminSchedulingPackagesNewPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledCategoryId = searchParams.get('category')
  const { services, addPackage } = useScheduling()

  const assignableServices = useMemo(() => filterAssignableServices(services), [services])

  const [draftServiceId, setDraftServiceId] = useState('unassigned')
  const [draftTier, setDraftTier] = useState<Tier>('SILVER')
  const [draftName, setDraftName] = useState('')
  const [draftBasePrice, setDraftBasePrice] = useState('0')
  const [draftFeatures, setDraftFeatures] = useState('')
  const [draftIsActive, setDraftIsActive] = useState(true)
  const [draftIsWholeVenue, setDraftIsWholeVenue] = useState(false)
  const [draftDepositAmount, setDraftDepositAmount] = useState('')
  const [draftDepositNonRefundable, setDraftDepositNonRefundable] = useState(false)
  const [draftRequiresApproval, setDraftRequiresApproval] = useState(false)
  const [draftMinChildSeats, setDraftMinChildSeats] = useState('')
  const [draftMaxChildSeats, setDraftMaxChildSeats] = useState('')
  const [draftMinAdultSeats, setDraftMinAdultSeats] = useState('')
  const [draftMaxAdultSeats, setDraftMaxAdultSeats] = useState('')
  const [draftAdditionalChildPrice, setDraftAdditionalChildPrice] = useState('')
  const [draftAdditionalAdultPrice, setDraftAdditionalAdultPrice] = useState('')
  const [draftDuration, setDraftDuration] = useState('')
  const [draftSetupTime, setDraftSetupTime] = useState('')
  const [draftStaffCount, setDraftStaffCount] = useState('')
  const [draftPartyRooms, setDraftPartyRooms] = useState('')
  const [placementDraft, setPlacementDraft] = useState<PackagePlacementDraft>(() => {
    if (prefilledCategoryId === EVENT_PRIVATE_PARTY_ROOM_SUBCATEGORY_ID) {
      return { ...DEFAULT_EVENT_PRIVATE_PARTY_PACKAGE_PLACEMENT }
    }
    if (prefilledCategoryId === EVENT_WHOLE_PLACE_SUBCATEGORY_ID) {
      return { ...DEFAULT_EVENT_WHOLE_PLACE_PACKAGE_PLACEMENT }
    }
    if (prefilledCategoryId === 'cat-private-play') {
      return { ...DEFAULT_PRIVATE_PLAY_PACKAGE_PLACEMENT }
    }
    return { ...EMPTY_PACKAGE_PLACEMENT }
  })

  const backHref =
    prefilledCategoryId != null
      ? `/admin/scheduling/packages?category=${encodeURIComponent(prefilledCategoryId)}`
      : '/admin/scheduling/packages'

  useEffect(() => {
    if (draftServiceId !== 'unassigned') {
      return
    }
    const preferred =
      prefilledCategoryId != null
        ? assignableServices.find((service) => service.categoryId === prefilledCategoryId)
        : assignableServices[0]
    if (preferred) {
      setDraftServiceId(preferred.id)
    }
  }, [assignableServices, draftServiceId, prefilledCategoryId])

  function createPackage() {
    const basePrice = parseFloatOrNull(draftBasePrice)
    if (!draftServiceId.trim() || !draftName.trim() || basePrice == null) return

    const features = draftFeatures
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    const depositAmount = parseFloatOrNull(draftDepositAmount)
    const minChildSeats = parseIntOrNull(draftMinChildSeats)
    const maxChildSeats = parseIntOrNull(draftMaxChildSeats)
    const minAdultSeats = parseIntOrNull(draftMinAdultSeats)
    const maxAdultSeats = parseIntOrNull(draftMaxAdultSeats)
    const additionalChildPrice = parseFloatOrNull(draftAdditionalChildPrice)
    const additionalAdultPrice = parseFloatOrNull(draftAdditionalAdultPrice)
    const duration = parseIntOrNull(draftDuration)
    const setupTime = parseIntOrNull(draftSetupTime)
    const staffCount = parseIntOrNull(draftStaffCount)
    const partyRooms = parseIntOrNull(draftPartyRooms)

    const created: EventPackage = {
      id: `pkg-${Math.random().toString(16).slice(2, 10)}`,
      serviceId: draftServiceId,
      tier: draftTier,
      name: draftName.trim(),
      basePrice,
      features,
      addOns: [],
      isActive: draftIsActive,
      createdAt: new Date().toISOString(),
      isWholeVenue: draftIsWholeVenue,
      depositAmount: draftIsWholeVenue ? (depositAmount ?? undefined) : undefined,
      depositNonRefundable: draftIsWholeVenue ? draftDepositNonRefundable : undefined,
      requiresApproval: draftIsWholeVenue ? draftRequiresApproval : false,
      minChildSeats: minChildSeats ?? undefined,
      maxChildSeats: maxChildSeats ?? undefined,
      minAdultSeats: minAdultSeats ?? undefined,
      maxAdultSeats: maxAdultSeats ?? undefined,
      additionalChildPrice: additionalChildPrice ?? undefined,
      additionalAdultPrice: additionalAdultPrice ?? undefined,
      duration: duration ?? undefined,
      setupTime: setupTime ?? undefined,
      staffCount: staffCount ?? undefined,
      partyRooms: partyRooms ?? undefined,
      ...buildPackagePlacementPatch(placementDraft),
    }
    addPackage(created)
    router.push(backHref)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href={backHref}>
          <Button type="button" variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          New package
        </h1>
        <p className="text-sm text-muted-foreground">
          Set category placement, linked service, and package details.
        </p>
      </div>

      <Card className="gap-0 border-border py-0 shadow-sm">
        <CardHeader className="gap-0.5 border-b border-border px-4 py-2.5 sm:px-6 [.border-b]:pb-2.5">
          <CardTitle className="text-sm font-semibold sm:text-base">Create Package</CardTitle>
          <CardDescription className="text-xs leading-snug text-muted-foreground sm:text-sm">
            Packages override base price and highlight included features for private play and
            events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-8 pt-3 sm:px-6">
          <SchedulingPackageFields
            assignableServices={assignableServices}
            placementDraft={placementDraft}
            setPlacementDraft={setPlacementDraft}
            lockedSubCategoryId={prefilledCategoryId}
            draftServiceId={draftServiceId}
            setDraftServiceId={setDraftServiceId}
            draftTier={draftTier}
            setDraftTier={setDraftTier}
            draftBasePrice={draftBasePrice}
            setDraftBasePrice={setDraftBasePrice}
            draftName={draftName}
            setDraftName={setDraftName}
            draftFeatures={draftFeatures}
            setDraftFeatures={setDraftFeatures}
            draftDuration={draftDuration}
            setDraftDuration={setDraftDuration}
            draftSetupTime={draftSetupTime}
            setDraftSetupTime={setDraftSetupTime}
            draftStaffCount={draftStaffCount}
            setDraftStaffCount={setDraftStaffCount}
            draftPartyRooms={draftPartyRooms}
            setDraftPartyRooms={setDraftPartyRooms}
            draftMinChildSeats={draftMinChildSeats}
            setDraftMinChildSeats={setDraftMinChildSeats}
            draftMaxChildSeats={draftMaxChildSeats}
            setDraftMaxChildSeats={setDraftMaxChildSeats}
            draftMinAdultSeats={draftMinAdultSeats}
            setDraftMinAdultSeats={setDraftMinAdultSeats}
            draftMaxAdultSeats={draftMaxAdultSeats}
            setDraftMaxAdultSeats={setDraftMaxAdultSeats}
            draftAdditionalChildPrice={draftAdditionalChildPrice}
            setDraftAdditionalChildPrice={setDraftAdditionalChildPrice}
            draftAdditionalAdultPrice={draftAdditionalAdultPrice}
            setDraftAdditionalAdultPrice={setDraftAdditionalAdultPrice}
            draftIsWholeVenue={draftIsWholeVenue}
            setDraftIsWholeVenue={setDraftIsWholeVenue}
            draftDepositAmount={draftDepositAmount}
            setDraftDepositAmount={setDraftDepositAmount}
            draftDepositNonRefundable={draftDepositNonRefundable}
            setDraftDepositNonRefundable={setDraftDepositNonRefundable}
            draftRequiresApproval={draftRequiresApproval}
            setDraftRequiresApproval={setDraftRequiresApproval}
            draftIsActive={draftIsActive}
            setDraftIsActive={setDraftIsActive}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Link href={backHref}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="button" onClick={createPackage}>
              Create package
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminSchedulingPackagesNewPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <AdminSchedulingPackagesNewPageInner />
    </Suspense>
  )
}
