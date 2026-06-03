/** Admin package edit page — same layout as new package; opened from catalog or services. */

'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import {
  filterAssignableServices,
  SchedulingPackageFields,
} from '@/components/admin/scheduling-package-fields'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  buildPackagePlacementPatch,
  EMPTY_PACKAGE_PLACEMENT,
  placementDraftFromPackage,
  resolvePackageEditBackHref,
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

function AdminSchedulingPackagesEditPageInner() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const packageId = typeof params.packageId === 'string' ? params.packageId : ''
  const returnTo = searchParams.get('returnTo')
  const returnServiceId = searchParams.get('returnServiceId')
  const categoryFromQuery = searchParams.get('category')

  const { services, packages, updatePackage } = useScheduling()
  const assignableServices = useMemo(() => filterAssignableServices(services), [services])

  const pkg = useMemo(
    () => packages.find((row) => row.id === packageId) ?? null,
    [packageId, packages],
  )

  const backHref = useMemo(
    () =>
      resolvePackageEditBackHref({
        returnTo,
        returnServiceId,
        category: categoryFromQuery,
      }),
    [categoryFromQuery, returnServiceId, returnTo],
  )

  const lockedSubCategoryId = categoryFromQuery

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
  const [placementDraft, setPlacementDraft] = useState<PackagePlacementDraft>(
    EMPTY_PACKAGE_PLACEMENT,
  )
  const [hydratedFrom, setHydratedFrom] = useState<string | null>(null)

  useEffect(() => {
    if (!pkg || hydratedFrom === pkg.id) return
    setDraftServiceId(pkg.serviceId)
    setDraftTier(pkg.tier)
    setDraftName(pkg.name)
    setDraftBasePrice(String(pkg.basePrice))
    setDraftFeatures(pkg.features.join('\n'))
    setDraftIsActive(pkg.isActive)
    setDraftIsWholeVenue(Boolean(pkg.isWholeVenue))
    setDraftDepositAmount(pkg.depositAmount != null ? String(pkg.depositAmount) : '')
    setDraftDepositNonRefundable(Boolean(pkg.depositNonRefundable))
    setDraftRequiresApproval(Boolean(pkg.requiresApproval))
    setDraftMinChildSeats(pkg.minChildSeats != null ? String(pkg.minChildSeats) : '')
    setDraftMaxChildSeats(pkg.maxChildSeats != null ? String(pkg.maxChildSeats) : '')
    setDraftMinAdultSeats(pkg.minAdultSeats != null ? String(pkg.minAdultSeats) : '')
    setDraftMaxAdultSeats(pkg.maxAdultSeats != null ? String(pkg.maxAdultSeats) : '')
    setDraftAdditionalChildPrice(
      pkg.additionalChildPrice != null ? String(pkg.additionalChildPrice) : '',
    )
    setDraftAdditionalAdultPrice(
      pkg.additionalAdultPrice != null ? String(pkg.additionalAdultPrice) : '',
    )
    setDraftDuration(pkg.duration != null ? String(pkg.duration) : '')
    setDraftSetupTime(pkg.setupTime != null ? String(pkg.setupTime) : '')
    setDraftStaffCount(pkg.staffCount != null ? String(pkg.staffCount) : '')
    setDraftPartyRooms(pkg.partyRooms != null ? String(pkg.partyRooms) : '')
    setPlacementDraft(placementDraftFromPackage(pkg))
    setHydratedFrom(pkg.id)
  }, [hydratedFrom, pkg])

  function savePackage() {
    if (!pkg) return
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

    updatePackage(pkg.id, {
      serviceId: draftServiceId,
      tier: draftTier,
      name: draftName.trim(),
      basePrice,
      features,
      isActive: draftIsActive,
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
    })
    router.push(backHref)
  }

  if (!packageId) {
    return (
      <p className="text-sm text-muted-foreground">
        Missing package id.{' '}
        <Link href={backHref} className="text-primary underline">
          Back
        </Link>
      </p>
    )
  }

  if (packages.length > 0 && !pkg) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Package not found.</p>
        <Button type="button" variant="outline" asChild>
          <Link href={backHref}>Back</Link>
        </Button>
      </div>
    )
  }

  if (!pkg) {
    return <p className="text-sm text-muted-foreground">Loading package…</p>
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
          Edit package
        </h1>
        <p className="text-sm text-muted-foreground">
          Update category placement, linked service, and package details.
        </p>
      </div>

      <Card className="gap-0 border-border py-0 shadow-sm">
        <CardHeader className="gap-0.5 border-b border-border px-4 py-2.5 sm:px-6 [.border-b]:pb-2.5">
          <CardTitle className="text-sm font-semibold sm:text-base">Edit Package</CardTitle>
          <CardDescription className="text-xs leading-snug text-muted-foreground sm:text-sm">
            Edit and save this package entry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-8 pt-3 sm:px-6">
          {hydratedFrom === pkg.id ? (
            <SchedulingPackageFields
              assignableServices={assignableServices}
              placementDraft={placementDraft}
              setPlacementDraft={setPlacementDraft}
              lockedSubCategoryId={lockedSubCategoryId}
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
          ) : (
            <p className="text-sm text-muted-foreground">Loading package fields…</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" asChild>
              <Link href={backHref}>Cancel</Link>
            </Button>
            <Button type="button" onClick={savePackage}>
              Save package
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminSchedulingPackagesEditPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <AdminSchedulingPackagesEditPageInner />
    </Suspense>
  )
}
