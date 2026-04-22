/** Admin scheduling create service page — replaces modal-based event creation. */

'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { EventTypeSelector } from '@/components/admin/event-type-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { LABELS } from '@/lib/constants/ui-labels'
import { locations } from '@/lib/mock-data'
import { newAdminEntityId } from '@/lib/scheduling-admin-builders'
import { useScheduling } from '@/lib/scheduling-store'
import type {
  EventVisibility,
  SchedulingBookingMode,
  SchedulingCategory,
  SchedulingService,
  SchedulingServiceType,
} from '@/lib/types'
import { SchedulingServiceTypeEnum } from '@/lib/types'

const CONSUMER_ALIGNED_CATEGORY_IDS = new Set<string>([
  'cat-open-play',
  'cat-private-play',
  'cat-special-play-events',
  'cat-camps-play',
  'cat-parents-night',
  'cat-field-trips',
  'cat-we-bring-play',
  'cat-gym-babies',
  'cat-gym-toddlers',
  'cat-gym-preschool',
  'cat-gym-kids',
  'cat-gym-teens',
  'cat-gym-adults',
  'cat-gym-seniors',
  'cat-gym-family',
  'cat-gym-prenatal',
  'cat-gym-special-needs',
  'cat-5',
])

function isConsumerAlignedCategoryId(categoryId: string): boolean {
  if (CONSUMER_ALIGNED_CATEGORY_IDS.has(categoryId)) {
    return true
  }
  return (
    categoryId.startsWith('cat-gym-') ||
    categoryId.startsWith('cat-play-') ||
    categoryId.startsWith('cat-event-')
  )
}

function parseOptionalFloat(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number.parseFloat(trimmed)
  return Number.isFinite(n) ? n : null
}

interface CreateDraft {
  readonly categoryId: string
  readonly serviceType: SchedulingServiceType
  readonly bookingMode: SchedulingBookingMode
  readonly eventType: EventVisibility
  readonly locationId: string
  readonly name: string
  readonly description: string
  readonly basePrice: string
  readonly capacity: string
  readonly durationMinutes: string
  readonly isActive: boolean
}

export default function AdminSchedulingServiceNewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { categories, addService } = useScheduling()
  const requestedCategoryId = searchParams.get('categoryId')?.trim() ?? ''
  const rawReturnTo = searchParams.get('returnTo')?.trim() ?? '/admin/scheduling/services'
  const returnTo = rawReturnTo.startsWith('/admin/') ? rawReturnTo : '/admin/scheduling/services'

  const sortedCategories = useMemo(() => {
    return categories
      .filter((category) => isConsumerAlignedCategoryId(category.id))
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }, [categories])

  const initialCategoryId = useMemo(() => {
    if (requestedCategoryId && sortedCategories.some((entry) => entry.id === requestedCategoryId)) {
      return requestedCategoryId
    }
    return sortedCategories[0]?.id ?? ''
  }, [requestedCategoryId, sortedCategories])

  const [draft, setDraft] = useState<CreateDraft>({
    categoryId: initialCategoryId,
    serviceType: 'GYM_CLASS',
    bookingMode: 'SCHEDULED',
    eventType: 'PUBLIC',
    locationId: locations[0]?.id ?? 'loc-1',
    name: '',
    description: '',
    basePrice: '',
    capacity: '',
    durationMinutes: '60',
    isActive: true,
  })

  const selectedCategory = useMemo<SchedulingCategory | null>(() => {
    return sortedCategories.find((entry) => entry.id === draft.categoryId) ?? null
  }, [draft.categoryId, sortedCategories])

  function handleCreate() {
    const basePrice = Number.parseFloat(draft.basePrice)
    const capacity = Number.parseInt(draft.capacity, 10)
    const durationMinutes = Number.parseInt(draft.durationMinutes, 10)
    if (
      !selectedCategory ||
      !draft.name.trim() ||
      !Number.isFinite(basePrice) ||
      !Number.isFinite(capacity) ||
      !Number.isFinite(durationMinutes)
    ) {
      return
    }

    const subscriptionPrice = parseOptionalFloat('')
    const created: SchedulingService = {
      id: newAdminEntityId('svc'),
      locationId: draft.locationId.trim() || null,
      categoryId: selectedCategory.id,
      category: { ...selectedCategory },
      serviceType: draft.serviceType,
      bookingMode: draft.bookingMode,
      eventType: draft.eventType,
      name: draft.name.trim(),
      description: draft.description.trim() || '—',
      durationMinutes,
      capacity,
      basePrice,
      subscriptionPrice,
      requiresWaiver: false,
      requiredDocumentIds: [],
      ageMin: null,
      ageMax: null,
      isActive: draft.isActive,
      minDurationMinutes: draft.bookingMode === 'OPEN' ? 60 : null,
      maxDurationMinutes: draft.bookingMode === 'OPEN' ? 240 : null,
      slotIncrementMinutes: draft.bookingMode === 'OPEN' ? 60 : null,
      maxConcurrent: draft.bookingMode === 'OPEN' ? 3 : null,
      minAdvanceHours: 0,
      maxAdvanceHours: 168,
      pricingModel: draft.bookingMode === 'OPEN' ? 'per_hour' : 'flat',
      imageUrl: '/images/hero-sports.jpg',
      tags: [],
      addOns: [],
      siblingPrice: undefined,
      freeAdultCount: 2,
      additionalAdultPrice: undefined,
      minSeats: 1,
      pricePerHour: undefined,
      minChildSeats: undefined,
      maxChildSeats: undefined,
      minAdultSeats: undefined,
      maxAdultSeats: undefined,
      additionalChildPrice: undefined,
      isPackageService: false,
      linkedAddOns: [],
    }
    addService(created)
    router.push(returnTo)
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">New event</h1>
        <p className="mt-2 text-muted-foreground">
          Add a catalog event for the selected event category.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{LABELS.createService}</CardTitle>
          <CardDescription>Create and publish a new service entry.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{LABELS.serviceCategory}</Label>
              <Select
                value={draft.categoryId}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {sortedCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={draft.locationId}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, locationId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Booking mode</Label>
              <Select
                value={draft.bookingMode}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, bookingMode: value as SchedulingBookingMode }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select
                value={draft.serviceType}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, serviceType: value as SchedulingServiceType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SchedulingServiceTypeEnum).map((serviceType) => (
                    <SelectItem key={serviceType} value={serviceType}>
                      {serviceType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Event visibility</Label>
            <EventTypeSelector
              value={draft.eventType}
              onChange={(value) => setDraft((prev) => ({ ...prev, eventType: value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Base price</Label>
              <Input
                type="number"
                value={draft.basePrice}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, basePrice: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input
                type="number"
                value={draft.capacity}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, capacity: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={draft.durationMinutes}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, durationMinutes: event.target.value }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
              <span className="text-sm font-semibold text-foreground">Active</span>
              <Switch
                checked={draft.isActive}
                onCheckedChange={(value) => setDraft((prev) => ({ ...prev, isActive: value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href={returnTo}>Cancel</Link>
            </Button>
            <Button type="button" className="bg-accent text-accent-foreground" onClick={handleCreate}>
              Create event
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
