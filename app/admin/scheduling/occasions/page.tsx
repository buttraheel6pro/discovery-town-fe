/** Admin operations occasions page with client-side CRUD management. */
'use client'

import Image from 'next/image'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useScheduling } from '@/lib/scheduling-store'
import type { SchedulingOccasion } from '@/lib/types'

interface OccasionDraft {
  readonly name: string
  readonly description: string
  readonly image: string
}

const EMPTY_DRAFT: OccasionDraft = {
  name: '',
  description: '',
  image: '',
}

function occasionToDraft(occasion: SchedulingOccasion): OccasionDraft {
  return {
    name: occasion.name,
    description: occasion.description,
    image: occasion.image,
  }
}

function createOccasionId(name: string): string {
  const normalized = name.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/^-|-$/g, '')
  const random = Math.random().toString(36).slice(2, 7)
  return `occ-${normalized || 'occasion'}-${random}`
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

export default function AdminSchedulingOccasionsPage() {
  const { occasions, addOccasion, updateOccasion, removeOccasion } = useScheduling()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SchedulingOccasion | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SchedulingOccasion | null>(null)
  const [draft, setDraft] = useState<OccasionDraft>(EMPTY_DRAFT)

  const filteredOccasions = useMemo(() => {
    const query = search.trim().toLowerCase()
    const sorted = occasions.slice().sort((a, b) => a.name.localeCompare(b.name))
    if (!query) {
      return sorted
    }
    return sorted.filter((occasion) => {
      const haystack = `${occasion.name} ${occasion.description}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [occasions, search])

  function openCreateModal(): void {
    setDraft(EMPTY_DRAFT)
    setCreateOpen(true)
  }

  function openEditModal(occasion: SchedulingOccasion): void {
    setEditTarget(occasion)
    setDraft(occasionToDraft(occasion))
  }

  function persistCreate(): void {
    const name = draft.name.trim()
    const description = draft.description.trim()
    const image = draft.image.trim() || '/placeholder.svg'
    if (!name || !description) {
      return
    }
    const created: SchedulingOccasion = {
      id: createOccasionId(name),
      name,
      description,
      image,
    }
    addOccasion(created)
    setCreateOpen(false)
  }

  function persistEdit(): void {
    if (!editTarget) {
      return
    }
    const name = draft.name.trim()
    const description = draft.description.trim()
    const image = draft.image.trim() || '/placeholder.svg'
    if (!name || !description) {
      return
    }
    updateOccasion(editTarget.id, {
      name,
      description,
      image,
    })
    setEditTarget(null)
  }

  function confirmDelete(): void {
    if (!deleteTarget) {
      return
    }
    removeOccasion(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Occasions</h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage operations occasions with a name, description, and image.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          New occasion
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operations occasions</CardTitle>
          <CardDescription>{`${filteredOccasions.length} occasions`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or description..."
              className="pl-9"
            />
          </div>

          {filteredOccasions.map((occasion) => (
            <div
              key={occasion.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-lg border border-border bg-muted/20">
                  <div className="relative h-full w-full">
                    <Image
                      src={occasion.image || '/placeholder.svg'}
                      alt={occasion.name}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{occasion.name}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{occasion.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => openEditModal(occasion)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setDeleteTarget(occasion)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {filteredOccasions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
              No occasions match the current filters.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <CrudModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New occasion"
        description="Create a new operations occasion."
        size="sm"
        variant="create"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={persistCreate}>
              Create
            </Button>
          </>
        }
      >
        <OccasionForm draft={draft} onChange={setDraft} />
      </CrudModal>

      <CrudModal
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null)
          }
        }}
        title="Edit occasion"
        description={editTarget?.name ?? ''}
        size="sm"
        variant="edit"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={persistEdit}>
              Save
            </Button>
          </>
        }
      >
        <OccasionForm draft={draft} onChange={setDraft} />
      </CrudModal>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete occasion?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the occasion from operations and keeps state synced in persisted store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface OccasionFormProps {
  readonly draft: OccasionDraft
  readonly onChange: (next: OccasionDraft) => void
}

function OccasionForm({ draft, onChange }: Readonly<OccasionFormProps>) {
  const [uploading, setUploading] = useState(false)

  async function onPickFile(file: File | null): Promise<void> {
    if (!file) {
      return
    }
    setUploading(true)
    try {
      const image = await fileToDataUrl(file)
      onChange({ ...draft, image })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="occasion-name">Name</Label>
        <Input
          id="occasion-name"
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          placeholder="Birthday Party"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="occasion-description">Description</Label>
        <Textarea
          id="occasion-description"
          rows={3}
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          placeholder="Short details about this occasion..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="occasion-image">Image URL</Label>
        <div className="flex items-center gap-2">
          <Input
            id="occasion-image"
            value={draft.image}
            onChange={(event) => onChange({ ...draft, image: event.target.value })}
            placeholder="Paste URL or upload..."
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="occasion-image-file"
            onChange={(event) => void onPickFile(event.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById('occasion-image-file')?.click()}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Image preview</Label>
        <div className="relative h-32 overflow-hidden rounded-lg border border-border bg-muted/20">
          <Image
            src={draft.image.trim() || '/placeholder.svg'}
            alt="Occasion preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 320px"
          />
        </div>
      </div>
    </div>
  )
}
