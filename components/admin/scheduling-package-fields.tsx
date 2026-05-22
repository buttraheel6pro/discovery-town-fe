/** Shared admin fields for creating or editing a scheduling event package. */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PackagePlacementFields } from '@/components/admin/package-placement-fields'
import { isCurrentCatalogService } from '@/lib/scheduling-visibility'
import type { PackagePlacementDraft } from '@/lib/package-placement'
import type { EventPackage, SchedulingService } from '@/lib/types'

type Tier = EventPackage['tier']

export interface SchedulingPackageFieldsProps {
  readonly assignableServices: readonly SchedulingService[]
  readonly placementDraft: PackagePlacementDraft
  readonly setPlacementDraft: (next: PackagePlacementDraft) => void
  readonly lockedSubCategoryId?: string | null
  readonly draftServiceId: string
  readonly setDraftServiceId: (value: string) => void
  readonly draftTier: Tier
  readonly setDraftTier: (value: Tier) => void
  readonly draftBasePrice: string
  readonly setDraftBasePrice: (value: string) => void
  readonly draftName: string
  readonly setDraftName: (value: string) => void
  readonly draftFeatures: string
  readonly setDraftFeatures: (value: string) => void
  readonly draftDuration: string
  readonly setDraftDuration: (value: string) => void
  readonly draftSetupTime: string
  readonly setDraftSetupTime: (value: string) => void
  readonly draftStaffCount: string
  readonly setDraftStaffCount: (value: string) => void
  readonly draftPartyRooms: string
  readonly setDraftPartyRooms: (value: string) => void
  readonly draftMinChildSeats: string
  readonly setDraftMinChildSeats: (value: string) => void
  readonly draftMaxChildSeats: string
  readonly setDraftMaxChildSeats: (value: string) => void
  readonly draftMinAdultSeats: string
  readonly setDraftMinAdultSeats: (value: string) => void
  readonly draftMaxAdultSeats: string
  readonly setDraftMaxAdultSeats: (value: string) => void
  readonly draftAdditionalChildPrice: string
  readonly setDraftAdditionalChildPrice: (value: string) => void
  readonly draftAdditionalAdultPrice: string
  readonly setDraftAdditionalAdultPrice: (value: string) => void
  readonly draftIsWholeVenue: boolean
  readonly setDraftIsWholeVenue: (value: boolean) => void
  readonly draftDepositAmount: string
  readonly setDraftDepositAmount: (value: string) => void
  readonly draftDepositNonRefundable: boolean
  readonly setDraftDepositNonRefundable: (value: boolean) => void
  readonly draftRequiresApproval: boolean
  readonly setDraftRequiresApproval: (value: boolean) => void
  readonly draftIsActive: boolean
  readonly setDraftIsActive: (value: boolean) => void
}

export function filterAssignableServices(
  services: readonly SchedulingService[],
): SchedulingService[] {
  return services.filter((service) => isCurrentCatalogService(service.id))
}

export function SchedulingPackageFields({
  assignableServices,
  placementDraft,
  setPlacementDraft,
  lockedSubCategoryId = null,
  draftServiceId,
  setDraftServiceId,
  draftTier,
  setDraftTier,
  draftBasePrice,
  setDraftBasePrice,
  draftName,
  setDraftName,
  draftFeatures,
  setDraftFeatures,
  draftDuration,
  setDraftDuration,
  draftSetupTime,
  setDraftSetupTime,
  draftStaffCount,
  setDraftStaffCount,
  draftPartyRooms,
  setDraftPartyRooms,
  draftMinChildSeats,
  setDraftMinChildSeats,
  draftMaxChildSeats,
  setDraftMaxChildSeats,
  draftMinAdultSeats,
  setDraftMinAdultSeats,
  draftMaxAdultSeats,
  setDraftMaxAdultSeats,
  draftAdditionalChildPrice,
  setDraftAdditionalChildPrice,
  draftAdditionalAdultPrice,
  setDraftAdditionalAdultPrice,
  draftIsWholeVenue,
  setDraftIsWholeVenue,
  draftDepositAmount,
  setDraftDepositAmount,
  draftDepositNonRefundable,
  setDraftDepositNonRefundable,
  draftRequiresApproval,
  setDraftRequiresApproval,
  draftIsActive,
  setDraftIsActive,
}: SchedulingPackageFieldsProps) {
  return (
    <div className="space-y-5">
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
        lockedSubCategoryId={lockedSubCategoryId}
      />

      <div className="space-y-2">
        <Label htmlFor="pkg-name">Name</Label>
        <Input
          id="pkg-name"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Gold Party Package"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pkg-features">Features (one per line)</Label>
        <Textarea
          id="pkg-features"
          value={draftFeatures}
          onChange={(e) => setDraftFeatures(e.target.value)}
          rows={6}
          placeholder={'Private space\nDecorations\nDedicated host'}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pkg-duration">Duration (minutes)</Label>
          <Input
            id="pkg-duration"
            type="number"
            min={0}
            step={1}
            value={draftDuration}
            onChange={(e) => setDraftDuration(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pkg-setup">Setup time (minutes)</Label>
          <Input
            id="pkg-setup"
            type="number"
            min={0}
            step={1}
            value={draftSetupTime}
            onChange={(e) => setDraftSetupTime(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="pkg-staff">Staff count</Label>
          <Input
            id="pkg-staff"
            type="number"
            min={0}
            step={1}
            value={draftStaffCount}
            onChange={(e) => setDraftStaffCount(e.target.value)}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="pkg-rooms">Party rooms</Label>
          <Input
            id="pkg-rooms"
            type="number"
            min={0}
            step={1}
            value={draftPartyRooms}
            onChange={(e) => setDraftPartyRooms(e.target.value)}
          />
        </div>
      </div>
      <fieldset className="space-y-3 rounded-lg border border-border p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Guest capacity
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pkg-min-child">Min child seats</Label>
            <Input
              id="pkg-min-child"
              type="number"
              min={0}
              step={1}
              value={draftMinChildSeats}
              onChange={(e) => setDraftMinChildSeats(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pkg-max-child">Max child seats</Label>
            <Input
              id="pkg-max-child"
              type="number"
              min={0}
              step={1}
              value={draftMaxChildSeats}
              onChange={(e) => setDraftMaxChildSeats(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pkg-min-adult">Min adult seats</Label>
            <Input
              id="pkg-min-adult"
              type="number"
              min={0}
              step={1}
              value={draftMinAdultSeats}
              onChange={(e) => setDraftMinAdultSeats(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pkg-max-adult">Max adult seats</Label>
            <Input
              id="pkg-max-adult"
              type="number"
              min={0}
              step={1}
              value={draftMaxAdultSeats}
              onChange={(e) => setDraftMaxAdultSeats(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pkg-extra-child">Additional child price</Label>
            <Input
              id="pkg-extra-child"
              type="number"
              min={0}
              step={0.01}
              value={draftAdditionalChildPrice}
              onChange={(e) => setDraftAdditionalChildPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pkg-extra-adult">Additional adult price</Label>
            <Input
              id="pkg-extra-adult"
              type="number"
              min={0}
              step={0.01}
              value={draftAdditionalAdultPrice}
              onChange={(e) => setDraftAdditionalAdultPrice(e.target.value)}
            />
          </div>
        </div>
      </fieldset>
      <div className="flex items-center justify-between">
        <Label htmlFor="pkg-whole-venue">Whole venue package</Label>
        <Switch
          id="pkg-whole-venue"
          checked={draftIsWholeVenue}
          onCheckedChange={setDraftIsWholeVenue}
        />
      </div>
      {draftIsWholeVenue ? (
        <fieldset className="space-y-3 rounded-lg border border-border p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Venue &amp; deposit
          </legend>
          <div className="space-y-2">
            <Label htmlFor="pkg-deposit">Deposit amount</Label>
            <Input
              id="pkg-deposit"
              type="number"
              min={0}
              step={0.01}
              value={draftDepositAmount}
              onChange={(e) => setDraftDepositAmount(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pkg-deposit-non-refundable">Non-refundable deposit</Label>
            <Switch
              id="pkg-deposit-non-refundable"
              checked={draftDepositNonRefundable}
              onCheckedChange={setDraftDepositNonRefundable}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pkg-requires-approval">Manager must approve before confirming</Label>
            <Switch
              id="pkg-requires-approval"
              checked={draftRequiresApproval}
              onCheckedChange={setDraftRequiresApproval}
            />
          </div>
        </fieldset>
      ) : null}
      <div className="flex items-center justify-between">
        <Label htmlFor="pkg-active">Active</Label>
        <Switch id="pkg-active" checked={draftIsActive} onCheckedChange={setDraftIsActive} />
      </div>
    </div>
  )
}
