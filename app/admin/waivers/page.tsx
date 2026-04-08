/** Admin waivers page — CRUD for waiver documents (ClientDocument). */
'use client'

import { useMemo, useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useClients } from '@/lib/client-store'
import type { ClientDocument, DocumentType } from '@/lib/types'

type DocDraft = {
  title: string
  description: string
  documentType: DocumentType
  isRequired: boolean
  version: string
  validFrom: string
  validTo: string
}

function createDocumentId(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
  return `doc-${slug || 'waiver'}-${Math.random().toString(16).slice(2, 8)}`
}

export default function AdminWaiversPage() {
  const { toast } = useToast()
  const { documents, addDocument, updateDocument, removeDocument } = useClients()

  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [draft, setDraft] = useState<DocDraft>({
    title: '',
    description: '',
    documentType: 'WAIVER',
    isRequired: true,
    version: '1',
    validFrom: '',
    validTo: '',
  })

  const waiverDocs = useMemo(() => {
    const query = q.trim().toLowerCase()
    return documents
      .filter((d) => d.documentType === 'WAIVER')
      .filter((d) => {
        if (!query) return true
        return (
          d.title.toLowerCase().includes(query) ||
          (d.description ?? '').toLowerCase().includes(query) ||
          d.id.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [documents, q])

  const editing = useMemo(() => {
    if (!editingId) return null
    return documents.find((d) => d.id === editingId) ?? null
  }, [documents, editingId])

  function openNew() {
    setEditingId(null)
    setDraft({
      title: '',
      description: '',
      documentType: 'WAIVER',
      isRequired: true,
      version: '1',
      validFrom: '',
      validTo: '',
    })
    setOpen(true)
  }

  function openEdit(doc: ClientDocument) {
    setEditingId(doc.id)
    setDraft({
      title: doc.title,
      description: doc.description ?? '',
      documentType: doc.documentType,
      isRequired: doc.isRequired,
      version: String(doc.version),
      validFrom: doc.validFrom ?? '',
      validTo: doc.validTo ?? '',
    })
    setOpen(true)
  }

  function persist() {
    const title = draft.title.trim()
    if (!title) {
      toast({ title: 'Title is required', variant: 'destructive' })
      return
    }

    const version = Number.parseInt(draft.version, 10)
    if (!Number.isFinite(version) || version <= 0) {
      toast({ title: 'Version must be a positive number', variant: 'destructive' })
      return
    }

    if (draft.documentType !== 'WAIVER') {
      toast({ title: 'This page only manages Waiver documents', variant: 'destructive' })
      return
    }

    const nowIso = new Date().toISOString()
    const payload = {
      title,
      description: draft.description.trim() || undefined,
      documentType: 'WAIVER' as const,
      isRequired: draft.isRequired,
      version,
      validFrom: draft.validFrom.trim() || undefined,
      validTo: draft.validTo.trim() || undefined,
    }

    if (editingId) {
      updateDocument(editingId, payload)
      toast({ title: 'Waiver updated' })
      setOpen(false)
      return
    }

    const doc: ClientDocument = {
      id: createDocumentId(title),
      tenantId: 'tenant-1',
      title: payload.title,
      description: payload.description,
      documentType: payload.documentType,
      isRequired: payload.isRequired,
      validFrom: payload.validFrom,
      validTo: payload.validTo,
      version: payload.version,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    addDocument(doc)
    toast({ title: 'Waiver created' })
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Waivers
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage waiver documents customers must sign.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openNew}>
            New waiver
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Waiver documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, description, or id…"
              />
            </div>
          </div>

          {waiverDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No waivers found.</p>
          ) : (
            <div className="space-y-3">
              {waiverDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      id: {doc.id} • v{doc.version}
                      {doc.validFrom ? ` • from ${doc.validFrom}` : ''}
                      {doc.validTo ? ` • to ${doc.validTo}` : ''}
                    </p>
                    {doc.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">{doc.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(doc)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        removeDocument(doc.id)
                        toast({ title: 'Waiver deleted' })
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CrudModal
        open={open}
        onOpenChange={(v) => setOpen(v)}
        title={editing ? 'Edit waiver' : 'New waiver'}
        description="Waivers can be selected per Event in the Event Catalog."
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={persist}>{editing ? 'Save changes' : 'Create waiver'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="General Activity Waiver"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea
              id="desc"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={4}
              placeholder="Short summary shown to customers before signing…"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                type="number"
                min={1}
                value={draft.version}
                onChange={(e) => setDraft((d) => ({ ...d, version: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Document type</Label>
              <Input id="type" value="WAIVER" disabled />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from">Valid from (optional)</Label>
              <Input
                id="from"
                value={draft.validFrom}
                onChange={(e) => setDraft((d) => ({ ...d, validFrom: e.target.value }))}
                placeholder="2026-01-01T00:00:00Z"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">Valid to (optional)</Label>
              <Input
                id="to"
                value={draft.validTo}
                onChange={(e) => setDraft((d) => ({ ...d, validTo: e.target.value }))}
                placeholder="2026-12-31T23:59:59Z"
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="req">Required by default</Label>
              <p className="text-xs text-muted-foreground">
                This is global “required” metadata; Events can still choose which waivers apply.
              </p>
            </div>
            <Switch
              id="req"
              checked={draft.isRequired}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, isRequired: v }))}
            />
          </div>
        </div>
      </CrudModal>
    </div>
  )
}

