/** Admin locations — CRUD for `Location` records used across scheduling + calendar. */
'use client'

import { useMemo, useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { LocationForm, type LocationDraft } from '@/components/admin/location-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCalendar } from '@/lib/calendar-store'
import { useLocations } from '@/lib/location-store'
import { newAdminEntityId } from '@/lib/scheduling-admin-builders'
import { useScheduling } from '@/lib/scheduling-store'
import { cn } from '@/lib/utils'
import type { Location, OperatingHours } from '@/lib/types'

function defaultOperatingHours(): OperatingHours[] {
  return [
    { dayOfWeek: 0, openTime: '09:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 1, openTime: '09:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 2, openTime: '09:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 3, openTime: '09:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 4, openTime: '09:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 5, openTime: '09:00', closeTime: '21:00', isClosed: false },
    { dayOfWeek: 6, openTime: '09:00', closeTime: '18:00', isClosed: false },
  ]
}

function locationToDraft(loc: Location): LocationDraft {
  return {
    name: loc.name ?? '',
    address: loc.address ?? '',
    city: loc.city ?? '',
    postcode: loc.postcode ?? '',
    timezone: loc.timezone ?? 'Europe/London',
    isActive: loc.isActive ?? true,
    phone: loc.phone ?? '',
    email: loc.email ?? '',
    imageUrl: loc.imageUrl ?? '',
    operatingHours: (loc.settings?.operatingHours ?? defaultOperatingHours()).slice(),
  }
}

function draftToPatch(draft: LocationDraft): Partial<Location> {
  return {
    name: draft.name.trim(),
    address: draft.address.trim(),
    city: draft.city.trim(),
    postcode: draft.postcode.trim(),
    timezone: draft.timezone.trim(),
    isActive: draft.isActive,
    phone: draft.phone.trim() || undefined,
    email: draft.email.trim() || undefined,
    imageUrl: draft.imageUrl.trim() || undefined,
    settings: {
      operatingHours:
        draft.operatingHours.length > 0 ? draft.operatingHours.slice() : defaultOperatingHours(),
    },
  }
}

export default function AdminSchedulingLocationsPage() {
  const { locations, addLocation, updateLocation, deleteLocation } = useLocations()
  const { services, slots } = useScheduling()
  const { inquiries } = useCalendar()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<Location | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [draft, setDraft] = useState<LocationDraft>({
    name: '',
    address: '',
    city: '',
    postcode: '',
    timezone: 'Europe/London',
    isActive: true,
    phone: '',
    email: '',
    imageUrl: '',
    operatingHours: defaultOperatingHours(),
  })

  const tenantId = locations[0]?.tenantId ?? 'tenant-1'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return locations
    return locations.filter((l) => {
      const stack = `${l.name} ${l.city} ${l.postcode} ${l.address}`.toLowerCase()
      return stack.includes(q)
    })
  }, [locations, search])

  const usageByLocationId = useMemo(() => {
    const map = new Map<string, number>()
    for (const svc of services) {
      if (!svc.locationId) continue
      map.set(svc.locationId, (map.get(svc.locationId) ?? 0) + 1)
    }
    for (const sl of slots) {
      map.set(sl.locationId, (map.get(sl.locationId) ?? 0) + 1)
    }
    for (const inq of inquiries) {
      map.set(inq.locationId, (map.get(inq.locationId) ?? 0) + 1)
    }
    return map
  }, [services, slots, inquiries])

  function openCreate() {
    setDraft({
      name: '',
      address: '',
      city: '',
      postcode: '',
      timezone: 'Europe/London',
      isActive: true,
      phone: '',
      email: '',
      imageUrl: '',
      operatingHours: defaultOperatingHours(),
    })
    setCreateOpen(true)
  }

  function openEdit(loc: Location) {
    setSelected(loc)
    setDraft(locationToDraft(loc))
  }

  function persistCreate() {
    const patch = draftToPatch(draft)
    if (!patch.name || !patch.address || !patch.city || !patch.postcode || !patch.timezone) return

    const now = new Date().toISOString()
    const created: Location = {
      id: newAdminEntityId('loc'),
      tenantId,
      name: patch.name,
      address: patch.address,
      city: patch.city,
      postcode: patch.postcode,
      timezone: patch.timezone,
      isActive: patch.isActive ?? true,
      phone: patch.phone,
      email: patch.email,
      settings: patch.settings ?? { operatingHours: defaultOperatingHours() },
      imageUrl: patch.imageUrl,
      createdAt: now,
      updatedAt: now,
    }
    addLocation(created)
    setCreateOpen(false)
  }

  function persistEdit() {
    if (!selected) return
    const patch = draftToPatch(draft)
    if (!patch.name || !patch.address || !patch.city || !patch.postcode || !patch.timezone) return
    updateLocation(selected.id, patch)
    setSelected(null)
  }

  const deleteTarget = selected
  const deleteBlockedCount = deleteTarget ? (usageByLocationId.get(deleteTarget.id) ?? 0) : 0

  function requestDelete(loc: Location) {
    setSelected(loc)
    setDeleteOpen(true)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    if ((usageByLocationId.get(deleteTarget.id) ?? 0) > 0) return
    deleteLocation(deleteTarget.id)
    setDeleteOpen(false)
    setSelected(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Locations</h1>
          <p className="mt-2 text-muted-foreground">
            Manage sites used across scheduling, calendar filters, and private hire.
          </p>
        </div>
        <Button
          type="button"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={openCreate}
        >
          New location
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md w-full">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search locations…"
                aria-label="Search locations"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'location' : 'locations'}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">In use</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => {
                const used = usageByLocationId.get(l.id) ?? 0
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium text-foreground whitespace-normal">
                      <div className="flex flex-col gap-1">
                        <span>{l.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {l.address} · {l.postcode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{l.city}</TableCell>
                    <TableCell>{l.timezone}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                          l.isActive === false
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-accent/15 text-accent',
                        )}
                      >
                        {l.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                          used > 0 ? 'bg-secondary text-foreground' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {used}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(l)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => requestDelete(l)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CrudModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New location"
        description="Locations appear throughout scheduling and calendar filters."
        variant="create"
        size="lg"
        scrollMode="dialog"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={persistCreate}
              disabled={
                !draft.name.trim() ||
                !draft.address.trim() ||
                !draft.city.trim() ||
                !draft.postcode.trim() ||
                !draft.timezone.trim()
              }
            >
              Create
            </Button>
          </div>
        }
      >
        <LocationForm value={draft} onChange={setDraft} />
      </CrudModal>

      <CrudModal
        open={selected !== null && !deleteOpen}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title="Edit location"
        variant="edit"
        size="lg"
        scrollMode="dialog"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={persistEdit}
              disabled={
                !draft.name.trim() ||
                !draft.address.trim() ||
                !draft.city.trim() ||
                !draft.postcode.trim() ||
                !draft.timezone.trim()
              }
            >
              Save changes
            </Button>
          </div>
        }
      >
        <LocationForm value={draft} onChange={setDraft} />
      </CrudModal>

      <CrudModal
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) setSelected(null)
        }}
        title="Delete location"
        description="This action cannot be undone."
        variant="delete"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteBlockedCount > 0}
            >
              Delete
            </Button>
          </div>
        }
      >
        {deleteBlockedCount > 0 ? (
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-foreground">
              This location is currently in use and can’t be deleted.
            </p>
            <p className="text-muted-foreground">
              It’s referenced by <span className="font-semibold">{deleteBlockedCount}</span>{' '}
              {deleteBlockedCount === 1 ? 'record' : 'records'} (sessions, services, or inquiries).
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
          </p>
        )}
      </CrudModal>
    </div>
  )
}

