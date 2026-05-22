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
    country: loc.country ?? '',
    postcode: loc.postcode ?? '',
    timezone: loc.timezone ?? 'America/Indiana/Indianapolis',
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
    country: draft.country.trim(),
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

function areOperatingHoursEqual(a: OperatingHours[], b: OperatingHours[]): boolean {
  if (a.length !== b.length) {
    return false
  }

  for (let index = 0; index < a.length; index += 1) {
    const left = a[index]
    const right = b[index]
    if (
      left.dayOfWeek !== right.dayOfWeek ||
      left.openTime !== right.openTime ||
      left.closeTime !== right.closeTime ||
      left.isClosed !== right.isClosed
    ) {
      return false
    }
  }

  return true
}

export default function AdminSchedulingLocationsPage() {
  const { locations, isLoading, loadError, addLocation, updateLocation, deleteLocation } =
    useLocations()
  const { services, slots } = useScheduling()
  const { inquiries } = useCalendar()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<Location | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [draft, setDraft] = useState<LocationDraft>({
    name: '',
    address: '',
    city: '',
    country: '',
    postcode: '',
    timezone: 'America/Indiana/Indianapolis',
    isActive: true,
    phone: '',
    email: '',
    imageUrl: '',
    operatingHours: defaultOperatingHours(),
  })

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
    setCreateError(null)
    setDraft({
      name: '',
      address: '',
      city: '',
      country: '',
      postcode: '',
      timezone: 'America/Indiana/Indianapolis',
      isActive: true,
      phone: '',
      email: '',
      imageUrl: '',
      operatingHours: defaultOperatingHours(),
    })
    setCreateOpen(true)
  }

  function openEdit(loc: Location) {
    setUpdateError(null)
    setSelected(loc)
    setDraft(locationToDraft(loc))
  }

  async function persistCreate(): Promise<void> {
    const patch = draftToPatch(draft)
    if (
      !patch.name ||
      !patch.address ||
      !patch.city ||
      !patch.country ||
      !patch.postcode ||
      !patch.timezone
    ) {
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      await addLocation({
        name: patch.name,
        address: patch.address,
        city: patch.city,
        country: patch.country,
        timezone: patch.timezone,
        phone: patch.phone,
        email: patch.email,
        imageUrl: patch.imageUrl,
        isActive: patch.isActive ?? true,
        settings: patch.settings ?? {},
      })
      setCreateOpen(false)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create location')
    } finally {
      setIsCreating(false)
    }
  }

  async function persistEdit(): Promise<void> {
    if (!selected) return
    const patch = draftToPatch(draft)
    if (
      !patch.name ||
      !patch.address ||
      !patch.city ||
      !patch.country ||
      !patch.postcode ||
      !patch.timezone
    ) {
      return
    }

    const updatePayload: {
      name?: string
      address?: string
      city?: string
      country?: string
      timezone?: string
      phone?: string
      email?: string
      imageUrl?: string
      isActive?: boolean
      settings?: Record<string, unknown>
    } = {}

    if (patch.name !== selected.name) {
      updatePayload.name = patch.name
    }
    if (patch.address !== selected.address) {
      updatePayload.address = patch.address
    }
    if (patch.city !== selected.city) {
      updatePayload.city = patch.city
    }
    if ((patch.country ?? undefined) !== (selected.country ?? undefined)) {
      updatePayload.country = patch.country
    }
    if (patch.timezone !== selected.timezone) {
      updatePayload.timezone = patch.timezone
    }
    if ((patch.phone ?? undefined) !== (selected.phone ?? undefined)) {
      updatePayload.phone = patch.phone
    }
    if ((patch.email ?? undefined) !== (selected.email ?? undefined)) {
      updatePayload.email = patch.email
    }
    if ((patch.imageUrl ?? undefined) !== (selected.imageUrl ?? undefined)) {
      updatePayload.imageUrl = patch.imageUrl
    }
    if ((patch.isActive ?? true) !== (selected.isActive ?? true)) {
      updatePayload.isActive = patch.isActive ?? true
    }

    const nextHours = patch.settings?.operatingHours ?? defaultOperatingHours()
    const prevHours = selected.settings?.operatingHours ?? defaultOperatingHours()
    if (!areOperatingHoursEqual(nextHours, prevHours)) {
      updatePayload.settings = {
        operatingHours: nextHours,
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      setSelected(null)
      return
    }

    setIsUpdating(true)
    setUpdateError(null)
    try {
      await updateLocation(selected.id, updatePayload)
      setSelected(null)
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to update location')
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteTarget = selected
  const deleteBlockedCount = deleteTarget ? (usageByLocationId.get(deleteTarget.id) ?? 0) : 0

  function requestDelete(loc: Location) {
    setDeleteError(null)
    setSelected(loc)
    setDeleteOpen(true)
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return
    if ((usageByLocationId.get(deleteTarget.id) ?? 0) > 0) return

    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteLocation(deleteTarget.id)
      setDeleteOpen(false)
      setSelected(null)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete location')
    } finally {
      setIsDeleting(false)
    }
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
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Failed to refresh locations from API: {loadError}
            </p>
          ) : null}

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
              {isLoading ? 'Loading... ' : null}
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
                isCreating ||
                !draft.name.trim() ||
                !draft.address.trim() ||
                !draft.city.trim() ||
                !draft.country.trim() ||
                !draft.postcode.trim() ||
                !draft.timezone.trim()
              }
            >
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        }
      >
        {createError ? (
          <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Failed to create location: {createError}
          </p>
        ) : null}
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
                isUpdating ||
                !draft.name.trim() ||
                !draft.address.trim() ||
                !draft.city.trim() ||
                !draft.country.trim() ||
                !draft.postcode.trim() ||
                !draft.timezone.trim()
              }
            >
              {isUpdating ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        }
      >
        {updateError ? (
          <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Failed to update location: {updateError}
          </p>
        ) : null}
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
              disabled={deleteBlockedCount > 0 || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        }
      >
        {deleteError ? (
          <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Failed to delete location: {deleteError}
          </p>
        ) : null}
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

