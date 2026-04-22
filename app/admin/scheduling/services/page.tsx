/** Admin scheduling services — categories and service catalog backed by SchedulingProvider. */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

import { Baby, ChevronsUpDown, CreditCard, GripVertical, Lock, MoreHorizontal, Plus } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { BookingModeBadge } from '@/components/admin/booking-mode-badge'
import { CategoryAddOnManager } from '@/components/admin/category-add-on-manager'
import { CrudModal } from '@/components/admin/crud-modal'
import { EventTypeBadge } from '@/components/admin/event-type-badge'
import { EventTypeSelector } from '@/components/admin/event-type-selector'
import { ServicePackageLinker } from '@/components/admin/service-package-linker'
import { ServiceTypeBadge } from '@/components/customer/service-type-badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useClients } from '@/lib/client-store'
import {
  newAdminEntityId,
} from '@/lib/scheduling-admin-builders'
import { LABELS } from '@/lib/constants/ui-labels'
import { locations, samplePreschoolAddOns } from '@/lib/mock-data'
import { useInventory } from '@/lib/inventory-store'
import { isCurrentCatalogService } from '@/lib/scheduling-visibility'
import { useScheduling } from '@/lib/scheduling-store'
import { bookingAddOnToSchedulingAddOn, cn, formatPrice, getAgeRangeLabel } from '@/lib/utils'
import type {
  SchedulingBookingMode,
  SchedulingCategory,
  EventPackage,
  EventVisibility,
  SchedulingService,
  SchedulingServiceAddOn,
  SchedulingServiceType,
} from '@/lib/types'
import { SchedulingServiceTypeEnum } from '@/lib/types'

type EditDraft = {
  locationId: string
  name: string
  description: string
  subscriptionPrice: string
  requiresWaiver: boolean
  requiredDocumentIds: string[]
  ageMin: string
  ageMax: string
  basePrice: string
  capacity: string
  durationMinutes: string
  isActive: boolean
  eventType: EventVisibility
  minDurationMinutes: string
  maxDurationMinutes: string
  slotIncrementMinutes: string
  maxConcurrent: string
  minAdvanceHours: string
  maxAdvanceHours: string
  siblingPrice: string
  freeAdultCount: string
  additionalAdultPrice: string
  minSeats: string
  pricePerHour: string
  minChildSeats: string
  maxChildSeats: string
  minAdultSeats: string
  maxAdultSeats: string
  additionalChildPrice: string
  isPackageService: boolean
}

type CreateDraft = EditDraft & {
  categoryId: string
  serviceType: SchedulingServiceType
  bookingMode: SchedulingBookingMode
  eventType: EventVisibility
  pendingServiceAddOnLinks: { addOnId: string; isFree: boolean }[]
}

type CategoryDraft = {
  parentTopLevelId: SchedulingTopLevelId
  name: string
  icon: string
  displayOrder: string
  isActive: boolean
  description: string
  requiresAttendee: boolean
  membersOnly: boolean
  freeInfantMonths: string
  depositPercent: string
  specialInstructionsEnabled: boolean
  waitlistEnabled: boolean
  allowFamilyMember: boolean
  requireCheckInBeforeRebook: boolean
  pendingAddOnLinks: { addOnId: string; isFree: boolean }[]
}

const allServiceTypes = Object.values(SchedulingServiceTypeEnum)
const SCHEDULING_TOP_LEVEL_ORDER = ['GYM', 'PLAY', 'EVENT'] as const
type SchedulingTopLevelId = (typeof SCHEDULING_TOP_LEVEL_ORDER)[number]

const PLAY_CATEGORY_IDS = new Set<string>([
  'cat-open-play',
  'cat-private-play',
  'cat-camps-play',
  'cat-special-play-events',
  'cat-parents-night',
  'cat-field-trips',
  'cat-we-bring-play',
])

function getSchedulingTopLevelId(categoryId: string): SchedulingTopLevelId {
  if (categoryId.startsWith('cat-gym-')) {
    return 'GYM'
  }
  if (PLAY_CATEGORY_IDS.has(categoryId) || categoryId.startsWith('cat-play-')) {
    return 'PLAY'
  }
  return 'EVENT'
}

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

function slugifyCategoryName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function getSchedulingTopLevelLabel(topLevelId: SchedulingTopLevelId): string {
  switch (topLevelId) {
    case 'GYM':
      return 'Gym'
    case 'PLAY':
      return 'Play'
    case 'EVENT':
      return 'Event'
    default:
      return 'Event'
  }
}

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

export default function AdminSchedulingServicesPage() {
  const { documents } = useClients()
  const { bookingAddOns } = useInventory()
  const {
    categories,
    addCategory,
    removeCategory,
    updateCategory,
    services,
    addService,
    updateService,
    packages,
    addPackage,
    updatePackage,
    removePackage,
    duplicatePackage,
    linkSchedulingAddOn,
    unlinkSchedulingAddOn,
    setSchedulingAddOnFree,
  } = useScheduling()
  const sortedCategories = useMemo<SchedulingCategory[]>(() => {
    return categories
      .filter((category) => isConsumerAlignedCategoryId(category.id))
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }, [categories])

  const alignedServices = useMemo<SchedulingService[]>(() => {
    return services.filter(
      (service) =>
        isConsumerAlignedCategoryId(service.categoryId) &&
        isCurrentCatalogService(service.id),
    )
  }, [services])

  const [categoryId, setCategoryId] = useState<string>(sortedCategories[0]?.id ?? '')
  const [serviceCategoryFilterId, setServiceCategoryFilterId] = useState<string | 'ALL'>('ALL')
  const [selected, setSelected] = useState<SchedulingService | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null)
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null)
  const [packageOpen, setPackageOpen] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [packageName, setPackageName] = useState('')
  const [packageTier, setPackageTier] = useState<'SILVER' | 'GOLD' | 'PLATINUM'>('SILVER')
  const [packageBasePrice, setPackageBasePrice] = useState('0')
  const [packageFeatures, setPackageFeatures] = useState('')
  const [packageIsActive, setPackageIsActive] = useState(true)
  const [packageDepositAmount, setPackageDepositAmount] = useState('')
  const [packageIsWholeVenue, setPackageIsWholeVenue] = useState(false)
  const [packageRequiresApproval, setPackageRequiresApproval] = useState(false)
  const [packageMinChild, setPackageMinChild] = useState('')
  const [packageMaxChild, setPackageMaxChild] = useState('')
  const [packageMinAdult, setPackageMinAdult] = useState('')
  const [packageMaxAdult, setPackageMaxAdult] = useState('')
  const [packageAdditionalChildPrice, setPackageAdditionalChildPrice] = useState('')
  const [packageDuration, setPackageDuration] = useState('')
  const [packageSetupTime, setPackageSetupTime] = useState('')
  const [packageStaffCount, setPackageStaffCount] = useState('')
  const [packagePartyRooms, setPackagePartyRooms] = useState('')
  const [packageDisableConfirmOpen, setPackageDisableConfirmOpen] = useState(false)
  const [categoryAddOnOpen, setCategoryAddOnOpen] = useState(false)
  const [createAddOnOpen, setCreateAddOnOpen] = useState(false)
  const [editAddOnOpen, setEditAddOnOpen] = useState(false)
  const [editDraft, setEditDraft] = useState<EditDraft>({
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
    durationMinutes: '',
    isActive: true,
    eventType: 'PUBLIC',
    minDurationMinutes: '',
    maxDurationMinutes: '',
    slotIncrementMinutes: '',
    maxConcurrent: '',
    minAdvanceHours: '',
    maxAdvanceHours: '',
    siblingPrice: '',
    freeAdultCount: '2',
    additionalAdultPrice: '',
    minSeats: '1',
    pricePerHour: '',
    minChildSeats: '',
    maxChildSeats: '',
    minAdultSeats: '',
    maxAdultSeats: '',
    additionalChildPrice: '',
    isPackageService: false,
  })
  const [createDraft, setCreateDraft] = useState<CreateDraft>({
    categoryId: sortedCategories[0]?.id ?? '',
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
    isActive: true,
    minDurationMinutes: '',
    maxDurationMinutes: '',
    slotIncrementMinutes: '',
    maxConcurrent: '',
    minAdvanceHours: '',
    maxAdvanceHours: '',
    siblingPrice: '',
    freeAdultCount: '2',
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
  })

  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>({
    parentTopLevelId: 'GYM',
    name: '',
    icon: '',
    displayOrder: String((sortedCategories[sortedCategories.length - 1]?.displayOrder ?? 0) + 1),
    isActive: true,
    description: '',
    requiresAttendee: false,
    membersOnly: false,
    freeInfantMonths: '',
    depositPercent: '',
    specialInstructionsEnabled: false,
    waitlistEnabled: true,
    allowFamilyMember: false,
    requireCheckInBeforeRebook: false,
    pendingAddOnLinks: [],
  })

  useEffect(() => {
    if (!sortedCategories.length) return
    const hasCurrent = sortedCategories.some((category) => category.id === categoryId)
    if (!hasCurrent) {
      setCategoryId(sortedCategories[0].id)
      setCreateDraft((draft) => ({ ...draft, categoryId: sortedCategories[0].id }))
    }
  }, [categoryId, sortedCategories])

  useEffect(() => {
    if (serviceCategoryFilterId === 'ALL') return
    const exists = sortedCategories.some((category) => category.id === serviceCategoryFilterId)
    if (!exists) {
      setServiceCategoryFilterId('ALL')
    }
  }, [serviceCategoryFilterId, sortedCategories])

  const filtered = useMemo(() => {
    return alignedServices.filter((service) => {
      if (serviceCategoryFilterId !== 'ALL' && service.categoryId !== serviceCategoryFilterId) {
        return false
      }
      return true
    })
  }, [alignedServices, serviceCategoryFilterId])

  const categoriesByTopLevel = useMemo<Record<SchedulingTopLevelId, SchedulingCategory[]>>(() => {
    const grouped: Record<SchedulingTopLevelId, SchedulingCategory[]> = {
      GYM: [],
      PLAY: [],
      EVENT: [],
    }
    for (const category of sortedCategories) {
      grouped[getSchedulingTopLevelId(category.id)].push(category)
    }
    return grouped
  }, [sortedCategories])

  const totalServicesByTopLevel = useMemo<Record<SchedulingTopLevelId, number>>(() => {
    const counts: Record<SchedulingTopLevelId, number> = {
      GYM: 0,
      PLAY: 0,
      EVENT: 0,
    }
    for (const service of alignedServices) {
      counts[getSchedulingTopLevelId(service.categoryId)] += 1
    }
    return counts
  }, [alignedServices])

  useEffect(() => {
    if (!selected) return
    setEditDraft({
      locationId: selected.locationId ?? locations[0]?.id ?? 'loc-1',
      name: selected.name,
      description: selected.description ?? '',
      subscriptionPrice: selected.subscriptionPrice != null ? String(selected.subscriptionPrice) : '',
      requiresWaiver: selected.requiresWaiver,
      requiredDocumentIds: selected.requiredDocumentIds?.slice() ?? [],
      ageMin: selected.ageMin != null ? String(selected.ageMin) : '',
      ageMax: selected.ageMax != null ? String(selected.ageMax) : '',
      basePrice: String(selected.basePrice),
      capacity: String(selected.capacity),
      durationMinutes: String(selected.durationMinutes),
      isActive: selected.isActive,
      eventType: selected.eventType ?? 'PUBLIC',
      minDurationMinutes:
        selected.minDurationMinutes != null ? String(selected.minDurationMinutes) : '',
      maxDurationMinutes:
        selected.maxDurationMinutes != null ? String(selected.maxDurationMinutes) : '',
      slotIncrementMinutes:
        selected.slotIncrementMinutes != null ? String(selected.slotIncrementMinutes) : '',
      maxConcurrent: selected.maxConcurrent != null ? String(selected.maxConcurrent) : '',
      minAdvanceHours: selected.minAdvanceHours != null ? String(selected.minAdvanceHours) : '',
      maxAdvanceHours: selected.maxAdvanceHours != null ? String(selected.maxAdvanceHours) : '',
      siblingPrice: selected.siblingPrice ?? '',
      freeAdultCount:
        selected.freeAdultCount != null ? String(selected.freeAdultCount) : '2',
      additionalAdultPrice: selected.additionalAdultPrice ?? '',
      minSeats: selected.minSeats != null ? String(selected.minSeats) : '1',
      pricePerHour: selected.pricePerHour ?? '',
      minChildSeats: selected.minChildSeats != null ? String(selected.minChildSeats) : '',
      maxChildSeats: selected.maxChildSeats != null ? String(selected.maxChildSeats) : '',
      minAdultSeats: selected.minAdultSeats != null ? String(selected.minAdultSeats) : '',
      maxAdultSeats: selected.maxAdultSeats != null ? String(selected.maxAdultSeats) : '',
      additionalChildPrice: selected.additionalChildPrice ?? '',
      isPackageService: selected.isPackageService ?? false,
    })
  }, [selected])

  const addOnCatalog = useMemo(() => {
    const map = new Map<string, SchedulingServiceAddOn>()
    for (const s of alignedServices) {
      for (const a of s.addOns ?? []) {
        if (a.isActive) {
          map.set(a.id, a)
        }
      }
    }
    for (const a of samplePreschoolAddOns) {
      map.set(a.id, a)
    }
    for (const a of bookingAddOns) {
      if (!a.isActive) continue
      map.set(a.id, bookingAddOnToSchedulingAddOn(a))
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [bookingAddOns, alignedServices])

  const waiverDocs = useMemo(() => {
    return documents.filter((d) => d.documentType === 'WAIVER')
  }, [documents])

  function parseOptionalInt(value: string): number | null {
    const trimmed = value.trim()
    if (!trimmed) return null
    const n = Number.parseInt(trimmed, 10)
    return Number.isFinite(n) ? n : null
  }

  function parseOptionalFloat(value: string): number | null {
    const trimmed = value.trim()
    if (!trimmed) return null
    const n = Number.parseFloat(trimmed)
    return Number.isFinite(n) ? n : null
  }

  const countByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of alignedServices) {
      map.set(s.categoryId, (map.get(s.categoryId) ?? 0) + 1)
    }
    return map
  }, [alignedServices])

  const selectedCategory = useMemo(() => {
    return sortedCategories.find((c) => c.id === categoryId) ?? sortedCategories[0] ?? null
  }, [sortedCategories, categoryId])
  const catalogTitle = useMemo(() => {
    if (serviceCategoryFilterId === 'ALL') {
      return 'Catalog'
    }
    return (
      sortedCategories.find((category) => category.id === serviceCategoryFilterId)?.name ??
      'Catalog'
    )
  }, [serviceCategoryFilterId, sortedCategories])
  const catalogCountLabel = useMemo(() => {
    if (serviceCategoryFilterId !== 'ALL') {
      return `${filtered.length} services`
    }
    const topLevelCount = SCHEDULING_TOP_LEVEL_ORDER.filter(
      (topLevelId) => categoriesByTopLevel[topLevelId].length > 0,
    ).length
    return `${topLevelCount}/${alignedServices.length} services`
  }, [serviceCategoryFilterId, filtered.length, categoriesByTopLevel, alignedServices.length])

  const selectedLive = useMemo(() => {
    if (!selected) return null
    return alignedServices.find((s) => s.id === selected.id) ?? selected
  }, [selected, alignedServices])

  function persistEdit() {
    if (!selected) return
    const basePrice = parseFloat(editDraft.basePrice)
    const capacity = parseInt(editDraft.capacity, 10)
    const durationMinutes = parseInt(editDraft.durationMinutes, 10)
    const subscriptionPrice = parseOptionalFloat(editDraft.subscriptionPrice)
    const ageMin = parseOptionalInt(editDraft.ageMin)
    const ageMax = parseOptionalInt(editDraft.ageMax)
    const minDurationMinutes = parseOptionalInt(editDraft.minDurationMinutes)
    const maxDurationMinutes = parseOptionalInt(editDraft.maxDurationMinutes)
    const slotIncrementMinutes = parseOptionalInt(editDraft.slotIncrementMinutes)
    const maxConcurrent = parseOptionalInt(editDraft.maxConcurrent)
    const minAdvanceHours = parseOptionalInt(editDraft.minAdvanceHours)
    const maxAdvanceHours = parseOptionalInt(editDraft.maxAdvanceHours)
    const freeAdultParsed = parseOptionalInt(editDraft.freeAdultCount)
    const freeAdultCount =
      freeAdultParsed != null && freeAdultParsed >= 0 && freeAdultParsed <= 20
        ? freeAdultParsed
        : 2
    const minSeatsParsed = parseOptionalInt(editDraft.minSeats)
    const minSeats = minSeatsParsed != null && minSeatsParsed >= 1 ? minSeatsParsed : 1
    const minChildSeats = parseOptionalInt(editDraft.minChildSeats)
    const maxChildSeats = parseOptionalInt(editDraft.maxChildSeats)
    const minAdultSeats = parseOptionalInt(editDraft.minAdultSeats)
    const maxAdultSeats = parseOptionalInt(editDraft.maxAdultSeats)
    if (
      !editDraft.name.trim() ||
      !Number.isFinite(basePrice) ||
      !Number.isFinite(capacity) ||
      !Number.isFinite(durationMinutes)
    ) {
      return
    }
    const servicePatch: Partial<SchedulingService> = {
      locationId: editDraft.locationId.trim() || null,
      name: editDraft.name.trim(),
      description: editDraft.description.trim() || null,
      subscriptionPrice,
      requiresWaiver: editDraft.requiresWaiver,
      requiredDocumentIds: editDraft.requiresWaiver ? editDraft.requiredDocumentIds.slice() : [],
      ageMin,
      ageMax,
      basePrice,
      capacity,
      durationMinutes,
      isActive: editDraft.isActive,
      eventType: editDraft.eventType,
      minDurationMinutes,
      maxDurationMinutes,
      slotIncrementMinutes,
      maxConcurrent,
      minAdvanceHours,
      maxAdvanceHours,
      siblingPrice: editDraft.siblingPrice.trim() || undefined,
      freeAdultCount,
      additionalAdultPrice: editDraft.additionalAdultPrice.trim() || undefined,
      minSeats,
      pricePerHour: editDraft.pricePerHour.trim() || undefined,
      minChildSeats: minChildSeats ?? undefined,
      maxChildSeats: maxChildSeats ?? undefined,
      minAdultSeats: minAdultSeats ?? undefined,
      maxAdultSeats: maxAdultSeats ?? undefined,
      additionalChildPrice: editDraft.additionalChildPrice.trim() || undefined,
      isPackageService: editDraft.isPackageService,
    }
    updateService(selected.id, servicePatch)
    setSelected(null)
  }

  function openEditPackage(pkgId: string) {
    const pkg = packages.find((p) => p.id === pkgId) ?? null
    if (!pkg) return
    setSelectedPackageId(pkg.id)
    setPackageName(pkg.name)
    setPackageTier(pkg.tier)
    setPackageBasePrice(String(pkg.basePrice))
    setPackageFeatures(pkg.features.join('\n'))
    setPackageIsActive(pkg.isActive)
    setPackageDepositAmount(pkg.depositAmount != null ? String(pkg.depositAmount) : '')
    setPackageIsWholeVenue(Boolean(pkg.isWholeVenue))
    setPackageRequiresApproval(Boolean(pkg.requiresApproval))
    setPackageMinChild(pkg.minChildSeats != null ? String(pkg.minChildSeats) : '')
    setPackageMaxChild(pkg.maxChildSeats != null ? String(pkg.maxChildSeats) : '')
    setPackageMinAdult(pkg.minAdultSeats != null ? String(pkg.minAdultSeats) : '')
    setPackageMaxAdult(pkg.maxAdultSeats != null ? String(pkg.maxAdultSeats) : '')
    setPackageAdditionalChildPrice(
      pkg.additionalChildPrice != null ? String(pkg.additionalChildPrice) : '',
    )
    setPackageDuration(pkg.duration != null ? String(pkg.duration) : '')
    setPackageSetupTime(pkg.setupTime != null ? String(pkg.setupTime) : '')
    setPackageStaffCount(pkg.staffCount != null ? String(pkg.staffCount) : '')
    setPackagePartyRooms(pkg.partyRooms != null ? String(pkg.partyRooms) : '')
    setPackageOpen(true)
  }

  function persistPackage() {
    if (!selected) return
    const basePrice = Number.parseFloat(packageBasePrice)
    if (!packageName.trim() || !Number.isFinite(basePrice)) return

    const features = packageFeatures
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const depositAmount = parseOptionalFloat(packageDepositAmount)
    const minChildSeats = parseOptionalInt(packageMinChild)
    const maxChildSeats = parseOptionalInt(packageMaxChild)
    const minAdultSeats = parseOptionalInt(packageMinAdult)
    const maxAdultSeats = parseOptionalInt(packageMaxAdult)
    const additionalChildPrice = parseOptionalFloat(packageAdditionalChildPrice)
    const duration = parseOptionalInt(packageDuration)
    const setupTime = parseOptionalInt(packageSetupTime)
    const staffCount = parseOptionalInt(packageStaffCount)
    const partyRooms = parseOptionalInt(packagePartyRooms)

    const extended = {
      depositAmount: depositAmount ?? undefined,
      isWholeVenue: packageIsWholeVenue,
      requiresApproval: packageIsWholeVenue ? packageRequiresApproval : false,
      minChildSeats: minChildSeats ?? undefined,
      maxChildSeats: maxChildSeats ?? undefined,
      minAdultSeats: minAdultSeats ?? undefined,
      maxAdultSeats: maxAdultSeats ?? undefined,
      additionalChildPrice: additionalChildPrice ?? undefined,
      duration: duration ?? undefined,
      setupTime: setupTime ?? undefined,
      staffCount: staffCount ?? undefined,
      partyRooms: partyRooms ?? undefined,
    }

    if (selectedPackageId) {
      updatePackage(selectedPackageId, {
        name: packageName.trim(),
        tier: packageTier,
        basePrice,
        features,
        isActive: packageIsActive,
        ...extended,
      })
      setPackageOpen(false)
      return
    }

    const created: EventPackage = {
      id: `pkg-${Math.random().toString(16).slice(2, 10)}`,
      serviceId: selected.id,
      tier: packageTier,
      name: packageName.trim(),
      basePrice,
      features,
      addOns: [],
      isActive: packageIsActive,
      createdAt: new Date().toISOString(),
      ...extended,
    }
    addPackage(created)
    setPackageOpen(false)
  }

  function buildServiceForCategory(input: {
    id: string
    category: SchedulingCategory
    categoryId: string
    serviceType: SchedulingServiceType
    bookingMode: SchedulingBookingMode
    eventType: EventVisibility
    locationId: string | null
    name: string
    description: string
    subscriptionPrice: number | null
    requiresWaiver: boolean
    requiredDocumentIds: string[]
    ageMin: number | null
    ageMax: number | null
    basePrice: number
    capacity: number
    durationMinutes: number
    imageUrl: string | null
    isActive: boolean
    minDurationMinutes: number | null
    maxDurationMinutes: number | null
    slotIncrementMinutes: number | null
    maxConcurrent: number | null
    minAdvanceHours: number | null
    maxAdvanceHours: number | null
    siblingPrice?: string
    freeAdultCount: number
    additionalAdultPrice?: string
    minSeats: number
    pricePerHour?: string
    minChildSeats?: number
    maxChildSeats?: number
    minAdultSeats?: number
    maxAdultSeats?: number
    additionalChildPrice?: string
    isPackageService: boolean
    pendingServiceAddOnLinks: { addOnId: string; isFree: boolean }[]
  }): SchedulingService {
    const pricingModel = input.bookingMode === 'OPEN' ? 'per_hour' : 'flat'
    const linkedAddOns = input.pendingServiceAddOnLinks.map((l) => ({
      id: newAdminEntityId('cao'),
      categoryId: input.id,
      addOnId: l.addOnId,
      isOptional: true,
      isFree: l.isFree,
    }))
    return {
      id: input.id,
      locationId: input.locationId,
      categoryId: input.categoryId,
      category: { ...input.category },
      serviceType: input.serviceType,
      bookingMode: input.bookingMode,
      eventType: input.eventType,
      name: input.name,
      description: input.description,
      durationMinutes: input.durationMinutes,
      capacity: input.capacity,
      basePrice: input.basePrice,
      subscriptionPrice: input.subscriptionPrice,
      requiresWaiver: input.requiresWaiver,
      requiredDocumentIds: input.requiredDocumentIds.slice(),
      ageMin: input.ageMin,
      ageMax: input.ageMax,
      isActive: input.isActive,
      minDurationMinutes: input.minDurationMinutes,
      maxDurationMinutes: input.maxDurationMinutes,
      slotIncrementMinutes: input.slotIncrementMinutes,
      maxConcurrent: input.maxConcurrent,
      minAdvanceHours: input.minAdvanceHours,
      maxAdvanceHours: input.maxAdvanceHours,
      pricingModel,
      imageUrl: input.imageUrl,
      tags: [],
      addOns: [],
      siblingPrice: input.siblingPrice,
      freeAdultCount: input.freeAdultCount,
      additionalAdultPrice: input.additionalAdultPrice,
      minSeats: input.minSeats,
      pricePerHour: input.pricePerHour,
      minChildSeats: input.minChildSeats,
      maxChildSeats: input.maxChildSeats,
      minAdultSeats: input.minAdultSeats,
      maxAdultSeats: input.maxAdultSeats,
      additionalChildPrice: input.additionalChildPrice,
      isPackageService: input.isPackageService,
      linkedAddOns,
    }
  }

  function persistCreate() {
    const basePrice = parseFloat(createDraft.basePrice)
    const capacity = parseInt(createDraft.capacity, 10)
    const durationMinutes = parseInt(createDraft.durationMinutes, 10)
    const subscriptionPrice = parseOptionalFloat(createDraft.subscriptionPrice)
    const ageMin = parseOptionalInt(createDraft.ageMin)
    const ageMax = parseOptionalInt(createDraft.ageMax)
    const minDurationMinutes = parseOptionalInt(createDraft.minDurationMinutes)
    const maxDurationMinutes = parseOptionalInt(createDraft.maxDurationMinutes)
    const slotIncrementMinutes = parseOptionalInt(createDraft.slotIncrementMinutes)
    const maxConcurrent = parseOptionalInt(createDraft.maxConcurrent)
    const minAdvanceHours = parseOptionalInt(createDraft.minAdvanceHours)
    const maxAdvanceHours = parseOptionalInt(createDraft.maxAdvanceHours)
    const freeAdultParsedC = parseOptionalInt(createDraft.freeAdultCount)
    const freeAdultCountC =
      freeAdultParsedC != null && freeAdultParsedC >= 0 && freeAdultParsedC <= 20
        ? freeAdultParsedC
        : 2
    const minSeatsParsedC = parseOptionalInt(createDraft.minSeats)
    const minSeatsC = minSeatsParsedC != null && minSeatsParsedC >= 1 ? minSeatsParsedC : 1
    const minChildSeatsC = parseOptionalInt(createDraft.minChildSeats)
    const maxChildSeatsC = parseOptionalInt(createDraft.maxChildSeats)
    const minAdultSeatsC = parseOptionalInt(createDraft.minAdultSeats)
    const maxAdultSeatsC = parseOptionalInt(createDraft.maxAdultSeats)
    if (
      !createDraft.name.trim() ||
      !Number.isFinite(basePrice) ||
      !Number.isFinite(capacity) ||
      !Number.isFinite(durationMinutes)
    ) {
      return
    }
    const category =
      sortedCategories.find((c) => c.id === (createDraft.categoryId || categoryId)) ??
      selectedCategory
    if (!category) return

    const id = newAdminEntityId('svc')
    const created = buildServiceForCategory({
      id,
      categoryId: category.id,
      category,
      serviceType: createDraft.serviceType,
      bookingMode: createDraft.bookingMode,
      eventType: createDraft.eventType,
      locationId: createDraft.locationId.trim() || null,
      name: createDraft.name.trim(),
      description: createDraft.description.trim() || '—',
      subscriptionPrice,
      requiresWaiver: createDraft.requiresWaiver,
      requiredDocumentIds:
        createDraft.requiresWaiver ? createDraft.requiredDocumentIds.slice() : [],
      ageMin,
      ageMax,
      basePrice,
      capacity,
      durationMinutes,
      imageUrl: '/images/hero-sports.jpg',
      isActive: createDraft.isActive,
      minDurationMinutes:
        createDraft.bookingMode === 'OPEN'
          ? minDurationMinutes ?? 60
          : minDurationMinutes,
      maxDurationMinutes:
        createDraft.bookingMode === 'OPEN'
          ? maxDurationMinutes ?? 240
          : maxDurationMinutes,
      slotIncrementMinutes:
        createDraft.bookingMode === 'OPEN'
          ? slotIncrementMinutes ?? 60
          : slotIncrementMinutes,
      maxConcurrent:
        createDraft.bookingMode === 'OPEN'
          ? maxConcurrent ?? 3
          : maxConcurrent,
      minAdvanceHours: minAdvanceHours ?? 0,
      maxAdvanceHours: maxAdvanceHours ?? 168,
      siblingPrice: createDraft.siblingPrice.trim() || undefined,
      freeAdultCount: freeAdultCountC,
      additionalAdultPrice: createDraft.additionalAdultPrice.trim() || undefined,
      minSeats: minSeatsC,
      pricePerHour: createDraft.pricePerHour.trim() || undefined,
      minChildSeats: minChildSeatsC ?? undefined,
      maxChildSeats: maxChildSeatsC ?? undefined,
      minAdultSeats: minAdultSeatsC ?? undefined,
      maxAdultSeats: maxAdultSeatsC ?? undefined,
      additionalChildPrice: createDraft.additionalChildPrice.trim() || undefined,
      isPackageService: createDraft.isPackageService,
      pendingServiceAddOnLinks: createDraft.pendingServiceAddOnLinks.slice(),
    })
    addService(created)
    setCreateOpen(false)
    setCreateDraft({
      categoryId: categoryId,
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
      isActive: true,
      minDurationMinutes: '',
      maxDurationMinutes: '',
      slotIncrementMinutes: '',
      maxConcurrent: '',
      minAdvanceHours: '',
      maxAdvanceHours: '',
      siblingPrice: '',
      freeAdultCount: '2',
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
    })
  }

  function openNewCategory(topLevelId: SchedulingTopLevelId) {
    const siblings = categoriesByTopLevel[topLevelId]
    const nextOrder =
      (siblings[siblings.length - 1]?.displayOrder ??
        sortedCategories[sortedCategories.length - 1]?.displayOrder ??
        0) + 1
    setEditingCategoryId(null)
    setCategoryDraft({
      parentTopLevelId: topLevelId,
      name: '',
      icon: '',
      displayOrder: String(nextOrder),
      isActive: true,
      description: '',
      requiresAttendee: false,
      membersOnly: false,
      freeInfantMonths: '',
      depositPercent: '',
      specialInstructionsEnabled: false,
      waitlistEnabled: true,
      allowFamilyMember: false,
      requireCheckInBeforeRebook: false,
      pendingAddOnLinks: [],
    })
    setCategoryOpen(true)
  }

  function openEditCategory(category: SchedulingCategory) {
    setEditingCategoryId(category.id)
    setCategoryDraft({
      parentTopLevelId: getSchedulingTopLevelId(category.id),
      name: category.name,
      icon: category.icon ?? '',
      displayOrder: String(category.displayOrder),
      isActive: category.isActive,
      description: category.description ?? '',
      requiresAttendee: category.requiresAttendee ?? false,
      membersOnly: category.membersOnly ?? false,
      freeInfantMonths:
        category.freeInfantMonths != null ? String(category.freeInfantMonths) : '',
      depositPercent: category.depositPercent != null ? String(category.depositPercent) : '',
      specialInstructionsEnabled: category.specialInstructionsEnabled ?? false,
      waitlistEnabled: category.waitlistEnabled ?? true,
      allowFamilyMember: category.allowFamilyMember ?? false,
      requireCheckInBeforeRebook: category.requireCheckInBeforeRebook ?? false,
      pendingAddOnLinks: (category.linkedAddOns ?? []).map((link) => ({
        addOnId: link.addOnId,
        isFree: link.isFree,
      })),
    })
    setCategoryOpen(true)
  }

  function reorderCategoriesByDrag(
    topLevelId: SchedulingTopLevelId,
    sourceCategoryId: string,
    targetCategoryId: string,
  ) {
    if (sourceCategoryId === targetCategoryId) return
    const siblings = categoriesByTopLevel[topLevelId]
    const sourceIndex = siblings.findIndex((category) => category.id === sourceCategoryId)
    const targetIndex = siblings.findIndex((category) => category.id === targetCategoryId)
    if (sourceIndex < 0 || targetIndex < 0) return

    const reordered = siblings.slice()
    const [moved] = reordered.splice(sourceIndex, 1)
    if (!moved) return
    reordered.splice(targetIndex, 0, moved)

    const orderedDisplaySlots = siblings
      .map((category) => category.displayOrder)
      .slice()
      .sort((a, b) => a - b)

    reordered.forEach((category, index) => {
      const nextDisplayOrder = orderedDisplaySlots[index] ?? index + 1
      if (category.displayOrder !== nextDisplayOrder) {
        updateCategory(category.id, { displayOrder: nextDisplayOrder })
      }
    })
  }

  function confirmDeleteCategory() {
    if (!deleteCategoryId) return
    const assignedServiceCount = countByCategory.get(deleteCategoryId) ?? 0
    if (assignedServiceCount > 0) {
      setDeleteCategoryId(null)
      return
    }
    removeCategory(deleteCategoryId)
    if (categoryId === deleteCategoryId) {
      const deletedTopLevelId = getSchedulingTopLevelId(deleteCategoryId)
      const fallbackCategory = categoriesByTopLevel[deletedTopLevelId].find(
        (entry) => entry.id !== deleteCategoryId,
      )
      if (fallbackCategory) {
        setCategoryId(fallbackCategory.id)
      }
    }
    setDeleteCategoryId(null)
  }

  function persistCategory() {
    const displayOrder = parseInt(categoryDraft.displayOrder, 10)
    if (!categoryDraft.name.trim() || !Number.isFinite(displayOrder)) return

    const freeInfantMonths =
      categoryDraft.freeInfantMonths.trim().length > 0
        ? Number.parseInt(categoryDraft.freeInfantMonths.trim(), 10)
        : undefined
    const depositPercent =
      categoryDraft.depositPercent.trim().length > 0
        ? Number.parseFloat(categoryDraft.depositPercent.trim())
        : undefined
    const categoryPrefixByTopLevel: Record<SchedulingTopLevelId, string> = {
      GYM: 'cat-gym-',
      PLAY: 'cat-play-',
      EVENT: 'cat-event-',
    }

    if (editingCategoryId) {
      const existingTopLevel = getSchedulingTopLevelId(editingCategoryId)
      const isMovingTopLevel = existingTopLevel !== categoryDraft.parentTopLevelId
      const normalizedPatch = {
        name: categoryDraft.name.trim(),
        icon: categoryDraft.icon.trim() || null,
        displayOrder,
        isActive: categoryDraft.isActive,
        description: categoryDraft.description.trim() || undefined,
        requiresAttendee: categoryDraft.requiresAttendee,
        membersOnly: categoryDraft.membersOnly,
        freeInfantMonths: Number.isFinite(freeInfantMonths ?? Number.NaN)
          ? freeInfantMonths
          : undefined,
        depositPercent: Number.isFinite(depositPercent ?? Number.NaN)
          ? depositPercent
          : undefined,
        specialInstructionsEnabled: categoryDraft.specialInstructionsEnabled,
        waitlistEnabled: categoryDraft.waitlistEnabled,
        allowFamilyMember: categoryDraft.allowFamilyMember,
        requireCheckInBeforeRebook: categoryDraft.requireCheckInBeforeRebook,
      }

      if (!isMovingTopLevel) {
        const linkedAddOns = categoryDraft.pendingAddOnLinks.map((l) => ({
          id: newAdminEntityId('cao'),
          categoryId: editingCategoryId,
          addOnId: l.addOnId,
          isOptional: true,
          isFree: l.isFree,
        }))
        updateCategory(editingCategoryId, {
          ...normalizedPatch,
          linkedAddOns,
        })
      } else {
        const categorySlug =
          slugifyCategoryName(categoryDraft.name) || newAdminEntityId('cat').slice(4)
        const idBase = `${categoryPrefixByTopLevel[categoryDraft.parentTopLevelId]}${categorySlug}`
        const nextCategoryId = categories.some(
          (category) => category.id !== editingCategoryId && category.id === idBase,
        )
          ? `${idBase}-${newAdminEntityId('cat').slice(4)}`
          : idBase

        const movedLinkedAddOns = categoryDraft.pendingAddOnLinks.map((l) => ({
          id: newAdminEntityId('cao'),
          categoryId: nextCategoryId,
          addOnId: l.addOnId,
          isOptional: true,
          isFree: l.isFree,
        }))
        addCategory({
          id: nextCategoryId,
          ...normalizedPatch,
          linkedAddOns: movedLinkedAddOns,
        })

        services
          .filter((service) => service.categoryId === editingCategoryId)
          .forEach((service) => {
            updateService(service.id, { categoryId: nextCategoryId })
          })

        removeCategory(editingCategoryId)

        if (categoryId === editingCategoryId) {
          setCategoryId(nextCategoryId)
        }
        if (serviceCategoryFilterId === editingCategoryId) {
          setServiceCategoryFilterId(nextCategoryId)
        }
        setCreateDraft((draft) =>
          draft.categoryId === editingCategoryId
            ? { ...draft, categoryId: nextCategoryId }
            : draft,
        )
      }
      setCategoryOpen(false)
      setEditingCategoryId(null)
      return
    }

    const categorySlug = slugifyCategoryName(categoryDraft.name) || newAdminEntityId('cat').slice(4)
    const idBase = `${categoryPrefixByTopLevel[categoryDraft.parentTopLevelId]}${categorySlug}`
    const catId = categories.some((category) => category.id === idBase)
      ? `${idBase}-${newAdminEntityId('cat').slice(4)}`
      : idBase
    const linkedAddOns = categoryDraft.pendingAddOnLinks.map((l) => ({
      id: newAdminEntityId('cao'),
      categoryId: catId,
      addOnId: l.addOnId,
      isOptional: true,
      isFree: l.isFree,
    }))
    const created: SchedulingCategory = {
      id: catId,
      name: categoryDraft.name.trim(),
      icon: categoryDraft.icon.trim() || null,
      displayOrder,
      isActive: categoryDraft.isActive,
      description: categoryDraft.description.trim() || undefined,
      requiresAttendee: categoryDraft.requiresAttendee,
      membersOnly: categoryDraft.membersOnly,
      freeInfantMonths: Number.isFinite(freeInfantMonths ?? Number.NaN) ? freeInfantMonths : undefined,
      depositPercent: Number.isFinite(depositPercent ?? Number.NaN) ? depositPercent : undefined,
      specialInstructionsEnabled: categoryDraft.specialInstructionsEnabled,
      waitlistEnabled: categoryDraft.waitlistEnabled,
      allowFamilyMember: categoryDraft.allowFamilyMember,
      requireCheckInBeforeRebook: categoryDraft.requireCheckInBeforeRebook,
      linkedAddOns,
    }
    addCategory(created)
    setCategoryId(created.id)
    setCreateDraft((d) => ({ ...d, categoryId: created.id }))
    setCategoryOpen(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{LABELS.service} catalog</h1>
        <p className="text-muted-foreground mt-2">
          Manage {LABELS.serviceCategory.toLowerCase()} settings and {LABELS.services.toLowerCase()}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">{LABELS.serviceCategory}</CardTitle>
                <CardDescription>Browse by top-level groups and category sections.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  type="button"
                  onClick={() => setServiceCategoryFilterId('ALL')}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors',
                    serviceCategoryFilterId === 'ALL'
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'bg-card hover:bg-secondary',
                  )}
                >
                  All
                  <span className="float-right text-xs text-muted-foreground">
                    {alignedServices.length}
                  </span>
                </button>
                <Accordion type="multiple" className="w-full space-y-2">
                  {SCHEDULING_TOP_LEVEL_ORDER.map((topLevelId) => {
                    const rows = categoriesByTopLevel[topLevelId]
                    if (rows.length === 0) return null
                    return (
                      <AccordionItem
                        key={topLevelId}
                        value={topLevelId}
                        className="overflow-hidden rounded-lg border border-border bg-muted/20 px-3"
                      >
                        <AccordionTrigger
                          className="py-3 text-sm font-semibold text-foreground hover:no-underline"
                        >
                          <span className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                              Type
                            </Badge>
                            <span>{getSchedulingTopLevelLabel(topLevelId)}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {totalServicesByTopLevel[topLevelId]}
                            </Badge>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pb-3">
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                              onClick={() => openNewCategory(topLevelId)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              New sub-category
                            </Button>
                          </div>
                          {rows.map((category) => {
                            const isActiveCategory = category.id === serviceCategoryFilterId
                            const serviceCount = countByCategory.get(category.id) ?? 0
                            return (
                              <div
                                key={category.id}
                                draggable
                                onDragStart={() => {
                                  setDraggingCategoryId(category.id)
                                  setDragOverCategoryId(category.id)
                                }}
                                onDragEnter={(event) => {
                                  event.preventDefault()
                                  setDragOverCategoryId(category.id)
                                }}
                                onDragOver={(event) => {
                                  event.preventDefault()
                                  if (dragOverCategoryId !== category.id) {
                                    setDragOverCategoryId(category.id)
                                  }
                                }}
                                onDrop={(event) => {
                                  event.preventDefault()
                                  if (!draggingCategoryId) return
                                  if (
                                    getSchedulingTopLevelId(draggingCategoryId) !== topLevelId ||
                                    getSchedulingTopLevelId(category.id) !== topLevelId
                                  ) {
                                    return
                                  }
                                  reorderCategoriesByDrag(topLevelId, draggingCategoryId, category.id)
                                  setDraggingCategoryId(null)
                                  setDragOverCategoryId(null)
                                }}
                                onDragEnd={() => {
                                  setDraggingCategoryId(null)
                                  setDragOverCategoryId(null)
                                }}
                                className={cn(
                                  'flex items-center gap-2 rounded-md px-2 py-2 transition-colors',
                                  dragOverCategoryId === category.id &&
                                    draggingCategoryId !== category.id &&
                                    'bg-accent/10',
                                  isActiveCategory
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                                )}
                              >
                                <span
                                  className="cursor-grab text-muted-foreground/90"
                                  aria-label={`Drag ${category.name}`}
                                >
                                  <GripVertical className="h-4 w-4" />
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCategoryId(category.id)
                                    setServiceCategoryFilterId(category.id)
                                  }}
                                  className="min-w-0 flex-1 text-left text-sm font-medium"
                                >
                                  <span className="truncate">{category.name}</span>
                                </button>
                                <Badge variant="outline" className="h-5 text-[10px]">
                                  {serviceCount}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      aria-label={`${category.name} actions`}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => openEditCategory(category)}>
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      variant="destructive"
                                      disabled={serviceCount > 0}
                                      onSelect={() => setDeleteCategoryId(category.id)}
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )
                          })}
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </CardContent>
            </Card>

            <Card className="lg:col-span-9">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{catalogTitle}</CardTitle>
                    <CardDescription>{catalogCountLabel}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="secondary">
                      <Link
                        href={`/admin/scheduling/new/recurring?returnTo=${encodeURIComponent('/admin/scheduling/services')}`}
                      >
                        Create slot
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Link
                        href={`/admin/scheduling/services/new?categoryId=${encodeURIComponent(categoryId)}&returnTo=${encodeURIComponent('/admin/scheduling/services')}`}
                      >
                        {LABELS.createService}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {filtered.map((service) => (
                    <Card key={service.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative h-32 bg-secondary">
                          {service.imageUrl ? (
                            <Image
                              src={service.imageUrl}
                              alt={service.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          ) : null}
                        </div>
                        <div className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-foreground">
                                {service.name}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {service.description ?? '—'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button asChild variant="secondary" size="sm">
                                <Link
                                  href={`/admin/scheduling/new/recurring?serviceId=${encodeURIComponent(service.id)}&returnTo=${encodeURIComponent('/admin/scheduling/services')}`}
                                >
                                  Create slot
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setSelected(service)}>
                                Edit
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <ServiceTypeBadge serviceType={service.serviceType} />
                            <EventTypeBadge eventType={service.eventType} />
                            <BookingModeBadge mode={service.bookingMode} />
                            <span className="text-xs font-semibold text-muted-foreground">
                              {formatPrice(service.basePrice)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {getAgeRangeLabel(service.ageMin, service.ageMax)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filtered.length === 0 ? (
                    <Card className="sm:col-span-2">
                      <CardContent className="pb-10 pt-10 text-center text-muted-foreground">
                        No matching {LABELS.services.toLowerCase()} for this category.
                      </CardContent>
                    </Card>
                  ) : null}
                </div>

                {serviceCategoryFilterId !== 'ALL' ? (
                  <CategoryAddOnManager categoryId={categoryId} />
                ) : null}
              </CardContent>
            </Card>
      </div>

      <CrudModal
        open={categoryOpen}
        onOpenChange={(open) => {
          setCategoryOpen(open)
          if (!open) {
            setEditingCategoryId(null)
          }
        }}
        title={editingCategoryId ? `Edit ${LABELS.serviceCategory}` : `New ${LABELS.serviceCategory}`}
        description={
          editingCategoryId
            ? `Update ${LABELS.serviceCategory.toLowerCase()} details and rules.`
            : `${LABELS.serviceCategory} group ${LABELS.services.toLowerCase()} in the catalog.`
        }
        size="sm"
        variant={editingCategoryId ? 'edit' : 'create'}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setCategoryOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={persistCategory}>
              {editingCategoryId
                ? `Save ${LABELS.serviceCategory.toLowerCase()}`
                : `Create ${LABELS.serviceCategory.toLowerCase()}`}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-parent-top">Parent category</Label>
            <Select
              value={categoryDraft.parentTopLevelId}
              onValueChange={(value) =>
                setCategoryDraft((draft) => ({
                  ...draft,
                  parentTopLevelId: value as SchedulingTopLevelId,
                }))
              }
            >
              <SelectTrigger id="cat-parent-top">
                <SelectValue placeholder="Select parent category" />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULING_TOP_LEVEL_ORDER.map((topLevelId) => (
                  <SelectItem key={topLevelId} value={topLevelId}>
                    {getSchedulingTopLevelLabel(topLevelId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose Gym, Play, or Event. Changing this while editing moves the sub-category.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={categoryDraft.name}
              onChange={(e) => setCategoryDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Court Sports"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cat-order">Display order</Label>
              <Input
                id="cat-order"
                type="number"
                value={categoryDraft.displayOrder}
                onChange={(e) => setCategoryDraft((d) => ({ ...d, displayOrder: e.target.value }))}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon</Label>
              <Input
                id="cat-icon"
                value={categoryDraft.icon}
                onChange={(e) => setCategoryDraft((d) => ({ ...d, icon: e.target.value }))}
                placeholder="Activity"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cat-active">Active</Label>
            <Switch
              id="cat-active"
              checked={categoryDraft.isActive}
              onCheckedChange={(v) => setCategoryDraft((d) => ({ ...d, isActive: v }))}
            />
          </div>

          <Accordion type="single" collapsible defaultValue={undefined}>
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced settings</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pb-2">
                  <div className="space-y-2">
                    <Label htmlFor="cat-desc">Description (optional)</Label>
                    <Textarea
                      id="cat-desc"
                      value={categoryDraft.description}
                      onChange={(e) => setCategoryDraft((d) => ({ ...d, description: e.target.value }))}
                      rows={3}
                      placeholder="Optional description shown to customers…"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-requires">Child must attend with an adult</Label>
                        <p className="text-xs text-muted-foreground">
                          The child being booked must be accompanied by a responsible adult (you or
                          another adult on the booking).
                        </p>
                      </div>
                      <Switch
                        id="cat-requires"
                        checked={categoryDraft.requiresAttendee}
                        onCheckedChange={(v) => setCategoryDraft((d) => ({ ...d, requiresAttendee: v }))}
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-members">Members only</Label>
                        <p className="text-xs text-muted-foreground">
                          Only customers with an active membership can book.
                        </p>
                      </div>
                      <Switch
                        id="cat-members"
                        checked={categoryDraft.membersOnly}
                        onCheckedChange={(v) => setCategoryDraft((d) => ({ ...d, membersOnly: v }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cat-infant">Free infant age (months)</Label>
                      <Input
                        id="cat-infant"
                        type="number"
                        min={0}
                        max={24}
                        value={categoryDraft.freeInfantMonths}
                        onChange={(e) => setCategoryDraft((d) => ({ ...d, freeInfantMonths: e.target.value }))}
                        placeholder="e.g. 6"
                      />
                      <p className="text-xs text-muted-foreground">Under X months is free.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cat-deposit">Deposit required (%)</Label>
                      <Input
                        id="cat-deposit"
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={categoryDraft.depositPercent}
                        onChange={(e) => setCategoryDraft((d) => ({ ...d, depositPercent: e.target.value }))}
                        placeholder="e.g. 25"
                      />
                      <p className="text-xs text-muted-foreground">
                        {categoryDraft.depositPercent.trim()
                          ? `e.g. ${categoryDraft.depositPercent}% deposit on a £100 booking = £${Math.round((Number.parseFloat(categoryDraft.depositPercent) || 0))} upfront`
                          : 'Customers pay this percentage upfront to confirm the booking.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-special">Allow special instructions</Label>
                        <p className="text-xs text-muted-foreground">
                          Customers can add notes during booking (e.g. dietary needs, preferences).
                        </p>
                      </div>
                      <Switch
                        id="cat-special"
                        checked={categoryDraft.specialInstructionsEnabled}
                        onCheckedChange={(v) => setCategoryDraft((d) => ({ ...d, specialInstructionsEnabled: v }))}
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-waitlist">Enable waitlist</Label>
                        <p className="text-xs text-muted-foreground">
                          When a session is full, customers can join the waitlist.
                        </p>
                      </div>
                      <Switch
                        id="cat-waitlist"
                        checked={categoryDraft.waitlistEnabled}
                        onCheckedChange={(v) => setCategoryDraft((d) => ({ ...d, waitlistEnabled: v }))}
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-family">Participating children: same household only</Label>
                        <p className="text-xs text-muted-foreground">
                          Every child on the play session must be from the same household or your
                          linked family list — outside children cannot be added.
                        </p>
                      </div>
                      <Switch
                        id="cat-family"
                        checked={categoryDraft.allowFamilyMember}
                        onCheckedChange={(v) => setCategoryDraft((d) => ({ ...d, allowFamilyMember: v }))}
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-checkin-gate">Require check-in before next booking</Label>
                        <p className="text-xs text-muted-foreground">
                          Contact must have checked in before making another booking in this category.
                        </p>
                      </div>
                      <Switch
                        id="cat-checkin-gate"
                        checked={categoryDraft.requireCheckInBeforeRebook}
                        onCheckedChange={(v) =>
                          setCategoryDraft((d) => ({ ...d, requireCheckInBeforeRebook: v }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="addons">
              <AccordionTrigger>Linked add-ons (optional)</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <p className="text-xs text-muted-foreground">
                    Add-ons customers can select when booking this category.
                  </p>
                  {categoryDraft.pendingAddOnLinks.map((row) => {
                    const addon = addOnCatalog.find((a) => a.id === row.addOnId)
                    return (
                      <div
                        key={row.addOnId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {addon?.name ?? row.addOnId}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Free</Label>
                            <Switch
                              checked={row.isFree}
                              onCheckedChange={(v) =>
                                setCategoryDraft((d) => ({
                                  ...d,
                                  pendingAddOnLinks: d.pendingAddOnLinks.map((x) =>
                                    x.addOnId === row.addOnId ? { ...x, isFree: v } : x,
                                  ),
                                }))
                              }
                            />
                          </div>
                          {!row.isFree && addon ? (
                            <Badge variant="secondary">{formatPrice(addon.price)}</Badge>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() =>
                              setCategoryDraft((d) => ({
                                ...d,
                                pendingAddOnLinks: d.pendingAddOnLinks.filter(
                                  (x) => x.addOnId !== row.addOnId,
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
                  <Popover open={categoryAddOnOpen} onOpenChange={setCategoryAddOnOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between">
                        Link add-on
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search add-ons…" />
                        <CommandList>
                          <CommandEmpty>No add-ons found.</CommandEmpty>
                          <CommandGroup>
                            {addOnCatalog
                              .filter(
                                (a) =>
                                  !categoryDraft.pendingAddOnLinks.some((p) => p.addOnId === a.id),
                              )
                              .map((a) => (
                                <CommandItem
                                  key={a.id}
                                  value={a.name}
                                  onSelect={() => {
                                    setCategoryDraft((d) => ({
                                      ...d,
                                      pendingAddOnLinks: [
                                        ...d.pendingAddOnLinks,
                                        { addOnId: a.id, isFree: false },
                                      ],
                                    }))
                                    setCategoryAddOnOpen(false)
                                  }}
                                >
                                  {a.name}
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    {formatPrice(a.price)}
                                  </span>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CrudModal>

      <CrudModal
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title={`Edit ${LABELS.service.toLowerCase()}`}
        description={selected?.name ?? undefined}
        size="lg"
        variant="edit"
        footer={
          selected ? (
            <>
              <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={persistEdit}>
                Save changes
              </Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={editDraft.locationId}
                onValueChange={(v) => setEditDraft((d) => ({ ...d, locationId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editDraft.name}
                onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editDraft.description}
                onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Base price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editDraft.basePrice}
                  onChange={(e) => setEditDraft((d) => ({ ...d, basePrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cap">Capacity</Label>
                <Input
                  id="edit-cap"
                  type="number"
                  value={editDraft.capacity}
                  onChange={(e) => setEditDraft((d) => ({ ...d, capacity: e.target.value }))}
                />
              </div>
            </div>

            <Accordion type="single" collapsible className="border border-border rounded-lg px-3">
              <AccordionItem value="pricing-seats">
                <AccordionTrigger className="text-sm font-semibold">
                  Pricing &amp; seat rules
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="edit-sibling">Sibling price (per additional family child)</Label>
                      <Input
                        id="edit-sibling"
                        type="number"
                        step="0.01"
                        value={editDraft.siblingPrice}
                        onChange={(e) => setEditDraft((d) => ({ ...d, siblingPrice: e.target.value }))}
                        placeholder="e.g. 10.00 — leave blank to charge base price for all children"
                      />
                      <p className="text-xs text-muted-foreground">
                        2nd and further children from the same family pay this rate.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-free-adults">Free adults per family</Label>
                      <Input
                        id="edit-free-adults"
                        type="number"
                        min={0}
                        max={20}
                        value={editDraft.freeAdultCount}
                        onChange={(e) => setEditDraft((d) => ({ ...d, freeAdultCount: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Adults included at no extra charge per booking.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-extra-adult">Price per extra adult (beyond free count)</Label>
                      <Input
                        id="edit-extra-adult"
                        type="number"
                        step="0.01"
                        value={editDraft.additionalAdultPrice}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, additionalAdultPrice: e.target.value }))
                        }
                        placeholder="e.g. 10.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-min-seats">Minimum participants</Label>
                      <Input
                        id="edit-min-seats"
                        type="number"
                        min={1}
                        value={editDraft.minSeats}
                        onChange={(e) => setEditDraft((d) => ({ ...d, minSeats: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Booking stays pending until this many participants join.
                      </p>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="edit-price-hour">Hourly rate (duration-based billing)</Label>
                      <Input
                        id="edit-price-hour"
                        type="number"
                        step="0.01"
                        value={editDraft.pricePerHour}
                        onChange={(e) => setEditDraft((d) => ({ ...d, pricePerHour: e.target.value }))}
                        placeholder="e.g. 75.00 — overrides per-participant pricing"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use for room rentals. Total = rate × hours.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-min-child">Min children</Label>
                      <Input
                        id="edit-min-child"
                        type="number"
                        min={0}
                        value={editDraft.minChildSeats}
                        onChange={(e) => setEditDraft((d) => ({ ...d, minChildSeats: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-max-child">Max children</Label>
                      <Input
                        id="edit-max-child"
                        type="number"
                        min={0}
                        value={editDraft.maxChildSeats}
                        onChange={(e) => setEditDraft((d) => ({ ...d, maxChildSeats: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-min-adult-seat">Min adults</Label>
                      <Input
                        id="edit-min-adult-seat"
                        type="number"
                        min={0}
                        value={editDraft.minAdultSeats}
                        onChange={(e) => setEditDraft((d) => ({ ...d, minAdultSeats: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-max-adult-seat">Max adults</Label>
                      <Input
                        id="edit-max-adult-seat"
                        type="number"
                        min={0}
                        value={editDraft.maxAdultSeats}
                        onChange={(e) => setEditDraft((d) => ({ ...d, maxAdultSeats: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="edit-extra-child-price">Price per extra child (beyond max child seats)</Label>
                      <Input
                        id="edit-extra-child-price"
                        type="number"
                        step="0.01"
                        value={editDraft.additionalChildPrice}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, additionalChildPrice: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="edit-pkg-only">Package-only service</Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, customers must select an event package to book.
                </p>
              </div>
              <Switch
                id="edit-pkg-only"
                checked={editDraft.isPackageService}
                onCheckedChange={(v) => {
                  if (
                    !v &&
                    selected &&
                    packages.some((p) => p.serviceId === selected.id)
                  ) {
                    setPackageDisableConfirmOpen(true)
                    return
                  }
                  setEditDraft((d) => ({ ...d, isPackageService: v }))
                }}
              />
            </div>
            {editDraft.isPackageService ? (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTitle className="text-amber-950 dark:text-amber-100">Package-only</AlertTitle>
                <AlertDescription className="text-amber-900/90 dark:text-amber-50/90">
                  Customers will not be able to book this service directly. They must choose an event
                  package.
                </AlertDescription>
              </Alert>
            ) : null}
            {editDraft.isPackageService && selected ? (
              <ServicePackageLinker
                serviceId={selected.id}
                serviceName={selected.name}
                onRequestEditPackage={openEditPackage}
                onRequestDuplicatePackage={(id) => duplicatePackage(id)}
              />
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-sub-price">Subscription price (optional)</Label>
                <Input
                  id="edit-sub-price"
                  type="number"
                  value={editDraft.subscriptionPrice}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, subscriptionPrice: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-waiver">Requires waiver</Label>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <span className="text-sm text-muted-foreground">Require waiver at checkout</span>
                  <Switch
                    id="edit-waiver"
                    checked={editDraft.requiresWaiver}
                    onCheckedChange={(v) =>
                      setEditDraft((d) => ({
                        ...d,
                        requiresWaiver: v,
                        requiredDocumentIds: v ? d.requiredDocumentIds : [],
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            {editDraft.requiresWaiver ? (
              <div className="space-y-2">
                <Label>Required waivers</Label>
                {waiverDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No waiver documents exist yet. Create them in Admin → Waivers.
                  </p>
                ) : (
                  <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                    {waiverDocs.map((doc) => {
                      const checked = editDraft.requiredDocumentIds.includes(doc.id)
                      return (
                        <label key={doc.id} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            onChange={(e) => {
                              const nextChecked = e.target.checked
                              setEditDraft((d) => ({
                                ...d,
                                requiredDocumentIds: nextChecked
                                  ? Array.from(new Set([...d.requiredDocumentIds, doc.id]))
                                  : d.requiredDocumentIds.filter((id) => id !== doc.id),
                              }))
                            }}
                          />
                          <span className="min-w-0">
                            <span className="text-sm font-semibold text-foreground">{doc.title}</span>
                            <span className="block text-xs text-muted-foreground">
                              v{doc.version}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Select one or more waivers the customer must sign before booking.
                </p>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-age-min">Min age (optional)</Label>
                <Input
                  id="edit-age-min"
                  type="number"
                  min={0}
                  value={editDraft.ageMin}
                  onChange={(e) => setEditDraft((d) => ({ ...d, ageMin: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-age-max">Max age (optional)</Label>
                <Input
                  id="edit-age-max"
                  type="number"
                  min={0}
                  value={editDraft.ageMax}
                  onChange={(e) => setEditDraft((d) => ({ ...d, ageMax: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dur">Duration (minutes)</Label>
              <Input
                id="edit-dur"
                type="number"
                value={editDraft.durationMinutes}
                onChange={(e) =>
                  setEditDraft((d) => ({ ...d, durationMinutes: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Event visibility</Label>
              <EventTypeSelector
                value={editDraft.eventType}
                onChange={(v) => setEditDraft((d) => ({ ...d, eventType: v }))}
              />
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="booking">
                <AccordionTrigger>Booking rules</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pb-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-min-dur">Min duration (mins)</Label>
                      <Input
                        id="edit-min-dur"
                        type="number"
                        value={editDraft.minDurationMinutes}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, minDurationMinutes: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-max-dur">Max duration (mins)</Label>
                      <Input
                        id="edit-max-dur"
                        type="number"
                        value={editDraft.maxDurationMinutes}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, maxDurationMinutes: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-inc">Slot increment (mins)</Label>
                      <Input
                        id="edit-inc"
                        type="number"
                        value={editDraft.slotIncrementMinutes}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, slotIncrementMinutes: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-max-conc">Max concurrent</Label>
                      <Input
                        id="edit-max-conc"
                        type="number"
                        value={editDraft.maxConcurrent}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, maxConcurrent: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-min-adv">Min advance (hours)</Label>
                      <Input
                        id="edit-min-adv"
                        type="number"
                        value={editDraft.minAdvanceHours}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, minAdvanceHours: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-max-adv">Max advance (hours)</Label>
                      <Input
                        id="edit-max-adv"
                        type="number"
                        value={editDraft.maxAdvanceHours}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, maxAdvanceHours: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Accordion type="single" collapsible className="border border-border rounded-lg px-3">
              <AccordionItem value="svc-addons">
                <AccordionTrigger className="text-sm font-semibold">
                  Linked add-ons (optional)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    <p className="text-xs text-muted-foreground">
                      Add-ons customers can select when booking this {LABELS.service.toLowerCase()}.
                    </p>
                    {(selectedLive?.linkedAddOns ?? []).map((row) => {
                      const addon = addOnCatalog.find((a) => a.id === row.addOnId)
                      return (
                        <div
                          key={row.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                        >
                          <span className="text-sm font-semibold text-foreground">
                            {addon?.name ?? row.addOnId}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Free</Label>
                              <Switch
                                checked={row.isFree}
                                onCheckedChange={(v) => {
                                  if (!selected) return
                                  setSchedulingAddOnFree('service', selected.id, row.addOnId, v)
                                }}
                              />
                            </div>
                            {!row.isFree && addon ? (
                              <Badge variant="secondary">{formatPrice(addon.price)}</Badge>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() =>
                                selected &&
                                unlinkSchedulingAddOn('service', selected.id, row.addOnId)
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    <Popover open={editAddOnOpen} onOpenChange={setEditAddOnOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-between">
                          Link add-on
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search add-ons…" />
                          <CommandList>
                            <CommandEmpty>No add-ons found.</CommandEmpty>
                            <CommandGroup>
                              {addOnCatalog
                                .filter(
                                  (a) =>
                                    !(selectedLive?.linkedAddOns ?? []).some(
                                      (p) => p.addOnId === a.id,
                                    ),
                                )
                                .map((a) => (
                                  <CommandItem
                                    key={a.id}
                                    value={a.name}
                                    onSelect={() => {
                                      if (selected) {
                                        linkSchedulingAddOn('service', selected.id, a.id, false)
                                      }
                                      setEditAddOnOpen(false)
                                    }}
                                  >
                                    {a.name}
                                    <span className="ml-auto text-xs text-muted-foreground">
                                      {formatPrice(a.price)}
                                    </span>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Active</Label>
              <Switch
                id="edit-active"
                checked={editDraft.isActive}
                onCheckedChange={(v) => setEditDraft((d) => ({ ...d, isActive: v }))}
              />
            </div>
          </div>
        ) : null}
      </CrudModal>

      <CrudModal
        open={packageOpen}
        onOpenChange={setPackageOpen}
        title={selectedPackageId ? 'Edit package' : 'New package'}
        description={selected?.name ?? undefined}
        size="md"
        variant={selectedPackageId ? 'edit' : 'create'}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setPackageOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={persistPackage}>
              {selectedPackageId ? 'Save package' : 'Create package'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pkg-name">Name</Label>
            <Input
              id="pkg-name"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="Gold Party Package"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tier</Label>
              <Select value={packageTier} onValueChange={(v) => setPackageTier(v as typeof packageTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SILVER">SILVER</SelectItem>
                  <SelectItem value="GOLD">GOLD</SelectItem>
                  <SelectItem value="PLATINUM">PLATINUM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-price">Base price</Label>
              <Input
                id="pkg-price"
                type="number"
                value={packageBasePrice}
                onChange={(e) => setPackageBasePrice(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pkg-features">Features (one per line)</Label>
            <Textarea
              id="pkg-features"
              value={packageFeatures}
              onChange={(e) => setPackageFeatures(e.target.value)}
              rows={5}
              placeholder={'Private space\nDecorations\nDedicated host'}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pkg-dep">Deposit amount (optional)</Label>
              <Input
                id="pkg-dep"
                type="number"
                step="0.01"
                value={packageDepositAmount}
                onChange={(e) => setPackageDepositAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-dur">Duration (minutes)</Label>
              <Input
                id="pkg-dur"
                type="number"
                value={packageDuration}
                onChange={(e) => setPackageDuration(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 sm:col-span-2">
              <Label htmlFor="pkg-whole">Requires exclusive venue access</Label>
              <Switch
                id="pkg-whole"
                checked={packageIsWholeVenue}
                onCheckedChange={setPackageIsWholeVenue}
              />
            </div>
            {packageIsWholeVenue ? (
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 sm:col-span-2">
                <Label htmlFor="pkg-appr">Manager must approve before confirming</Label>
                <Switch
                  id="pkg-appr"
                  checked={packageRequiresApproval}
                  onCheckedChange={setPackageRequiresApproval}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="pkg-min-c">Min children</Label>
              <Input
                id="pkg-min-c"
                type="number"
                value={packageMinChild}
                onChange={(e) => setPackageMinChild(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-max-c">Max children</Label>
              <Input
                id="pkg-max-c"
                type="number"
                value={packageMaxChild}
                onChange={(e) => setPackageMaxChild(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-min-a">Min adults</Label>
              <Input
                id="pkg-min-a"
                type="number"
                value={packageMinAdult}
                onChange={(e) => setPackageMinAdult(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-max-a">Max adults</Label>
              <Input
                id="pkg-max-a"
                type="number"
                value={packageMaxAdult}
                onChange={(e) => setPackageMaxAdult(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pkg-extra-child">Extra per child (beyond max)</Label>
              <Input
                id="pkg-extra-child"
                type="number"
                step="0.01"
                value={packageAdditionalChildPrice}
                onChange={(e) => setPackageAdditionalChildPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-setup">Setup time (minutes)</Label>
              <Input
                id="pkg-setup"
                type="number"
                value={packageSetupTime}
                onChange={(e) => setPackageSetupTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-staff">Staff count</Label>
              <Input
                id="pkg-staff"
                type="number"
                value={packageStaffCount}
                onChange={(e) => setPackageStaffCount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-rooms">Party rooms</Label>
              <Input
                id="pkg-rooms"
                type="number"
                value={packagePartyRooms}
                onChange={(e) => setPackagePartyRooms(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pkg-active">Active</Label>
            <Switch
              id="pkg-active"
              checked={packageIsActive}
              onCheckedChange={(v) => setPackageIsActive(v)}
            />
          </div>
        </div>
      </CrudModal>

      <CrudModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={`New ${LABELS.service.toLowerCase()}`}
        description={`Add a catalog ${LABELS.service.toLowerCase()} for the selected ${LABELS.serviceCategory.toLowerCase()}.`}
        size="lg"
        variant="create"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={persistCreate}>
              Create {LABELS.service.toLowerCase()}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{LABELS.serviceCategory}</Label>
            <Select
              value={createDraft.categoryId}
              onValueChange={(v) => setCreateDraft((d) => ({ ...d, categoryId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={LABELS.serviceCategory} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Select
              value={createDraft.locationId}
              onValueChange={(v) => setCreateDraft((d) => ({ ...d, locationId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Booking mode</Label>
            <Select
              value={createDraft.bookingMode}
              onValueChange={(v) =>
                setCreateDraft((d) => ({ ...d, bookingMode: v as SchedulingBookingMode }))
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
            <Label>Event visibility</Label>
            <EventTypeSelector
              value={createDraft.eventType}
              onChange={(v) => setCreateDraft((d) => ({ ...d, eventType: v }))}
            />
            <p className="text-xs text-muted-foreground">
              Private and host-only events are not shown here.
            </p>
          </div>
          <div className="space-y-2">
            <Label>{LABELS.serviceType}</Label>
            <Select
              value={createDraft.serviceType}
              onValueChange={(v) =>
                setCreateDraft((d) => ({ ...d, serviceType: v as SchedulingServiceType }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {allServiceTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-name">Name</Label>
            <Input
              id="new-name"
              value={createDraft.name}
              onChange={(e) => setCreateDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-desc">Description</Label>
            <Textarea
              id="new-desc"
              value={createDraft.description}
              onChange={(e) => setCreateDraft((d) => ({ ...d, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-price">Base price</Label>
              <Input
                id="new-price"
                type="number"
                value={createDraft.basePrice}
                onChange={(e) => setCreateDraft((d) => ({ ...d, basePrice: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-cap">Capacity</Label>
              <Input
                id="new-cap"
                type="number"
                value={createDraft.capacity}
                onChange={(e) => setCreateDraft((d) => ({ ...d, capacity: e.target.value }))}
              />
            </div>
          </div>

          <Accordion type="single" collapsible className="border border-border rounded-lg px-3">
            <AccordionItem value="new-pricing-seats">
              <AccordionTrigger className="text-sm font-semibold">
                Pricing &amp; seat rules
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="new-sibling">Sibling price (per additional family child)</Label>
                    <Input
                      id="new-sibling"
                      type="number"
                      step="0.01"
                      value={createDraft.siblingPrice}
                      onChange={(e) => setCreateDraft((d) => ({ ...d, siblingPrice: e.target.value }))}
                      placeholder="e.g. 10.00 — leave blank to charge base price for all children"
                    />
                    <p className="text-xs text-muted-foreground">
                      2nd and further children from the same family pay this rate.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-free-adults">Free adults per family</Label>
                    <Input
                      id="new-free-adults"
                      type="number"
                      min={0}
                      max={20}
                      value={createDraft.freeAdultCount}
                      onChange={(e) => setCreateDraft((d) => ({ ...d, freeAdultCount: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Adults included at no extra charge per booking.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-extra-adult">Price per extra adult (beyond free count)</Label>
                    <Input
                      id="new-extra-adult"
                      type="number"
                      step="0.01"
                      value={createDraft.additionalAdultPrice}
                      onChange={(e) =>
                        setCreateDraft((d) => ({ ...d, additionalAdultPrice: e.target.value }))
                      }
                      placeholder="e.g. 10.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-min-seats">Minimum participants</Label>
                    <Input
                      id="new-min-seats"
                      type="number"
                      min={1}
                      value={createDraft.minSeats}
                      onChange={(e) => setCreateDraft((d) => ({ ...d, minSeats: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Booking stays pending until this many participants join.
                    </p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="new-price-hour">Hourly rate (duration-based billing)</Label>
                    <Input
                      id="new-price-hour"
                      type="number"
                      step="0.01"
                      value={createDraft.pricePerHour}
                      onChange={(e) => setCreateDraft((d) => ({ ...d, pricePerHour: e.target.value }))}
                      placeholder="e.g. 75.00 — overrides per-participant pricing"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use for room rentals. Total = rate × hours.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-min-child">Min children</Label>
                    <Input
                      id="new-min-child"
                      type="number"
                      min={0}
                      value={createDraft.minChildSeats}
                      onChange={(e) => setCreateDraft((d) => ({ ...d, minChildSeats: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-max-child">Max children</Label>
                    <Input
                      id="new-max-child"
                      type="number"
                      min={0}
                      value={createDraft.maxChildSeats}
                      onChange={(e) => setCreateDraft((d) => ({ ...d, maxChildSeats: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-min-adult-seat">Min adults</Label>
                    <Input
                      id="new-min-adult-seat"
                      type="number"
                      min={0}
                      value={createDraft.minAdultSeats}
                      onChange={(e) => setCreateDraft((d) => ({ ...d, minAdultSeats: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-max-adult-seat">Max adults</Label>
                    <Input
                      id="new-max-adult-seat"
                      type="number"
                      min={0}
                      value={createDraft.maxAdultSeats}
                      onChange={(e) => setCreateDraft((d) => ({ ...d, maxAdultSeats: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="new-extra-child-price">Price per extra child (beyond max child seats)</Label>
                    <Input
                      id="new-extra-child-price"
                      type="number"
                      step="0.01"
                      value={createDraft.additionalChildPrice}
                      onChange={(e) =>
                        setCreateDraft((d) => ({ ...d, additionalChildPrice: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="new-pkg-only">Package-only service</Label>
              <p className="text-xs text-muted-foreground">
                When enabled, customers must select an event package to book.
              </p>
            </div>
            <Switch
              id="new-pkg-only"
              checked={createDraft.isPackageService}
              onCheckedChange={(v) => setCreateDraft((d) => ({ ...d, isPackageService: v }))}
            />
          </div>
          {createDraft.isPackageService ? (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTitle className="text-amber-950 dark:text-amber-100">Package-only</AlertTitle>
              <AlertDescription className="text-amber-900/90 dark:text-amber-50/90">
                After you create this {LABELS.service.toLowerCase()}, open it again to link or create
                packages.
              </AlertDescription>
            </Alert>
          ) : null}

          <Accordion type="single" collapsible className="border border-border rounded-lg px-3">
            <AccordionItem value="new-svc-addons">
              <AccordionTrigger className="text-sm font-semibold">
                Linked add-ons (optional)
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <p className="text-xs text-muted-foreground">
                    Add-ons customers can select when booking this {LABELS.service.toLowerCase()}.
                  </p>
                  {createDraft.pendingServiceAddOnLinks.map((row) => {
                    const addon = addOnCatalog.find((a) => a.id === row.addOnId)
                    return (
                      <div
                        key={row.addOnId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {addon?.name ?? row.addOnId}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Free</Label>
                            <Switch
                              checked={row.isFree}
                              onCheckedChange={(v) =>
                                setCreateDraft((d) => ({
                                  ...d,
                                  pendingServiceAddOnLinks: d.pendingServiceAddOnLinks.map((x) =>
                                    x.addOnId === row.addOnId ? { ...x, isFree: v } : x,
                                  ),
                                }))
                              }
                            />
                          </div>
                          {!row.isFree && addon ? (
                            <Badge variant="secondary">{formatPrice(addon.price)}</Badge>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() =>
                              setCreateDraft((d) => ({
                                ...d,
                                pendingServiceAddOnLinks: d.pendingServiceAddOnLinks.filter(
                                  (x) => x.addOnId !== row.addOnId,
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
                  <Popover open={createAddOnOpen} onOpenChange={setCreateAddOnOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between">
                        Link add-on
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search add-ons…" />
                        <CommandList>
                          <CommandEmpty>No add-ons found.</CommandEmpty>
                          <CommandGroup>
                            {addOnCatalog
                              .filter(
                                (a) =>
                                  !createDraft.pendingServiceAddOnLinks.some(
                                    (p) => p.addOnId === a.id,
                                  ),
                              )
                              .map((a) => (
                                <CommandItem
                                  key={a.id}
                                  value={a.name}
                                  onSelect={() => {
                                    setCreateDraft((d) => ({
                                      ...d,
                                      pendingServiceAddOnLinks: [
                                        ...d.pendingServiceAddOnLinks,
                                        { addOnId: a.id, isFree: false },
                                      ],
                                    }))
                                    setCreateAddOnOpen(false)
                                  }}
                                >
                                  {a.name}
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    {formatPrice(a.price)}
                                  </span>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-sub-price">Subscription price (optional)</Label>
              <Input
                id="new-sub-price"
                type="number"
                value={createDraft.subscriptionPrice}
                onChange={(e) =>
                  setCreateDraft((d) => ({ ...d, subscriptionPrice: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-waiver">Requires waiver</Label>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                <span className="text-sm text-muted-foreground">Require waiver at checkout</span>
                <Switch
                  id="new-waiver"
                  checked={createDraft.requiresWaiver}
                  onCheckedChange={(v) =>
                    setCreateDraft((d) => ({
                      ...d,
                      requiresWaiver: v,
                      requiredDocumentIds: v ? d.requiredDocumentIds : [],
                    }))
                  }
                />
              </div>
            </div>
          </div>
          {createDraft.requiresWaiver ? (
            <div className="space-y-2">
              <Label>Required waivers</Label>
              {waiverDocs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No waiver documents exist yet. Create them in Admin → Waivers.
                </p>
              ) : (
                <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                  {waiverDocs.map((doc) => {
                    const checked = createDraft.requiredDocumentIds.includes(doc.id)
                    return (
                      <label key={doc.id} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          onChange={(e) => {
                            const nextChecked = e.target.checked
                            setCreateDraft((d) => ({
                              ...d,
                              requiredDocumentIds: nextChecked
                                ? Array.from(new Set([...d.requiredDocumentIds, doc.id]))
                                : d.requiredDocumentIds.filter((id) => id !== doc.id),
                            }))
                          }}
                        />
                        <span className="min-w-0">
                          <span className="text-sm font-semibold text-foreground">{doc.title}</span>
                          <span className="block text-xs text-muted-foreground">v{doc.version}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Select one or more waivers the customer must sign before booking.
              </p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-age-min">Min age (optional)</Label>
              <Input
                id="new-age-min"
                type="number"
                min={0}
                value={createDraft.ageMin}
                onChange={(e) => setCreateDraft((d) => ({ ...d, ageMin: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-age-max">Max age (optional)</Label>
              <Input
                id="new-age-max"
                type="number"
                min={0}
                value={createDraft.ageMax}
                onChange={(e) => setCreateDraft((d) => ({ ...d, ageMax: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-dur">Duration (minutes)</Label>
            <Input
              id="new-dur"
              type="number"
              value={createDraft.durationMinutes}
              onChange={(e) =>
                setCreateDraft((d) => ({ ...d, durationMinutes: e.target.value }))
              }
            />
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="booking">
              <AccordionTrigger>Booking rules</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pb-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-min-dur">Min duration (mins)</Label>
                    <Input
                      id="new-min-dur"
                      type="number"
                      value={createDraft.minDurationMinutes}
                      onChange={(e) =>
                        setCreateDraft((d) => ({ ...d, minDurationMinutes: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-max-dur">Max duration (mins)</Label>
                    <Input
                      id="new-max-dur"
                      type="number"
                      value={createDraft.maxDurationMinutes}
                      onChange={(e) =>
                        setCreateDraft((d) => ({ ...d, maxDurationMinutes: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-inc">Slot increment (mins)</Label>
                    <Input
                      id="new-inc"
                      type="number"
                      value={createDraft.slotIncrementMinutes}
                      onChange={(e) =>
                        setCreateDraft((d) => ({ ...d, slotIncrementMinutes: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-max-conc">Max concurrent</Label>
                    <Input
                      id="new-max-conc"
                      type="number"
                      value={createDraft.maxConcurrent}
                      onChange={(e) =>
                        setCreateDraft((d) => ({ ...d, maxConcurrent: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-min-adv">Min advance (hours)</Label>
                    <Input
                      id="new-min-adv"
                      type="number"
                      value={createDraft.minAdvanceHours}
                      onChange={(e) =>
                        setCreateDraft((d) => ({ ...d, minAdvanceHours: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-max-adv">Max advance (hours)</Label>
                    <Input
                      id="new-max-adv"
                      type="number"
                      value={createDraft.maxAdvanceHours}
                      onChange={(e) =>
                        setCreateDraft((d) => ({ ...d, maxAdvanceHours: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex items-center justify-between">
            <Label htmlFor="new-active">Active</Label>
            <Switch
              id="new-active"
              checked={createDraft.isActive}
              onCheckedChange={(v) => setCreateDraft((d) => ({ ...d, isActive: v }))}
            />
          </div>
        </div>
      </CrudModal>

      <AlertDialog
        open={deleteCategoryId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCategoryId(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCategoryId
                ? `This will permanently remove “${
                    sortedCategories.find((category) => category.id === deleteCategoryId)?.name ??
                    'this category'
                  }”.`
                : 'This will permanently remove the selected category.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={packageDisableConfirmOpen} onOpenChange={setPackageDisableConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Turn off package-only?</AlertDialogTitle>
            <AlertDialogDescription>
              Customers can book this service directly without a package. Linked packages remain but are
              no longer required.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setEditDraft((d) => ({ ...d, isPackageService: false }))
                setPackageDisableConfirmOpen(false)
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
