/** Admin scheduling create service page — replaces modal-based event creation. */

'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { CrudModal } from '@/components/admin/crud-modal'
import { EventTypeSelector } from '@/components/admin/event-type-selector'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useClients } from '@/lib/client-store'
import { LABELS } from '@/lib/constants/ui-labels'
import { locations, samplePreschoolAddOns } from '@/lib/mock-data'
import { useInventory } from '@/lib/inventory-store'
import { newAdminEntityId } from '@/lib/scheduling-admin-builders'
import {
  SCHEDULING_TOP_LEVEL_ORDER,
  getSchedulingTopLevelId,
  getSchedulingTopLevelLabel,
  isConsumerAlignedCategoryId,
  type SchedulingTopLevelId,
} from '@/lib/scheduling-consumer-categories'
import { showMaxPassCountAdminField } from '@/lib/booking-pass-count'
import { isOpenPlayPassCatalogServiceId } from '@/lib/open-play-pass-catalog'
import { useScheduling } from '@/lib/scheduling-store'
import { bookingAddOnToSchedulingAddOn, formatPrice } from '@/lib/utils'
import type {
  CategoryAddOnChargeFrequency,
  EventVisibility,
  SchedulingBookingMode,
  SchedulingCategory,
  SchedulingService,
  SchedulingServiceType,
} from '@/lib/types'
import { CATEGORY_ADD_ON_CHARGE_FREQUENCIES, SchedulingServiceTypeEnum } from '@/lib/types'

function parseOptionalFloat(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number.parseFloat(trimmed)
  return Number.isFinite(n) ? n : null
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number.parseInt(trimmed, 10)
  return Number.isFinite(n) ? n : null
}

function draftFromService(service: SchedulingService): CreateDraft {
  return {
    categoryId: service.categoryId,
    serviceType: service.serviceType,
    bookingMode: service.bookingMode,
    eventType: service.eventType,
    locationId: service.locationId ?? locations[0]?.id ?? 'loc-1',
    name: service.name,
    description: service.description ?? '',
    subscriptionPrice: service.subscriptionPrice != null ? String(service.subscriptionPrice) : '',
    requiresWaiver: Boolean(service.requiresWaiver),
    requiredDocumentIds: service.requiredDocumentIds ?? [],
    ageMin: service.ageMin != null ? String(service.ageMin) : '',
    ageMax: service.ageMax != null ? String(service.ageMax) : '',
    basePrice: String(service.basePrice),
    capacity: String(service.capacity),
    durationMinutes: String(service.durationMinutes),
    minDurationMinutes: service.minDurationMinutes != null ? String(service.minDurationMinutes) : '',
    maxDurationMinutes: service.maxDurationMinutes != null ? String(service.maxDurationMinutes) : '',
    slotIncrementMinutes:
      service.slotIncrementMinutes != null ? String(service.slotIncrementMinutes) : '',
    maxConcurrent: service.maxConcurrent != null ? String(service.maxConcurrent) : '',
    minAdvanceHours: service.minAdvanceHours != null ? String(service.minAdvanceHours) : '',
    maxAdvanceHours: service.maxAdvanceHours != null ? String(service.maxAdvanceHours) : '',
    siblingPrice: service.siblingPrice ?? '',
    freeAdultCount:
      service.freeAdultCount != null ? String(service.freeAdultCount) : '2',
    maxPassCount:
      service.maxPassCount != null ? String(service.maxPassCount) : '',
    additionalAdultPrice: service.additionalAdultPrice ?? '',
    minSeats: service.minSeats != null ? String(service.minSeats) : '1',
    pricePerHour: service.pricePerHour ?? '',
    minChildSeats: service.minChildSeats != null ? String(service.minChildSeats) : '',
    maxChildSeats: service.maxChildSeats != null ? String(service.maxChildSeats) : '',
    minAdultSeats: service.minAdultSeats != null ? String(service.minAdultSeats) : '',
    maxAdultSeats: service.maxAdultSeats != null ? String(service.maxAdultSeats) : '',
    additionalChildPrice: service.additionalChildPrice ?? '',
    isPackageService: Boolean(service.isPackageService),
    pendingServiceAddOnLinks: (service.linkedAddOns ?? []).map((row) => ({
      addOnId: row.addOnId,
      addOnName: row.addOnName,
      isFree: row.isFree,
      quantity: String(row.quantity ?? 1),
      unitPrice: String(row.unitPrice ?? 0),
      chargeFrequency: row.chargeFrequency ?? 'ONE_TIME',
    })),
    isActive: service.isActive,
  }
}

interface CreateDraft {
  readonly categoryId: string
  readonly serviceType: SchedulingServiceType
  readonly bookingMode: SchedulingBookingMode
  readonly eventType: EventVisibility
  readonly locationId: string
  readonly name: string
  readonly description: string
  readonly subscriptionPrice: string
  readonly requiresWaiver: boolean
  readonly requiredDocumentIds: string[]
  readonly ageMin: string
  readonly ageMax: string
  readonly basePrice: string
  readonly capacity: string
  readonly durationMinutes: string
  readonly minDurationMinutes: string
  readonly maxDurationMinutes: string
  readonly slotIncrementMinutes: string
  readonly maxConcurrent: string
  readonly minAdvanceHours: string
  readonly maxAdvanceHours: string
  readonly siblingPrice: string
  readonly freeAdultCount: string
  readonly maxPassCount: string
  readonly additionalAdultPrice: string
  readonly minSeats: string
  readonly pricePerHour: string
  readonly minChildSeats: string
  readonly maxChildSeats: string
  readonly minAdultSeats: string
  readonly maxAdultSeats: string
  readonly additionalChildPrice: string
  readonly isPackageService: boolean
  readonly pendingServiceAddOnLinks: {
    addOnId: string
    addOnName?: string
    isFree: boolean
    quantity: string
    unitPrice: string
    chargeFrequency: CategoryAddOnChargeFrequency
  }[]
  readonly isActive: boolean
}

function AdminSchedulingServiceNewPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { documents } = useClients()
  const { bookingAddOns } = useInventory()
  const { categories, services, addService, updateService } = useScheduling()
  const requestedCategoryId = searchParams.get('categoryId')?.trim() ?? ''
  const requestedServiceId = searchParams.get('serviceId')?.trim() ?? ''
  const rawReturnTo = searchParams.get('returnTo')?.trim() ?? '/admin/scheduling/services'
  const returnTo = rawReturnTo.startsWith('/admin/') ? rawReturnTo : '/admin/scheduling/services'
  const editingService = useMemo(() => {
    if (!requestedServiceId || isOpenPlayPassCatalogServiceId(requestedServiceId)) {
      return null
    }
    return services.find((entry) => entry.id === requestedServiceId) ?? null
  }, [requestedServiceId, services])
  const isEditing = Boolean(editingService)

  useEffect(() => {
    if (!requestedServiceId || !isOpenPlayPassCatalogServiceId(requestedServiceId)) {
      return
    }
    router.replace('/admin/memberships')
  }, [requestedServiceId, router])

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

  const lockedTopLevelCategory = useMemo<SchedulingTopLevelId | null>(() => {
    if (isEditing && editingService) {
      return getSchedulingTopLevelId(editingService.categoryId)
    }
    if (
      !isEditing &&
      requestedCategoryId.length > 0 &&
      sortedCategories.some((entry) => entry.id === requestedCategoryId)
    ) {
      return getSchedulingTopLevelId(requestedCategoryId)
    }
    return null
  }, [isEditing, editingService, requestedCategoryId, sortedCategories])

  const newEventHeroDescription = useMemo(() => {
    if (isEditing) {
      return 'Update this catalog event. Category is fixed; you can change sub-category and other fields.'
    }
    if (lockedTopLevelCategory !== null) {
      return 'Category matches where you started. You can still change sub-category below.'
    }
    return 'Choose category and sub-category, then complete the details.'
  }, [isEditing, lockedTopLevelCategory])

  const [programArea, setProgramArea] = useState<SchedulingTopLevelId>(() =>
    getSchedulingTopLevelId(initialCategoryId),
  )

  const [draft, setDraft] = useState<CreateDraft>({
    categoryId: initialCategoryId,
    serviceType: 'GYM_CLASS',
    bookingMode: 'SCHEDULED',
    eventType: 'PUBLIC',
    locationId: locations[0]?.id ?? 'loc-1',
    name: '',
    description: '',
    subscriptionPrice: '',
    requiresWaiver: false,
    requiredDocumentIds: [],
    ageMin: '',
    ageMax: '',
    basePrice: '',
    capacity: '',
    durationMinutes: '60',
    minDurationMinutes: '',
    maxDurationMinutes: '',
    slotIncrementMinutes: '',
    maxConcurrent: '',
    minAdvanceHours: '',
    maxAdvanceHours: '',
    siblingPrice: '',
    freeAdultCount: '2',
    maxPassCount: '',
    additionalAdultPrice: '',
    minSeats: '1',
    pricePerHour: '',
    minChildSeats: '',
    maxChildSeats: '',
    minAdultSeats: '',
    maxAdultSeats: '',
    additionalChildPrice: '',
    isPackageService: false,
    pendingServiceAddOnLinks: [],
    isActive: true,
  })

  const subCategoriesInProgramArea = useMemo(() => {
    return sortedCategories.filter((entry) => getSchedulingTopLevelId(entry.id) === programArea)
  }, [programArea, sortedCategories])

  useEffect(() => {
    if (!editingService) {
      return
    }
    setDraft(draftFromService(editingService))
    setProgramArea(getSchedulingTopLevelId(editingService.categoryId))
  }, [editingService])

  useEffect(() => {
    if (isEditing || lockedTopLevelCategory === null) {
      return
    }
    setProgramArea(lockedTopLevelCategory)
  }, [isEditing, lockedTopLevelCategory])

  useEffect(() => {
    if (editingService || !initialCategoryId) {
      return
    }
    setDraft((prev) => {
      if (prev.categoryId) {
        return prev
      }
      return { ...prev, categoryId: initialCategoryId }
    })
  }, [editingService, initialCategoryId])

  useEffect(() => {
    const fallback = subCategoriesInProgramArea[0]?.id ?? ''
    if (
      !fallback ||
      subCategoriesInProgramArea.some((entry) => entry.id === draft.categoryId)
    ) {
      return
    }
    setDraft((prev) => ({ ...prev, categoryId: fallback }))
  }, [draft.categoryId, subCategoriesInProgramArea])

  const [newAddOnId, setNewAddOnId] = useState<string>('')
  const [addOnModalOpen, setAddOnModalOpen] = useState(false)
  const [pendingAddOnQuantity, setPendingAddOnQuantity] = useState('1')
  const [pendingAddOnIsFree, setPendingAddOnIsFree] = useState(false)
  const [pendingAddOnUnitPrice, setPendingAddOnUnitPrice] = useState('')
  const [pendingAddOnChargeFrequency, setPendingAddOnChargeFrequency] =
    useState<CategoryAddOnChargeFrequency>('ONE_TIME')
  const waiverDocs = useMemo(
    () => documents.filter((document) => document.type === 'WAIVER'),
    [documents],
  )
  const addOnCatalog = useMemo(() => {
    const map = new Map<string, ReturnType<typeof bookingAddOnToSchedulingAddOn>>()
    for (const addOn of bookingAddOns) {
      map.set(addOn.id, bookingAddOnToSchedulingAddOn(addOn))
    }
    for (const addOn of samplePreschoolAddOns) {
      map.set(addOn.id, addOn)
    }
    return Array.from(map.values())
  }, [bookingAddOns])
  const selectedAddOnForModal = useMemo(() => {
    if (!newAddOnId) {
      return null
    }
    return addOnCatalog.find((entry) => entry.id === newAddOnId) ?? null
  }, [addOnCatalog, newAddOnId])

  const selectedCategory = useMemo<SchedulingCategory | null>(() => {
    return sortedCategories.find((entry) => entry.id === draft.categoryId) ?? null
  }, [draft.categoryId, sortedCategories])

  function handleProgramAreaChange(next: SchedulingTopLevelId): void {
    if (lockedTopLevelCategory !== null) {
      return
    }
    setProgramArea(next)
    setDraft((prev) => {
      const subs = sortedCategories.filter((entry) => getSchedulingTopLevelId(entry.id) === next)
      const keep = subs.some((entry) => entry.id === prev.categoryId)
      const nextCategoryId = keep ? prev.categoryId : (subs[0]?.id ?? prev.categoryId)
      return { ...prev, categoryId: nextCategoryId }
    })
  }

  function openAddOnModal(): void {
    if (!newAddOnId) {
      return
    }
    const selectedAddOn = addOnCatalog.find((entry) => entry.id === newAddOnId)
    setPendingAddOnQuantity('1')
    setPendingAddOnIsFree(false)
    setPendingAddOnUnitPrice(
      selectedAddOn ? String(Number(selectedAddOn.price.toFixed(2))) : '',
    )
    setPendingAddOnChargeFrequency('ONE_TIME')
    setAddOnModalOpen(true)
  }

  function confirmAddOnLink(): void {
    if (!newAddOnId) {
      return
    }
    const parsedQuantity = Number.parseInt(pendingAddOnQuantity, 10)
    const parsedUnitPrice = pendingAddOnIsFree ? 0 : Number.parseFloat(pendingAddOnUnitPrice)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1 || !Number.isFinite(parsedUnitPrice)) {
      return
    }
    setDraft((prev) => ({
      ...prev,
      pendingServiceAddOnLinks: [
        ...prev.pendingServiceAddOnLinks,
        {
          addOnId: newAddOnId,
          addOnName: selectedAddOnForModal?.name ?? undefined,
          isFree: pendingAddOnIsFree,
          quantity: String(parsedQuantity),
          unitPrice: Number(parsedUnitPrice).toFixed(2),
          chargeFrequency: pendingAddOnChargeFrequency,
        },
      ],
    }))
    setAddOnModalOpen(false)
    setNewAddOnId('')
  }

  function handleSubmit() {
    const basePrice = Number.parseFloat(draft.basePrice)
    const capacity = Number.parseInt(draft.capacity, 10)
    const durationMinutes = Number.parseInt(draft.durationMinutes, 10)
    const subscriptionPrice = parseOptionalFloat(draft.subscriptionPrice)
    const ageMin = parseOptionalInt(draft.ageMin)
    const ageMax = parseOptionalInt(draft.ageMax)
    const minDurationMinutes = parseOptionalInt(draft.minDurationMinutes)
    const maxDurationMinutes = parseOptionalInt(draft.maxDurationMinutes)
    const slotIncrementMinutes = parseOptionalInt(draft.slotIncrementMinutes)
    const maxConcurrent = parseOptionalInt(draft.maxConcurrent)
    const minAdvanceHours = parseOptionalInt(draft.minAdvanceHours)
    const maxAdvanceHours = parseOptionalInt(draft.maxAdvanceHours)
    const freeAdultParsed = parseOptionalInt(draft.freeAdultCount)
    const freeAdultCount = freeAdultParsed != null && freeAdultParsed >= 0 ? freeAdultParsed : 2
    const minSeatsParsed = parseOptionalInt(draft.minSeats)
    const minSeats = minSeatsParsed != null && minSeatsParsed >= 1 ? minSeatsParsed : 1
    const minChildSeats = parseOptionalInt(draft.minChildSeats)
    const maxChildSeats = parseOptionalInt(draft.maxChildSeats)
    const minAdultSeats = parseOptionalInt(draft.minAdultSeats)
    const maxAdultSeats = parseOptionalInt(draft.maxAdultSeats)
    if (
      !selectedCategory ||
      !draft.name.trim() ||
      !Number.isFinite(basePrice) ||
      !Number.isFinite(capacity) ||
      !Number.isFinite(durationMinutes)
    ) {
      return
    }

    if (isEditing && editingService) {
      updateService(editingService.id, {
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
        requiresWaiver: draft.requiresWaiver,
        requiredDocumentIds: draft.requiresWaiver ? draft.requiredDocumentIds.slice() : [],
        ageMin,
        ageMax,
        isActive: draft.isActive,
        minDurationMinutes:
          draft.bookingMode === 'OPEN' ? (minDurationMinutes ?? 60) : minDurationMinutes,
        maxDurationMinutes:
          draft.bookingMode === 'OPEN' ? (maxDurationMinutes ?? 240) : maxDurationMinutes,
        slotIncrementMinutes:
          draft.bookingMode === 'OPEN' ? (slotIncrementMinutes ?? 60) : slotIncrementMinutes,
        maxConcurrent: draft.bookingMode === 'OPEN' ? (maxConcurrent ?? 3) : maxConcurrent,
        minAdvanceHours: minAdvanceHours ?? 0,
        maxAdvanceHours: maxAdvanceHours ?? 168,
        pricingModel: draft.bookingMode === 'OPEN' ? 'per_hour' : 'flat',
        siblingPrice: draft.siblingPrice.trim() || undefined,
        freeAdultCount,
        maxPassCount: (() => {
          const parsed = parseOptionalInt(draft.maxPassCount)
          return parsed != null && parsed >= 1 ? parsed : undefined
        })(),
        additionalAdultPrice: draft.additionalAdultPrice.trim() || undefined,
        minSeats,
        pricePerHour: draft.pricePerHour.trim() || undefined,
        minChildSeats: minChildSeats ?? undefined,
        maxChildSeats: maxChildSeats ?? undefined,
        minAdultSeats: minAdultSeats ?? undefined,
        maxAdultSeats: maxAdultSeats ?? undefined,
        additionalChildPrice: draft.additionalChildPrice.trim() || undefined,
        isPackageService: draft.isPackageService,
        linkedAddOns: draft.pendingServiceAddOnLinks.map((row, index) => ({
          id: editingService.linkedAddOns?.[index]?.id ?? newAdminEntityId('cao'),
          categoryId: editingService.id,
          addOnId: row.addOnId,
          addOnName: row.addOnName,
          isOptional: true,
          isFree: row.isFree,
          quantity: Number.parseInt(row.quantity, 10),
          unitPrice: Number.parseFloat(row.unitPrice),
          chargeFrequency: row.chargeFrequency,
        })),
      })
      router.push(returnTo)
      return
    }

    const createdServiceId = newAdminEntityId('svc')
    const created: SchedulingService = {
      id: createdServiceId,
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
      requiresWaiver: draft.requiresWaiver,
      requiredDocumentIds: draft.requiresWaiver ? draft.requiredDocumentIds.slice() : [],
      ageMin,
      ageMax,
      isActive: draft.isActive,
      minDurationMinutes: draft.bookingMode === 'OPEN' ? (minDurationMinutes ?? 60) : minDurationMinutes,
      maxDurationMinutes: draft.bookingMode === 'OPEN' ? (maxDurationMinutes ?? 240) : maxDurationMinutes,
      slotIncrementMinutes:
        draft.bookingMode === 'OPEN' ? (slotIncrementMinutes ?? 60) : slotIncrementMinutes,
      maxConcurrent: draft.bookingMode === 'OPEN' ? (maxConcurrent ?? 3) : maxConcurrent,
      minAdvanceHours: minAdvanceHours ?? 0,
      maxAdvanceHours: maxAdvanceHours ?? 168,
      pricingModel: draft.bookingMode === 'OPEN' ? 'per_hour' : 'flat',
      imageUrl: '/images/hero-sports.jpg',
      tags: [],
      addOns: [],
      siblingPrice: draft.siblingPrice.trim() || undefined,
      freeAdultCount,
      maxPassCount: (() => {
        const parsed = parseOptionalInt(draft.maxPassCount)
        return parsed != null && parsed >= 1 ? parsed : undefined
      })(),
      additionalAdultPrice: draft.additionalAdultPrice.trim() || undefined,
      minSeats,
      pricePerHour: draft.pricePerHour.trim() || undefined,
      minChildSeats: minChildSeats ?? undefined,
      maxChildSeats: maxChildSeats ?? undefined,
      minAdultSeats: minAdultSeats ?? undefined,
      maxAdultSeats: maxAdultSeats ?? undefined,
      additionalChildPrice: draft.additionalChildPrice.trim() || undefined,
      isPackageService: draft.isPackageService,
      linkedAddOns: draft.pendingServiceAddOnLinks.map((row) => ({
        id: newAdminEntityId('cao'),
        categoryId: createdServiceId,
        addOnId: row.addOnId,
        addOnName: row.addOnName,
        isOptional: true,
        isFree: row.isFree,
        quantity: Number.parseInt(row.quantity, 10),
        unitPrice: Number.parseFloat(row.unitPrice),
        chargeFrequency: row.chargeFrequency,
      })),
    }
    addService(created)
    const redirectParams = new URLSearchParams({
      serviceId: createdServiceId,
      returnTo,
    })
    router.push(`/admin/scheduling/new/recurring?${redirectParams.toString()}`)
  }

  return (
    <div className="w-full space-y-3">
      <div className="space-y-2">
        <Link href={returnTo}>
          <Button type="button" variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {isEditing ? 'Edit event' : 'New event'}
        </h1>
        <p className="text-sm text-muted-foreground">{newEventHeroDescription}</p>
      </div>

      <Card className="gap-0 border-border py-0 shadow-sm">
        <CardHeader className="gap-0.5 border-b border-border px-4 py-2.5 sm:px-6 [.border-b]:pb-2.5">
          <CardTitle className="text-sm font-semibold sm:text-base">
            {isEditing ? 'Edit Event' : LABELS.createService}
          </CardTitle>
          <CardDescription className="text-xs leading-snug text-muted-foreground sm:text-sm">
            {isEditing
              ? 'Edit and save this service entry.'
              : 'Create and publish a new service entry.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-8 pt-3 sm:px-6">
          <div className="w-full space-y-5">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label>Category</Label>
                {lockedTopLevelCategory !== null ? (
                  <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm font-medium text-foreground">
                    {getSchedulingTopLevelLabel(lockedTopLevelCategory)}
                  </div>
                ) : (
                  <Select
                    value={programArea}
                    onValueChange={(value) =>
                      handleProgramAreaChange(value as SchedulingTopLevelId)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULING_TOP_LEVEL_ORDER.map((topLevelId) => (
                        <SelectItem key={topLevelId} value={topLevelId}>
                          {getSchedulingTopLevelLabel(topLevelId)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="min-w-0 space-y-2">
                <Label>Sub-category</Label>
                <Select
                  value={draft.categoryId}
                  onValueChange={(value) =>
                    setDraft((prev) => ({ ...prev, categoryId: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategoriesInProgramArea.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
              <div className="min-w-0 space-y-2">
                <Label>Location</Label>
                <Select
                  value={draft.locationId}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, locationId: value }))}
                >
                  <SelectTrigger className="w-full">
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
              <div className="min-w-0 space-y-2">
                <Label>Booking mode</Label>
                <Select
                  value={draft.bookingMode}
                  onValueChange={(value) =>
                    setDraft((prev) => ({ ...prev, bookingMode: value as SchedulingBookingMode }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-2">
                <Label>Event Type</Label>
                <Select
                  value={draft.serviceType}
                  onValueChange={(value) =>
                    setDraft((prev) => ({ ...prev, serviceType: value as SchedulingServiceType }))
                  }
                >
                  <SelectTrigger className="w-full">
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
              className="w-full"
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

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
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

          <Accordion type="single" collapsible className="rounded-lg border border-border px-3">
            <AccordionItem value="pricing-seat-rules">
              <AccordionTrigger className="text-sm font-semibold">
                Pricing &amp; seat rules
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 pb-2 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Sibling price (per additional family child)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={draft.siblingPrice}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, siblingPrice: event.target.value }))
                      }
                      placeholder="e.g. 10.00 — leave blank to charge base price for all children"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Free adults per family</Label>
                    <Input
                      type="number"
                      min={0}
                      value={draft.freeAdultCount}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, freeAdultCount: event.target.value }))
                      }
                    />
                  </div>
                  {showMaxPassCountAdminField({
                    id: editingService?.id ?? '',
                    categoryId: draft.categoryId,
                  }) ? (
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="new-page-max-passes">Max passes per booking</Label>
                      <Input
                        id="new-page-max-passes"
                        type="number"
                        min={1}
                        max={99}
                        value={draft.maxPassCount}
                        onChange={(event) =>
                          setDraft((prev) => ({ ...prev, maxPassCount: event.target.value }))
                        }
                        placeholder="Leave blank for no limit"
                      />
                      <p className="text-xs text-muted-foreground">
                        Customer “No of passes” stepper. Set 1 to fix at one pass (no +/−).
                        Set 2 to allow up to two passes, and so on.
                      </p>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <Label>Price per extra adult (beyond free count)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={draft.additionalAdultPrice}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, additionalAdultPrice: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum participants</Label>
                    <Input
                      type="number"
                      min={1}
                      value={draft.minSeats}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, minSeats: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Hourly rate (duration-based billing)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={draft.pricePerHour}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, pricePerHour: event.target.value }))
                      }
                      placeholder="e.g. 75.00 — overrides per-participant pricing"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min children</Label>
                    <Input
                      type="number"
                      min={0}
                      value={draft.minChildSeats}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, minChildSeats: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max children</Label>
                    <Input
                      type="number"
                      min={0}
                      value={draft.maxChildSeats}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, maxChildSeats: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min adults</Label>
                    <Input
                      type="number"
                      min={0}
                      value={draft.minAdultSeats}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, minAdultSeats: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max adults</Label>
                    <Input
                      type="number"
                      min={0}
                      value={draft.maxAdultSeats}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, maxAdultSeats: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Price per extra child (beyond max child seats)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={draft.additionalChildPrice}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, additionalChildPrice: event.target.value }))
                      }
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-3 py-2">
            <div className="space-y-1">
              <Label>Package-only service</Label>
              <p className="text-xs text-muted-foreground">
                When enabled, customers must select an event package to book.
              </p>
            </div>
            <Switch
              checked={draft.isPackageService}
              onCheckedChange={(value) => setDraft((prev) => ({ ...prev, isPackageService: value }))}
            />
          </div>
          {draft.isPackageService ? (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTitle className="text-amber-950 dark:text-amber-100">Package-only</AlertTitle>
              <AlertDescription className="text-amber-900/90 dark:text-amber-50/90">
                After creating this {LABELS.service.toLowerCase()}, open it to link or create packages.
              </AlertDescription>
            </Alert>
          ) : null}

          <Accordion type="single" collapsible className="rounded-lg border border-border px-3">
            <AccordionItem value="linked-addons">
              <AccordionTrigger className="text-sm font-semibold">
                Linked add-ons (optional)
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  {draft.pendingServiceAddOnLinks.map((row) => {
                    const addOn = addOnCatalog.find((entry) => entry.id === row.addOnId)
                    return (
                      <div
                        key={row.addOnId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {addOn?.name ?? row.addOnName ?? row.addOnId}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Free</Label>
                            <Switch
                              checked={row.isFree}
                              onCheckedChange={(value) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  pendingServiceAddOnLinks: prev.pendingServiceAddOnLinks.map((entry) =>
                                    entry.addOnId === row.addOnId ? { ...entry, isFree: value } : entry,
                                  ),
                                }))
                              }
                            />
                          </div>
                          {!row.isFree && addOn ? (
                            <Badge variant="secondary">{formatPrice(addOn.price)}</Badge>
                          ) : null}
                          <Badge variant="outline">{`Qty ${row.quantity}`}</Badge>
                          <Badge variant="outline">{`$${row.unitPrice}`}</Badge>
                          <Badge variant="outline">
                            {
                              CATEGORY_ADD_ON_CHARGE_FREQUENCIES.find(
                                (option) => option.value === row.chargeFrequency,
                              )?.label
                            }
                          </Badge>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                pendingServiceAddOnLinks: prev.pendingServiceAddOnLinks.filter(
                                  (entry) => entry.addOnId !== row.addOnId,
                                ),
                              }))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select value={newAddOnId} onValueChange={setNewAddOnId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Link add-on" />
                      </SelectTrigger>
                      <SelectContent>
                        {addOnCatalog
                          .filter(
                            (addOn) =>
                              !draft.pendingServiceAddOnLinks.some(
                                (entry) => entry.addOnId === addOn.id,
                              ),
                          )
                          .map((addOn) => (
                            <SelectItem key={addOn.id} value={addOn.id}>
                              {addOn.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openAddOnModal}
                      disabled={!newAddOnId}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Subscription price (optional)</Label>
              <Input
                type="number"
                value={draft.subscriptionPrice}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, subscriptionPrice: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Requires waiver</Label>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                <span className="text-sm text-muted-foreground">Require waiver at checkout</span>
                <Switch
                  checked={draft.requiresWaiver}
                  onCheckedChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      requiresWaiver: value,
                      requiredDocumentIds: value ? prev.requiredDocumentIds : [],
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {draft.requiresWaiver ? (
            <div className="space-y-2">
              <Label>Required waivers</Label>
              {waiverDocs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No waiver documents exist yet. Create them in Admin → Waivers.
                </p>
              ) : (
                <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                  {waiverDocs.map((document) => {
                    const checked = draft.requiredDocumentIds.includes(document.id)
                    return (
                      <label key={document.id} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          onChange={(event) => {
                            const nextChecked = event.target.checked
                            setDraft((prev) => ({
                              ...prev,
                              requiredDocumentIds: nextChecked
                                ? Array.from(new Set([...prev.requiredDocumentIds, document.id]))
                                : prev.requiredDocumentIds.filter((id) => id !== document.id),
                            }))
                          }}
                        />
                        <span className="min-w-0">
                          <span className="text-sm font-semibold text-foreground">{document.title}</span>
                          <span className="block text-xs text-muted-foreground">v{document.version}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Min age (optional)</Label>
              <Input
                type="number"
                min={0}
                value={draft.ageMin}
                onChange={(event) => setDraft((prev) => ({ ...prev, ageMin: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max age (optional)</Label>
              <Input
                type="number"
                min={0}
                value={draft.ageMax}
                onChange={(event) => setDraft((prev) => ({ ...prev, ageMax: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={draft.durationMinutes}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, durationMinutes: event.target.value }))
                }
              />
            </div>
          </div>

          <Accordion type="single" collapsible defaultValue="booking-rules">
            <AccordionItem value="booking-rules">
              <AccordionTrigger>Booking rules</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 pb-2 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Min duration (mins)</Label>
                    <Input
                      type="number"
                      value={draft.minDurationMinutes}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, minDurationMinutes: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max duration (mins)</Label>
                    <Input
                      type="number"
                      value={draft.maxDurationMinutes}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, maxDurationMinutes: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slot increment (mins)</Label>
                    <Input
                      type="number"
                      value={draft.slotIncrementMinutes}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, slotIncrementMinutes: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max concurrent</Label>
                    <Input
                      type="number"
                      value={draft.maxConcurrent}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, maxConcurrent: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min advance (hours)</Label>
                    <Input
                      type="number"
                      value={draft.minAdvanceHours}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, minAdvanceHours: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max advance (hours)</Label>
                    <Input
                      type="number"
                      value={draft.maxAdvanceHours}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, maxAdvanceHours: event.target.value }))
                      }
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
            <span className="text-sm font-semibold text-foreground">Active</span>
            <Switch
              checked={draft.isActive}
              onCheckedChange={(value) => setDraft((prev) => ({ ...prev, isActive: value }))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <Button asChild type="button" variant="outline">
              <Link href={returnTo}>Cancel</Link>
            </Button>
            <Button type="button" className="bg-accent text-accent-foreground" onClick={handleSubmit}>
              {isEditing ? 'Save changes' : 'Create event'}
            </Button>
          </div>
          </div>
        </CardContent>
      </Card>

      <CrudModal
        open={addOnModalOpen}
        onOpenChange={setAddOnModalOpen}
        title="Link add-on"
        description={
          selectedAddOnForModal
            ? `Configure how "${selectedAddOnForModal.name}" is priced for this event.`
            : 'Configure how this add-on is priced for this event.'
        }
        size="sm"
        variant="create"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setAddOnModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmAddOnLink}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Add-on</Label>
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm font-medium">
              {selectedAddOnForModal?.name ?? 'Select an add-on first'}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-addon-quantity">Quantity</Label>
            <Input
              id="link-addon-quantity"
              type="number"
              min={1}
              value={pendingAddOnQuantity}
              onChange={(event) => setPendingAddOnQuantity(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-addon-price">Price</Label>
            <Input
              id="link-addon-price"
              type="number"
              min={0}
              step="0.01"
              value={pendingAddOnUnitPrice}
              disabled={pendingAddOnIsFree}
              onChange={(event) => setPendingAddOnUnitPrice(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
            <span className="text-sm font-medium text-foreground">Free</span>
            <Switch
              checked={pendingAddOnIsFree}
              onCheckedChange={(value) => setPendingAddOnIsFree(value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Charge frequency</Label>
            <Select
              value={pendingAddOnChargeFrequency}
              onValueChange={(value) => setPendingAddOnChargeFrequency(value as CategoryAddOnChargeFrequency)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ADD_ON_CHARGE_FREQUENCIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CrudModal>
    </div>
  )
}

export default function AdminSchedulingServiceNewPage() {
  return (
    <Suspense>
      <AdminSchedulingServiceNewPageInner />
    </Suspense>
  )
}
