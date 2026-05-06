/** Admin modifier groups — list, create, edit, delete (guarded). */
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
import { newAdminEntityId } from '@/lib/scheduling-admin-builders'
import { countProductsUsingModifierGroup } from '@/lib/services/modifier-groups'
import { modifierGroupSchema } from '@/lib/schemas/cafe'
import type { CafeModifier, ModifierGroup } from '@/lib/types'

function emptyGroup(): ModifierGroup {
  return {
    id: newAdminEntityId('mg'),
    name: '',
    isRequired: false,
    maxSelect: 1,
    modifiers: [
      {
        id: newAdminEntityId('m'),
        name: 'Option',
        priceDelta: 0,
        isDefault: true,
      },
    ],
  }
}

export default function AdminCafeModifiersPage() {
  const { toast } = useToast()
  const { modifierGroups, upsertModifierGroup, deleteModifierGroup } = useCafe()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ModifierGroup>(() => emptyGroup())

  const sorted = [...modifierGroups].sort((a, b) => a.name.localeCompare(b.name))

  function startCreate() {
    setDraft(emptyGroup())
    setOpen(true)
  }

  function startEdit(g: ModifierGroup) {
    setDraft({ ...g, modifiers: g.modifiers.map((m) => ({ ...m })) })
    setOpen(true)
  }

  function saveDraft() {
    try {
      const parsed = modifierGroupSchema.parse(draft)
      upsertModifierGroup(parsed)
      toast({ title: 'Modifier group saved' })
      setOpen(false)
    } catch {
      toast({ title: 'Invalid form', description: 'Check name and options.', variant: 'destructive' })
    }
  }

  function removeGroup(id: string) {
    const n = countProductsUsingModifierGroup(id)
    if (n > 0) {
      toast({
        title: 'Cannot delete',
        description: `${n} product(s) still use this group.`,
        variant: 'destructive',
      })
      return
    }
    deleteModifierGroup(id)
    toast({ title: 'Modifier group removed' })
  }

  function addOption() {
    setDraft((d) => ({
      ...d,
      modifiers: [
        ...d.modifiers,
        {
          id: newAdminEntityId('m'),
          name: 'New option',
          priceDelta: 0,
          isDefault: false,
        },
      ],
    }))
  }

  function updateOption(index: number, patch: Partial<CafeModifier>) {
    setDraft((d) => {
      const mods = [...d.modifiers]
      const cur = mods[index]
      if (!cur) return d
      mods[index] = { ...cur, ...patch }
      return { ...d, modifiers: mods }
    })
  }

  function removeOption(index: number) {
    setDraft((d) => ({
      ...d,
      modifiers: d.modifiers.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-barlow)' }}>
            Modifier groups
          </h1>
          <p className="text-sm text-muted-foreground">Size, milk, syrups — attached to cafe products.</p>
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
              <TableHead>Required</TableHead>
              <TableHead>Max select</TableHead>
              <TableHead className="text-right">Options</TableHead>
              <TableHead className="text-right">Used by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell>{g.isRequired ? 'Yes' : 'No'}</TableCell>
                <TableCell>{g.maxSelect}</TableCell>
                <TableCell className="text-right">{g.modifiers.length}</TableCell>
                <TableCell className="text-right">{countProductsUsingModifierGroup(g.id)}</TableCell>
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
            <DialogTitle>Modifier group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="mg-name">Group name</Label>
              <Input
                id="mg-name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">Required</span>
              <Switch
                checked={draft.isRequired}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, isRequired: v }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mg-max">Max selections</Label>
              <Input
                id="mg-max"
                type="number"
                min={1}
                step={1}
                value={draft.maxSelect}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, maxSelect: Math.max(1, Number.parseInt(e.target.value, 10) || 1) }))
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  Add option
                </Button>
              </div>
              <div className="space-y-3">
                {draft.modifiers.map((m, idx) => (
                  <div key={m.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={m.name}
                        onChange={(e) => updateOption(idx, { name: e.target.value })}
                        placeholder="Name"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Price delta</Label>
                        <Input
                          type="number"
                          step={0.01}
                          value={m.priceDelta}
                          onChange={(e) =>
                            updateOption(idx, { priceDelta: Number.parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="flex items-end justify-between gap-2 pb-1">
                        <span className="text-xs text-muted-foreground">Default</span>
                        <Switch
                          checked={m.isDefault}
                          onCheckedChange={(v) => updateOption(idx, { isDefault: v })}
                        />
                      </div>
                    </div>
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
