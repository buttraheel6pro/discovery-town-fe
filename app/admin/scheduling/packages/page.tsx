/** Admin packages — CRUD for tiered event packages across services. */
'use client'

import { useMemo, useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
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
import { formatPrice } from '@/lib/utils'
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

export default function AdminSchedulingPackagesPage() {
  const { services, packages, addPackage, updatePackage, removePackage, duplicatePackage } =
    useScheduling()

  const [q, setQ] = useState('')
  const [serviceId, setServiceId] = useState<string>('ALL')

  const assignableServices = useMemo(() => {
    return services.filter((service) => isCurrentCatalogService(service.id))
  }, [services])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return packages.filter((p) => {
      const isAlignedPackage =
        p.serviceId === 'unassigned' || isCurrentCatalogService(p.serviceId)
      if (!isAlignedPackage) return false
      if (serviceId !== 'ALL') {
        if (serviceId === 'unassigned' && p.serviceId !== 'unassigned') return false
        if (serviceId !== 'unassigned' && p.serviceId !== serviceId) return false
      }
      if (!query) return true
      return (
        p.name.toLowerCase().includes(query) ||
        p.tier.toLowerCase().includes(query) ||
        p.serviceId.toLowerCase().includes(query)
      )
    })
  }, [packages, q, serviceId])

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftServiceId, setDraftServiceId] = useState<string>('')
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

  function openCreate() {
    const fallbackService = assignableServices[0]?.id ?? ''
    setEditingId(null)
    setDraftServiceId(fallbackService)
    setDraftTier('SILVER')
    setDraftName('')
    setDraftBasePrice('0')
    setDraftFeatures('')
    setDraftIsActive(true)
    setDraftIsWholeVenue(false)
    setDraftDepositAmount('')
    setDraftDepositNonRefundable(false)
    setDraftMinChildSeats('')
    setDraftMaxChildSeats('')
    setDraftMinAdultSeats('')
    setDraftMaxAdultSeats('')
    setDraftAdditionalChildPrice('')
    setDraftAdditionalAdultPrice('')
    setDraftDuration('')
    setDraftSetupTime('')
    setOpen(true)
  }

  function openEdit(pkg: EventPackage) {
    setEditingId(pkg.id)
    setDraftServiceId(pkg.serviceId)
    setDraftTier(pkg.tier)
    setDraftName(pkg.name)
    setDraftBasePrice(String(pkg.basePrice))
    setDraftFeatures(pkg.features.join('\n'))
    setDraftIsActive(pkg.isActive)
    setDraftIsWholeVenue(pkg.isWholeVenue ?? false)
    setDraftDepositAmount(pkg.depositAmount != null ? String(pkg.depositAmount) : '')
    setDraftDepositNonRefundable(pkg.depositNonRefundable ?? false)
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
    setOpen(true)
  }

  function persist() {
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

    if (editingId) {
      updatePackage(editingId, {
        serviceId: draftServiceId,
        tier: draftTier,
        name: draftName.trim(),
        basePrice,
        features,
        isActive: draftIsActive,
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
      })
      setOpen(false)
      return
    }

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
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Packages</h1>
          <p className="text-muted-foreground mt-2">
            Manage tiered packages across all events and services.
          </p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={openCreate}>
          New package
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search packages..."
            className="max-w-sm"
          />
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All services</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {assignableServices.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No packages match your filters.</p>
          ) : (
            filtered.map((p) => {
              const svc =
                p.serviceId === 'unassigned'
                  ? null
                  : (assignableServices.find((s) => s.id === p.serviceId) ?? null)
              const serviceLabel =
                p.serviceId === 'unassigned' ? 'Unassigned' : (svc?.name ?? p.serviceId)
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {p.tier} · {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {serviceLabel} · {formatPrice(p.basePrice)} ·{' '}
                      {p.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => duplicatePackage(p.id)}>
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive"
                      onClick={() => removePackage(p.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <CrudModal
        open={open}
        onOpenChange={setOpen}
        title={editingId ? 'Edit package' : 'New package'}
        description="Packages override base price and highlight included features."
        size="md"
        variant={editingId ? 'edit' : 'create'}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={persist}>
              {editingId ? 'Save package' : 'Create package'}
            </Button>
          </>
        }
      >
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
      </CrudModal>
    </div>
  )
}

