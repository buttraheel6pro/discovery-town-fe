/** Learn-specific service create/edit form — tutoring, test prep, enrichment fields. */
'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  GRADE_LEVEL_OPTIONS,
  isLearnServiceType,
  LEARNING_FORMAT_OPTIONS,
  LEARN_SERVICE_TYPES,
  PROGRAM_TERM_OPTIONS,
  SUBJECT_AREA_OPTIONS,
} from '@/lib/learn-catalog'
import { locations } from '@/lib/mock-data'
import { newAdminEntityId } from '@/lib/scheduling-admin-builders'
import { getSchedulingTopLevelId } from '@/lib/scheduling-consumer-categories'
import { useScheduling } from '@/lib/scheduling-store'
import type {
  GradeLevel,
  LearningFormat,
  ProgramTerm,
  SchedulingService,
  SchedulingServiceType,
  SubjectArea,
} from '@/lib/types'
import { EventBookingScheduleModeEnum } from '@/lib/types'

function parseOptionalFloat(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? parsed : null
}

interface LearnServiceDraft {
  readonly categoryId: string
  readonly serviceType: SchedulingServiceType
  readonly locationId: string
  readonly name: string
  readonly description: string
  readonly basePrice: string
  readonly capacity: string
  readonly durationMinutes: string
  readonly minSeats: string
  readonly subscriptionPrice: string
  readonly ageMin: string
  readonly ageMax: string
  readonly requiresWaiver: boolean
  readonly minAdvanceHours: string
  readonly gradeLevel: GradeLevel
  readonly subjectArea: SubjectArea
  readonly learningFormat: LearningFormat
  readonly instructorName: string
  readonly programTerm: ProgramTerm
  readonly programYear: string
  readonly programStartDate: string
  readonly programEndDate: string
  readonly trialSessionAvailable: boolean
  readonly trialSessionPrice: string
  readonly isActive: boolean
}

function draftFromService(service: SchedulingService): LearnServiceDraft {
  return {
    categoryId: service.categoryId,
    serviceType: service.serviceType,
    locationId: service.locationId ?? locations[0]?.id ?? 'loc-1',
    name: service.name,
    description: service.description ?? '',
    basePrice: String(service.basePrice),
    capacity: String(service.capacity),
    durationMinutes: String(service.durationMinutes),
    minSeats: service.minSeats != null ? String(service.minSeats) : '1',
    subscriptionPrice:
      service.subscriptionPrice != null ? String(service.subscriptionPrice) : '',
    ageMin: service.ageMin != null ? String(service.ageMin) : '',
    ageMax: service.ageMax != null ? String(service.ageMax) : '',
    requiresWaiver: Boolean(service.requiresWaiver),
    minAdvanceHours:
      service.minAdvanceHours != null ? String(service.minAdvanceHours) : '24',
    gradeLevel: service.gradeLevel ?? 'All',
    subjectArea: service.subjectArea ?? 'Other',
    learningFormat: service.learningFormat ?? 'small-group',
    instructorName: service.instructorName ?? '',
    programTerm: service.programTerm ?? 'Fall',
    programYear: service.programYear != null ? String(service.programYear) : String(new Date().getFullYear()),
    programStartDate: service.programStartDate ?? '',
    programEndDate: service.programEndDate ?? '',
    trialSessionAvailable: Boolean(service.trialSessionAvailable),
    trialSessionPrice:
      service.trialSessionPrice != null ? String(service.trialSessionPrice) : '',
    isActive: service.isActive,
  }
}

const emptyDraft = (): LearnServiceDraft => ({
  categoryId: 'cat-learn-elementary',
  serviceType: 'TUTORING_SESSION',
  locationId: locations[0]?.id ?? 'loc-1',
  name: '',
  description: '',
  basePrice: '',
  capacity: '6',
  durationMinutes: '60',
  minSeats: '1',
  subscriptionPrice: '',
  ageMin: '',
  ageMax: '',
  requiresWaiver: false,
  minAdvanceHours: '24',
  gradeLevel: 'All',
  subjectArea: 'Math',
  learningFormat: 'small-group',
  instructorName: '',
  programTerm: 'Fall',
  programYear: String(new Date().getFullYear()),
  programStartDate: '',
  programEndDate: '',
  trialSessionAvailable: false,
  trialSessionPrice: '',
  isActive: true,
})

export interface LearnServiceFormProps {
  readonly editingService?: SchedulingService | null
  readonly initialCategoryId?: string
  readonly initialServiceType?: SchedulingServiceType
  readonly returnTo?: string
}

export function LearnServiceForm({
  editingService = null,
  initialCategoryId = '',
  initialServiceType,
  returnTo = '/admin/learn/services',
}: LearnServiceFormProps) {
  const router = useRouter()
  const { documents } = useClients()
  const { categories, addService, updateService } = useScheduling()
  const isEditing = Boolean(editingService)

  const learnCategories = useMemo(
    () =>
      categories
        .filter((category) => getSchedulingTopLevelId(category.id) === 'LEARN')
        .slice()
        .sort((left, right) => left.displayOrder - right.displayOrder),
    [categories],
  )

  const [draft, setDraft] = useState<LearnServiceDraft>(() => {
    if (editingService) {
      return draftFromService(editingService)
    }
    const categoryId =
      initialCategoryId &&
      learnCategories.some((category) => category.id === initialCategoryId)
        ? initialCategoryId
        : (learnCategories[0]?.id ?? 'cat-learn-elementary')
    return {
      ...emptyDraft(),
      categoryId,
      ...(initialServiceType && isLearnServiceType(initialServiceType)
        ? { serviceType: initialServiceType }
        : {}),
    }
  })

  const selectedCategory = useMemo(
    () => learnCategories.find((category) => category.id === draft.categoryId) ?? null,
    [draft.categoryId, learnCategories],
  )

  const waiverDocs = useMemo(
    () => documents.filter((document) => document.documentType === 'WAIVER'),
    [documents],
  )

  function handleSubmit(): void {
    const basePrice = Number.parseFloat(draft.basePrice)
    const capacity = Number.parseInt(draft.capacity, 10)
    const durationMinutes = Number.parseInt(draft.durationMinutes, 10)
    const subscriptionPrice = parseOptionalFloat(draft.subscriptionPrice)
    const ageMin = parseOptionalInt(draft.ageMin)
    const ageMax = parseOptionalInt(draft.ageMax)
    const minSeatsParsed = parseOptionalInt(draft.minSeats)
    const minSeats = minSeatsParsed != null && minSeatsParsed >= 1 ? minSeatsParsed : 1
    const minAdvanceHours = parseOptionalInt(draft.minAdvanceHours) ?? 24
    const programYear = parseOptionalInt(draft.programYear) ?? new Date().getFullYear()
    const trialSessionPrice = draft.trialSessionAvailable
      ? parseOptionalFloat(draft.trialSessionPrice)
      : null

    if (
      !selectedCategory ||
      !draft.name.trim() ||
      !Number.isFinite(basePrice) ||
      !Number.isFinite(capacity) ||
      !Number.isFinite(durationMinutes)
    ) {
      return
    }

    const learnFields = {
      gradeLevel: draft.gradeLevel,
      subjectArea: draft.subjectArea,
      learningFormat: draft.learningFormat,
      instructorName: draft.instructorName.trim() || undefined,
      programTerm: draft.programTerm,
      programYear,
      programStartDate: draft.programStartDate.trim() || undefined,
      programEndDate: draft.programEndDate.trim() || undefined,
      trialSessionAvailable: draft.trialSessionAvailable,
      trialSessionPrice,
      level: 'All Levels' as const,
    }

    if (isEditing && editingService) {
      updateService(editingService.id, {
        locationId: draft.locationId.trim() || null,
        categoryId: selectedCategory.id,
        category: { ...selectedCategory },
        serviceType: draft.serviceType,
        bookingMode: 'SCHEDULED',
        eventType: 'PUBLIC',
        bookingOfferingKind: 'SERVICE',
        name: draft.name.trim(),
        description: draft.description.trim() || '—',
        durationMinutes,
        capacity,
        basePrice,
        subscriptionPrice,
        requiresWaiver: draft.requiresWaiver,
        ageMin,
        ageMax,
        isActive: draft.isActive,
        minAdvanceHours,
        maxAdvanceHours: 2160,
        pricingModel: 'per_person',
        minSeats,
        eventBookingScheduleMode: EventBookingScheduleModeEnum.PER_EVENT,
        ...learnFields,
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
      bookingMode: 'SCHEDULED',
      name: draft.name.trim(),
      description: draft.description.trim() || '—',
      durationMinutes,
      capacity,
      basePrice,
      subscriptionPrice,
      requiresWaiver: draft.requiresWaiver,
      ageMin,
      ageMax,
      isActive: draft.isActive,
      minDurationMinutes: null,
      maxDurationMinutes: null,
      slotIncrementMinutes: null,
      maxConcurrent: null,
      minAdvanceHours,
      maxAdvanceHours: 2160,
      pricingModel: 'per_person',
      imageUrl: '/images/hero-sports.jpg',
      tags: ['learn'],
      addOns: [],
      minSeats,
      eventBookingScheduleMode: EventBookingScheduleModeEnum.PER_EVENT,
      ...learnFields,
    }

    addService(created)

    const redirectParams = new URLSearchParams({
      serviceId: createdServiceId,
      returnTo,
    })
    if (draft.programStartDate.trim()) {
      redirectParams.set('rangeStart', draft.programStartDate.trim())
    }
    if (draft.programEndDate.trim()) {
      redirectParams.set('rangeEnd', draft.programEndDate.trim())
    }
    router.push(`/admin/scheduling/new/recurring?${redirectParams.toString()}`)
  }

  return (
    <Card className="gap-0 border-border py-0 shadow-sm">
      <CardHeader className="gap-0.5 border-b border-border px-4 py-2.5 sm:px-6">
        <CardTitle className="text-sm font-semibold sm:text-base">
          {isEditing ? 'Edit learn program' : 'New learn program'}
        </CardTitle>
        <CardDescription className="text-xs leading-snug text-muted-foreground sm:text-sm">
          {isEditing
            ? 'Update tutoring, test prep, or enrichment program details.'
            : 'Create a program — you will be prompted to generate recurring sessions next.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-4 pb-8 pt-3 sm:px-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value="learn" disabled>
              <SelectTrigger className="w-full">
                <SelectValue>Learn</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="learn">Learn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sub-category</Label>
            <Select
              value={draft.categoryId}
              onValueChange={(value) => setDraft((prev) => ({ ...prev, categoryId: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sub-category" />
              </SelectTrigger>
              <SelectContent>
                {learnCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Program type</Label>
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
                {LEARN_SERVICE_TYPES.map((serviceType) => (
                  <SelectItem key={serviceType} value={serviceType}>
                    {serviceType.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Programs belong to the Learn catalog. Manage sub-categories under Learn admin.
        </p>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Location</Label>
            <Select
              value={draft.locationId}
              onValueChange={(value) => setDraft((prev) => ({ ...prev, locationId: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
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
          <div className="space-y-2">
            <Label>Instructor</Label>
            <Input
              value={draft.instructorName}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, instructorName: event.target.value }))
              }
              placeholder="e.g. Dr. Emily Carter"
            />
          </div>
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

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Grade level</Label>
            <Select
              value={draft.gradeLevel}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, gradeLevel: value as GradeLevel }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVEL_OPTIONS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject area</Label>
            <Select
              value={draft.subjectArea}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, subjectArea: value as SubjectArea }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_AREA_OPTIONS.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Learning format</Label>
            <Select
              value={draft.learningFormat}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, learningFormat: value as LearningFormat }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEARNING_FORMAT_OPTIONS.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Program term</Label>
            <Select
              value={draft.programTerm}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, programTerm: value as ProgramTerm }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROGRAM_TERM_OPTIONS.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Program year</Label>
            <Input
              type="number"
              value={draft.programYear}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, programYear: event.target.value }))
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
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Program start date</Label>
            <Input
              type="date"
              value={draft.programStartDate}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, programStartDate: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Program end date</Label>
            <Input
              type="date"
              value={draft.programEndDate}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, programEndDate: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Base price (per session)</Label>
            <Input
              type="number"
              step="0.01"
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
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Subscription price (optional)</Label>
            <Input
              type="number"
              step="0.01"
              value={draft.subscriptionPrice}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, subscriptionPrice: event.target.value }))
              }
            />
          </div>
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

        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <Label>Trial session available</Label>
            <Switch
              checked={draft.trialSessionAvailable}
              onCheckedChange={(value) =>
                setDraft((prev) => ({ ...prev, trialSessionAvailable: value }))
              }
            />
          </div>
          {draft.trialSessionAvailable ? (
            <div className="space-y-2">
              <Label>Trial session price</Label>
              <Input
                type="number"
                step="0.01"
                value={draft.trialSessionPrice}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, trialSessionPrice: event.target.value }))
                }
              />
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
          <span className="text-sm font-semibold text-foreground">Requires waiver</span>
          <Switch
            checked={draft.requiresWaiver}
            onCheckedChange={(value) =>
              setDraft((prev) => ({ ...prev, requiresWaiver: value }))
            }
          />
        </div>

        {draft.requiresWaiver && waiverDocs.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No waiver documents exist yet. Create them in Admin → Waivers.
          </p>
        ) : null}

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
          <Button
            type="button"
            className="bg-accent text-accent-foreground"
            onClick={handleSubmit}
          >
            {isEditing ? 'Save changes' : 'Create program'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
