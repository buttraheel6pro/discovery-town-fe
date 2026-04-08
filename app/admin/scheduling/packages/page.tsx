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

export default function AdminSchedulingPackagesPage() {
  const { services, packages, addPackage, updatePackage, removePackage, duplicatePackage } =
    useScheduling()

  const [q, setQ] = useState('')
  const [serviceId, setServiceId] = useState<string>('ALL')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return packages.filter((p) => {
      if (serviceId !== 'ALL' && p.serviceId !== serviceId) return false
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

  function openCreate() {
    const fallbackService = services[0]?.id ?? ''
    setEditingId(null)
    setDraftServiceId(fallbackService)
    setDraftTier('SILVER')
    setDraftName('')
    setDraftBasePrice('0')
    setDraftFeatures('')
    setDraftIsActive(true)
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
    setOpen(true)
  }

  function persist() {
    const basePrice = parseFloatOrNull(draftBasePrice)
    if (!draftServiceId.trim() || !draftName.trim() || basePrice == null) return

    const features = draftFeatures
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    if (editingId) {
      updatePackage(editingId, {
        serviceId: draftServiceId,
        tier: draftTier,
        name: draftName.trim(),
        basePrice,
        features,
        isActive: draftIsActive,
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
              {services.map((s) => (
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
              const svc = services.find((s) => s.id === p.serviceId) ?? null
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
                      {svc?.name ?? p.serviceId} · {formatPrice(p.basePrice)} ·{' '}
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
                {services.map((s) => (
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
          <div className="flex items-center justify-between">
            <Label htmlFor="pkg-active">Active</Label>
            <Switch id="pkg-active" checked={draftIsActive} onCheckedChange={setDraftIsActive} />
          </div>
        </div>
      </CrudModal>
    </div>
  )
}

