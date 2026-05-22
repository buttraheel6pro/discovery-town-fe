/** Admin attribute groups — chips for dietary / allergens / availability labels. */
'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useCafe } from '@/lib/cafe-store'
import { useInventory } from '@/lib/inventory-store'
import { newAdminEntityId } from '@/lib/scheduling-admin-builders'
import { attributeGroupSchema } from '@/lib/schemas/cafe'
import type { AttributeGroup, AttributeOption } from '@/lib/types'

function isColorGroupName(name: string): boolean {
  return name.trim().toLowerCase().includes('color')
}

function emptyGroup(): AttributeGroup {
  return {
    id: newAdminEntityId('ag'),
    name: '',
    selectionType: 'multiple',
    isRequired: true,
    maxSelect: 1,
    options: [
      {
        id: newAdminEntityId('ao'),
        label: '',
        emoji: '',
        color: '#607d8b',
      },
    ],
  }
}

export default function AdminCafeAttributesPage() {
  const { toast } = useToast()
  const { cafeProducts, attributeGroups, upsertAttributeGroup, deleteAttributeGroup } = useCafe()
  const { products } = useInventory()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<AttributeGroup>(() => emptyGroup())

  const sorted = [...attributeGroups].sort((a, b) => a.name.localeCompare(b.name))

  function countProductsUsingAttributeGroup(groupId: string): number {
    const cafeCount = cafeProducts.filter((product) =>
      Object.hasOwn(product.attributeGroups, groupId),
    ).length
    const shopCount = products.filter((product) =>
      (product.shopAttributeGroups ?? []).some((group) => group.id === groupId),
    ).length
    return cafeCount + shopCount
  }

  function startCreate() {
    setDraft(emptyGroup())
    setOpen(true)
  }

  function startEdit(g: AttributeGroup) {
    setDraft({
      ...g,
      options: g.options.map((o) => ({ ...o })),
    })
    setOpen(true)
  }

  function saveDraft() {
    try {
      const parsed = attributeGroupSchema.parse(draft)
      upsertAttributeGroup(parsed)
      toast({ title: 'Attribute group saved' })
      setOpen(false)
    } catch {
      toast({ title: 'Invalid form', description: 'Check fields and options.', variant: 'destructive' })
    }
  }

  function removeGroup(id: string) {
    const n = countProductsUsingAttributeGroup(id)
    if (n > 0) {
      toast({
        title: 'Cannot delete',
        description: `${n} product(s) reference this group.`,
        variant: 'destructive',
      })
      return
    }
    deleteAttributeGroup(id)
    toast({ title: 'Attribute group removed' })
  }

  function addOption() {
    setDraft((d) => ({
      ...d,
      options: [
        ...d.options,
        {
          id: newAdminEntityId('ao'),
          label: '',
          emoji: '',
          color: '#607d8b',
        },
      ],
    }))
  }

  function updateOption(index: number, patch: Partial<AttributeOption>) {
    setDraft((d) => {
      const opts = [...d.options]
      const cur = opts[index]
      if (!cur) return d
      opts[index] = { ...cur, ...patch }
      return { ...d, options: opts }
    })
  }

  function removeOption(index: number) {
    setDraft((d) => ({
      ...d,
      options: d.options.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-barlow)' }}>
            Attribute groups
          </h1>
          <p className="text-sm text-muted-foreground">Badge chips on cards — optional price impact none.</p>
        </div>
        <Button type="button" onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New group
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Selection</TableHead>
              <TableHead>Required</TableHead>
              <TableHead className="text-right">Options</TableHead>
              <TableHead className="text-right">Used by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell>{g.selectionType === 'single' ? 'Single' : 'Multiple'}</TableCell>
                <TableCell>{g.isRequired ? 'Yes' : 'No'}</TableCell>
                <TableCell className="text-right">{g.options.length}</TableCell>
                <TableCell className="text-right">{countProductsUsingAttributeGroup(g.id)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => startEdit(g)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGroup(g.id)}
                    aria-label="Delete group"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attribute group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ag-name">Group name</Label>
              <Input
                id="ag-name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Selection type</Label>
              <Select
                value={draft.selectionType}
                onValueChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    selectionType: v as AttributeGroup['selectionType'],
                    maxSelect:
                      v === 'multiple' ? Math.max(1, d.maxSelect ?? 1) : undefined,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single selection</SelectItem>
                  <SelectItem value="multiple">Multiple selection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">Required on product form</span>
              <Switch
                checked={draft.isRequired}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, isRequired: v }))}
              />
            </div>
            {draft.selectionType === 'multiple' ? (
              <div className="space-y-2">
                <Label htmlFor="ag-max-select">Max selections</Label>
                <Input
                  id="ag-max-select"
                  type="number"
                  min={1}
                  step={1}
                  value={draft.maxSelect ?? 1}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      maxSelect: Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                    }))
                  }
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  Add option
                </Button>
              </div>
              <div className="space-y-3">
                {draft.options.map((o, idx) => (
                  <div key={o.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={o.label}
                        onChange={(e) => updateOption(idx, { label: e.target.value })}
                        placeholder="Label"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {isColorGroupName(draft.name) ? (
                      <div className="grid grid-cols-1 gap-2">
                        <Input
                          type="color"
                          value={o.color.startsWith('#') ? o.color : '#607d8b'}
                          onChange={(e) => updateOption(idx, { color: e.target.value })}
                          className="h-10 p-1"
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveDraft}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
