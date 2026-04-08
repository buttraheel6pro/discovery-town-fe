/** Admin client tags — create, edit, and delete contact tags. */
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useClients } from '@/lib/client-store'
import type { ContactTag } from '@/lib/types'

export default function AdminClientTagsPage() {
  const { tags, addTag, updateTag, deleteTag } = useClients()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [newDesc, setNewDesc] = useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    const tag: ContactTag = {
      id: `tag-${Date.now()}`,
      tenantId: 'tenant-1',
      name: newName.trim(),
      color: newColor,
      isSystem: false,
      description: newDesc.trim() || undefined,
    }
    addTag(tag)
    setNewName('')
    setNewDesc('')
    setNewColor('#6366f1')
    setCreating(false)
  }

  function confirmDelete() {
    if (deleteId) {
      deleteTag(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/clients"
            className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            All clients
          </Link>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Tags
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Colour-coded labels for segments and automation.
          </p>
        </div>
        <Button type="button" size="sm" className="gap-2" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          New tag
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => (
          <Card key={tag.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div
                className="h-10 w-10 shrink-0 rounded-lg border border-border"
                style={{ backgroundColor: tag.color }}
                aria-hidden
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive"
                onClick={() => setDeleteId(tag.id)}
                aria-label={`Delete ${tag.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor={`name-${tag.id}`}>Name</Label>
                <Input
                  id={`name-${tag.id}`}
                  defaultValue={tag.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (v && v !== tag.name) updateTag(tag.id, { name: v })
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`color-${tag.id}`}>Colour</Label>
                <Input
                  id={`color-${tag.id}`}
                  type="color"
                  className="h-10 w-full cursor-pointer"
                  defaultValue={tag.color}
                  onBlur={(e) => {
                    if (e.target.value !== tag.color) {
                      updateTag(tag.id, { color: e.target.value })
                    }
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`desc-${tag.id}`}>Description</Label>
                <Textarea
                  id={`desc-${tag.id}`}
                  rows={2}
                  defaultValue={tag.description ?? ''}
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    const next = v || undefined
                    if (next !== tag.description) {
                      updateTag(tag.id, { description: next })
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <Label htmlFor={`sys-${tag.id}`} className="text-xs">
                  System tag
                </Label>
                <Switch
                  id={`sys-${tag.id}`}
                  checked={tag.isSystem}
                  onCheckedChange={(c) => updateTag(tag.id, { isSystem: c })}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CrudModal
        open={creating}
        onOpenChange={setCreating}
        title="New tag"
        description="Create a colour-coded label for contacts."
        size="sm"
        variant="create"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" form="admin-tag-create-form">
              Create
            </Button>
          </>
        }
      >
        <form id="admin-tag-create-form" onSubmit={handleCreate} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="nt-name">Name</Label>
            <Input
              id="nt-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nt-color">Colour</Label>
            <Input
              id="nt-color"
              type="color"
              className="h-10 w-full cursor-pointer"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nt-desc">Description</Label>
            <Textarea
              id="nt-desc"
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>
        </form>
      </CrudModal>

      <CrudModal
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null)
        }}
        title="Delete tag?"
        description="This removes the tag from the directory. Assignments on contacts will be cleared."
        size="sm"
        variant="delete"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  )
}

