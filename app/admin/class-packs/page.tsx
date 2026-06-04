/** Admin class pack definitions — catalog and create sheet. */
'use client'

import { useState } from 'react'

import { CapacityRing } from '@/components/admin/capacity-ring'
import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { useClients } from '@/lib/client-store'
import type { CmCreditPackDefinition, ServiceType } from '@/lib/types'

const serviceTypes: ServiceType[] = [
  'CLASS',
  'COURT',
  'PLAY_AREA',
  'SWIMMING',
  'PARTY',
  'WORKSHOP',
  'CAMP',
  'COACHING',
]

export default function AdminClassPacksPage() {
  const { packDefinitions, addPackDefinition, updatePackDefinition } = useClients()

  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creditCount, setCreditCount] = useState('')
  const [price, setPrice] = useState('')
  const [validityDays, setValidityDays] = useState('')
  const [svcType, setSvcType] = useState<ServiceType>('CLASS')
  const [featured, setFeatured] = useState(false)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const cc = Number.parseInt(creditCount, 10)
    const pr = Number.parseFloat(price)
    const vd = Number.parseInt(validityDays, 10)
    if (!name.trim() || !Number.isFinite(cc) || !Number.isFinite(pr) || !Number.isFinite(vd)) {
      return
    }
    const def: CmCreditPackDefinition = {
      id: `cpack-${Date.now()}`,
      tenantId: 'tenant-1',
      name: name.trim(),
      description: description.trim() || undefined,
      creditCount: cc,
      price: pr,
      validityDays: vd,
      applicableServiceTypes: [svcType],
      isActive: true,
      isFeatured: featured,
      displayOrder: packDefinitions.length + 1,
    }
    addPackDefinition(def)
    setName('')
    setDescription('')
    setCreditCount('')
    setPrice('')
    setValidityDays('')
    setFeatured(false)
    setSvcType('CLASS')
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Class packs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pre-paid credit bundles for classes and programmes.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
          New pack
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {packDefinitions.map((def) => (
          <Card key={def.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle
                  className="text-base font-semibold"
                  style={{ fontFamily: 'var(--font-barlow)' }}
                >
                  {def.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  ${def.price} · {def.creditCount} credits · {def.validityDays} days
                </p>
              </div>
              <CapacityRing
                booked={0}
                capacity={Math.max(1, def.creditCount)}
                size="sm"
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {def.description ? (
                <p className="text-sm text-muted-foreground">{def.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-1">
                {def.applicableServiceTypes.map((st) => (
                  <Badge key={st} variant="secondary" className="text-[10px]">
                    {st}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`act-${def.id}`}
                    checked={def.isActive}
                    onCheckedChange={(c) => updatePackDefinition(def.id, { isActive: c })}
                  />
                  <Label htmlFor={`act-${def.id}`} className="text-xs">
                    Active
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`feat-${def.id}`}
                    checked={def.isFeatured}
                    onCheckedChange={(c) =>
                      updatePackDefinition(def.id, { isFeatured: c })
                    }
                  />
                  <Label htmlFor={`feat-${def.id}`} className="text-xs">
                    Featured
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CrudModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="New class pack"
        description="Pre-paid credit bundle for classes and programmes."
        size="md"
        variant="create"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="admin-class-pack-form">
              Save pack
            </Button>
          </>
        }
      >
        <form id="admin-class-pack-form" onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="c-name">Name</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea
              id="c-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-credits">Credits</Label>
              <Input
                id="c-credits"
                type="number"
                min={1}
                value={creditCount}
                onChange={(e) => setCreditCount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-price">Price ($)</Label>
              <Input
                id="c-price"
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-days">Validity (days)</Label>
            <Input
              id="c-days"
              type="number"
              min={1}
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Primary service type</Label>
            <Select value={svcType} onValueChange={(v) => setSvcType(v as ServiceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="c-feat" checked={featured} onCheckedChange={setFeatured} />
            <Label htmlFor="c-feat">Featured</Label>
          </div>
        </form>
      </CrudModal>
    </div>
  )
}
