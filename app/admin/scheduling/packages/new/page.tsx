/** Admin package create page with same fields previously shown in modal. */
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { isCurrentCatalogService } from '@/lib/scheduling-visibility'
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

export default function AdminSchedulingPackagesNewPage() {
  const router = useRouter()
  const { services, addPackage } = useScheduling()

  const assignableServices = useMemo(() => {
    return services.filter((service) => isCurrentCatalogService(service.id))
  }, [services])

  const [draftServiceId, setDraftServiceId] = useState<string>(() => {
    return assignableServices[0]?.id ?? 'unassigned'
  })
  const [draftTier, setDraftTier] = useState<Tier>('SILVER')
  const [draftName, setDraftName] = useState('')
  const [draftBasePrice, setDraftBasePrice] = useState('0')
  const [draftFeatures, setDraftFeatures] = useState('')
  const [draftIsActive, setDraftIsActive] = useState(true)
  const [draftIsWholeVenue, setDraftIsWholeVenue] = useState(false)
  const [draftDepositAmount, setDraftDepositAmount] = useState('')
  const [draftDepositNonRefundable, setDraftDepositNonRefundable] = useState(false)
  const [draftMinChildSeats, setDraftMinChildSeats] = useState('')
  const [draftMaxChildSeats, setDraftMaxChildSeats] = useState('')
  const [draftMinAdultSeats, setDraftMinAdultSeats] = useState('')
  const [draftMaxAdultSeats, setDraftMaxAdultSeats] = useState('')
  const [draftAdditionalChildPrice, setDraftAdditionalChildPrice] = useState('')
  const [draftAdditionalAdultPrice, setDraftAdditionalAdultPrice] = useState('')
  const [draftDuration, setDraftDuration] = useState('')
  const [draftSetupTime, setDraftSetupTime] = useState('')

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
      minChildSeats: minChildSeats ?? undefined,
      maxChildSeats: maxChildSeats ?? undefined,
      minAdultSeats: minAdultSeats ?? undefined,
      maxAdultSeats: maxAdultSeats ?? undefined,
      additionalChildPrice: additionalChildPrice ?? undefined,
      additionalAdultPrice: additionalAdultPrice ?? undefined,
      duration: duration ?? undefined,
      setupTime: setupTime ?? undefined,
    }
    addPackage(created)
    router.push('/admin/scheduling/packages')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">New package</h1>
          <p className="text-muted-foreground mt-2">
            Packages override base price and highlight included features.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Package details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={draftServiceId} onValueChange={setDraftServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {assignableServices.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tier</Label>
                <Select value={draftTier} onValueChange={(v) => setDraftTier(v as Tier)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SILVER">SILVER</SelectItem>
                    <SelectItem value="GOLD">GOLD</SelectItem>
                    <SelectItem value="PLATINUM">PLATINUM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-price">Base price</Label>
                <Input
                  id="pkg-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={draftBasePrice}
                  onChange={(e) => setDraftBasePrice(e.target.value)}
                />
              </div>
            </div>
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
                  Deposit settings
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
              </fieldset>
            ) : null}
            <div className="flex items-center justify-between">
              <Label htmlFor="pkg-active">Active</Label>
              <Switch id="pkg-active" checked={draftIsActive} onCheckedChange={setDraftIsActive} />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Link href="/admin/scheduling/packages">
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
