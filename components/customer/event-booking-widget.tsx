/** Event booking widget for six-step party booking and checkout flow. */
'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ComponentType } from 'react'
import Link from 'next/link'
import { Building2, Cake, CalendarDays, Church, PartyPopper, School, Ticket, Users } from 'lucide-react'

import { BookingFlowCouponSection } from '@/components/customer/booking-flow-coupon-section'
import {
  BOOKING_CART_OPTION_ROW_CLASS,
} from '@/components/customer/booking-cart-card'
import { EventAddOnConfiguratorModal } from '@/components/customer/event-add-on-configurator-modal'
import { EventBookingScheduleSection } from '@/components/customer/event-booking-schedule-section'
import { PackageSelector } from '@/components/customer/package-selector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useEventBookingForm } from '@/hooks/use-event-booking-form'
import { useToast } from '@/hooks/use-toast'
import { useClients } from '@/lib/client-store'
import { useInventory } from '@/lib/inventory-store'
import {
  buildEventOptionalAddOnList,
  getPackageIncludedAddOnIds,
  isEventSchedulingSubCategoryId,
  resolveEventAddOnCafeProduct,
  resolveEventAddOnImageUrl,
  type EventOptionalAddOnListItem,
} from '@/lib/event-booking-add-ons'
import {
  resolveEventBookingScheduleMode,
} from '@/lib/event-booking-schedule'
import {
  buildSchedulingAddOnCatalog,
  resolveCategoryOptionalAddOns,
  resolveSchedulingCategoryForService,
} from '@/lib/scheduling-category-addons'
import { resolvePackagesForSchedulingService } from '@/lib/event-package-catalog'
import {
  eventPackageOptionalAddOnsMock,
  MOCK_ATTRIBUTE_GROUPS,
  MOCK_CAFE_PRODUCTS,
  MOCK_MODIFIER_GROUPS,
  type EventPackageOptionalAddOn,
} from '@/lib/mock-data'
import { useScheduling } from '@/lib/scheduling-store'
import { getSchedulingConsumerBackLink } from '@/lib/scheduling-consumer-categories'
import { navigateToListingAfterCartAdd } from '@/lib/product-detail-navigation'
import {
  buildEventCartBookingDescription,
  EVENT_CART_BOOKING_META_KEY,
  getPlayBookingConfirmCartLabel,
} from '@/lib/play-cart'
import { cn, formatPrice } from '@/lib/utils'
import { EventBookingScheduleModeEnum, type EventOccasion, type EventPackage } from '@/lib/types'

type Step = 1 | 2 | 3 | 4 | 5 | 6

interface OccasionOption {
  id: EventOccasion
  label: string
  icon: ComponentType<{ className?: string }>
}

const OPTIONAL_ADD_ON_SECTIONS: ReadonlyArray<{
  id: EventPackageOptionalAddOn['category']
  title: string
  description: string
}> = [
  {
    id: 'FOOD_BEVERAGE',
    title: 'Food & Beverage Upgrades',
    description: 'Pizza, trays, drinks, coffee, and catering extras.',
  },
  {
    id: 'DESSERT',
    title: 'Dessert & Sweets',
    description: 'Cupcakes, donuts, ice cream, and interactive dessert stations.',
  },
  {
    id: 'DECOR',
    title: 'Decor & Theme',
    description: 'Balloons, themed tableware, and photo-ready decoration upgrades.',
  },
  {
    id: 'ENTERTAINMENT',
    title: 'Entertainment & Favors',
    description: 'Goodie bags, character visits, artists, and themed activities.',
  },
  {
    id: 'LOGISTICS',
    title: 'Time & Logistics',
    description: 'Extra time, staffing, and guest logistics to support larger parties.',
  },
  {
    id: 'OTHER',
    title: 'Additional options',
    description: 'Add-ons linked to this event category from admin.',
  },
]

const OCCASION_OPTIONS: OccasionOption[] = [
  { id: 'BIRTHDAY', label: 'Birthday', icon: Cake },
  { id: 'ACTIVITY_PARTY', label: 'Activity party', icon: PartyPopper },
  { id: 'SOCIAL_EVENT', label: 'Social event', icon: Users },
  { id: 'ANNIVERSARY', label: 'Anniversary', icon: CalendarDays },
  { id: 'CORPORATE', label: 'Corporate', icon: Building2 },
  { id: 'CHURCH_SCHOOL', label: 'Church / School', icon: School },
  { id: 'OTHER', label: 'Other', icon: Church },
]

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function embeddedPanelClass(embedded: boolean, className?: string): string {
  return cn(
    embedded ? BOOKING_CART_OPTION_ROW_CLASS : 'rounded-md border border-border bg-muted/20',
    className,
  )
}

function embeddedSummaryClass(embedded: boolean, className?: string): string {
  return cn(
    embedded ? BOOKING_CART_OPTION_ROW_CLASS : 'rounded-md border border-border',
    className,
  )
}

interface EventBookingWidgetProps {
  readonly serviceId?: string
  /** When set (e.g. from `/events/[id]` parent), must match the same list as the page PackageSelector. */
  readonly bookingPackages?: readonly EventPackage[]
  readonly embedded?: boolean
  readonly showOccasionStep?: boolean
  readonly showPackageStep?: boolean
  readonly externalSelectedPackageId?: string | null
  readonly defaultOccasion?: EventOccasion
  readonly defaultBirthdayName?: string
  readonly defaultBirthdayAge?: number
  readonly canStart?: boolean
  readonly onProgressChange?: (progress: {
    occasion: EventOccasion
    birthdayName: string
    birthdayAge: number | null
    packageName: string | null
    date: string | null
    timeRange: string | null
    children: number
    adults: number
    selectedAddOnCount: number
  }) => void
}

export function EventBookingWidget({
  serviceId = 'svc-5',
  bookingPackages: bookingPackagesProp,
  embedded = false,
  showOccasionStep = true,
  showPackageStep = true,
  externalSelectedPackageId,
  defaultOccasion = 'BIRTHDAY',
  defaultBirthdayName = 'Emma',
  defaultBirthdayAge = 5,
  canStart = true,
  onProgressChange,
}: Readonly<EventBookingWidgetProps>) {
  const router = useRouter()
  const { toast } = useToast()
  const { addCustomCartItem, bookingAddOns, products: inventoryProducts } = useInventory()
  const { contacts, subscriptions } = useClients()
  const { slots, services, packages: storePackages, categories } = useScheduling()
  const [step, setStep] = useState<Step>(showOccasionStep ? 1 : showPackageStep ? 2 : 3)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false)
  const [configuratorAddOnId, setConfiguratorAddOnId] = useState<string | null>(null)

  const bookingService = useMemo(
    () => services.find((entry) => entry.id === serviceId) ?? null,
    [serviceId, services],
  )
  const listingBackHref = useMemo(() => {
    if (bookingService) {
      return getSchedulingConsumerBackLink(
        bookingService.categoryId,
        bookingService.category,
      ).href
    }
    return '/events'
  }, [bookingService])
  const resolvedPackages = useMemo(() => {
    if (bookingPackagesProp) {
      return [...bookingPackagesProp]
    }
    if (bookingService) {
      return resolvePackagesForSchedulingService(bookingService, storePackages)
    }
    return storePackages.filter(
      (entry) => entry.serviceId === serviceId && entry.isActive,
    )
  }, [bookingPackagesProp, bookingService, serviceId, storePackages])
  const privateRoomPackages = useMemo(() => resolvedPackages.filter((p) => !p.isWholeVenue), [
    resolvedPackages,
  ])
  const wholeVenuePackages = useMemo(() => resolvedPackages.filter((p) => p.isWholeVenue), [
    resolvedPackages,
  ])
  const defaultPackageIdForForm = useMemo(() => {
    const preferred = 'pkg-svc5-vip'
    if (resolvedPackages.some((entry) => entry.id === preferred)) {
      return preferred
    }
    return resolvedPackages[0]?.id
  }, [resolvedPackages])
  const primaryContact =
    contacts.find((entry) => entry.contactType === 'CUSTOMER') ?? contacts[0] ?? null
  const hasSubscriptionForCoupons = Boolean(
    primaryContact &&
      subscriptions.some(
        (entry) =>
          entry.contactId === primaryContact.id &&
          (entry.status === 'ACTIVE' || entry.status === 'TRIALING' || entry.status === 'PAUSED'),
      ),
  )

  const form = useEventBookingForm({
    serviceId,
    packages: resolvedPackages,
    defaultPackageId: defaultPackageIdForForm,
    defaultOccasion,
    defaultBirthdayName,
    defaultBirthdayAge,
    defaultChildren: 10,
    defaultAdults: 20,
  })

  const partyDurationMinutes =
    form.selectedPackage?.duration ?? form.service?.durationMinutes ?? 120

  useEffect(() => {
    if (!externalSelectedPackageId) return
    form.setSelectedPackageId(externalSelectedPackageId)
  }, [externalSelectedPackageId, form.setSelectedPackageId])

  useEffect(() => {
    if (!form.selectedDate) {
      form.setSelectedDate(toIsoDate(new Date()))
    }
  }, [form.selectedDate, form.setSelectedDate])

  const includedAddOnIds = useMemo(
    () => getPackageIncludedAddOnIds(form.selectedPackage),
    [form.selectedPackage],
  )

  const includedAddOns = useMemo(() => {
    if (!form.selectedPackage) {
      return [] as Array<{ id: string; name: string }>
    }
    return form.selectedPackage.addOns
      .filter((entry) => entry.included)
      .map((entry) => {
        const fromAdmin = bookingAddOns.find((addOn) => addOn.id === entry.addOnId)
        const fromCatalog = eventPackageOptionalAddOnsMock.find(
          (addOn) => addOn.id === entry.addOnId,
        )
        return {
          id: entry.addOnId,
          name: fromAdmin?.name ?? fromCatalog?.name ?? entry.addOnId,
        }
      })
  }, [bookingAddOns, form.selectedPackage])

  const bookingCategory = useMemo(() => {
    if (!bookingService) {
      return null
    }
    return resolveSchedulingCategoryForService(bookingService, categories)
  }, [bookingService, categories])

  const categoryOptionalAddOns = useMemo(() => {
    if (!bookingCategory || !isEventSchedulingSubCategoryId(bookingCategory.id)) {
      return []
    }
    const catalog = buildSchedulingAddOnCatalog(services, bookingAddOns)
    return resolveCategoryOptionalAddOns(bookingCategory, catalog)
  }, [bookingAddOns, bookingCategory, services])

  const optionalAddOns = useMemo(
    () =>
      buildEventOptionalAddOnList(
        bookingAddOns,
        eventPackageOptionalAddOnsMock,
        includedAddOnIds,
        categoryOptionalAddOns,
      ),
    [bookingAddOns, categoryOptionalAddOns, includedAddOnIds],
  )

  const configuratorItem = useMemo((): EventOptionalAddOnListItem | null => {
    if (!configuratorAddOnId) {
      return null
    }
    return optionalAddOns.find((entry) => entry.id === configuratorAddOnId) ?? null
  }, [configuratorAddOnId, optionalAddOns])

  const configuratorCafeProduct = useMemo(() => {
    if (!configuratorItem) {
      return null
    }
    return resolveEventAddOnCafeProduct(configuratorItem.bookingAddOn, MOCK_CAFE_PRODUCTS)
  }, [configuratorItem])
  const pricingResetKey = useMemo(
    () =>
      [
        form.selectedPackageId ?? '',
        form.selectedDate ?? '',
        String(form.childrenCount),
        String(form.adultsCount),
        String(form.optionalAddOnTotal),
      ].join('|'),
    [
      form.adultsCount,
      form.childrenCount,
      form.optionalAddOnTotal,
      form.selectedDate,
      form.selectedPackageId,
    ],
  )
  function nextStep(): void {
    if (step === 1 && !showPackageStep) {
      setStep(3)
      return
    }
    setStep((prev) => (prev < 6 ? ((prev + 1) as Step) : prev))
  }

  function prevStep(): void {
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev))
  }

  function submit(): void {
    if (bookingComplete) {
      return
    }
    const booking = form.submitBooking({ persist: false })
    if (!booking) {
      toast({
        title: 'Missing details',
        description: 'Complete package and schedule details before submitting.',
        variant: 'destructive',
      })
      return
    }
    const serviceName = form.service?.name ?? 'Event'
    const occasionLabel =
      OCCASION_OPTIONS.find((option) => option.id === form.occasion)?.label ?? null
    addCustomCartItem({
      type: 'booking',
      name: serviceName,
      description: buildEventCartBookingDescription(booking, {
        packageName: form.selectedPackage?.name ?? null,
        occasionLabel,
        selectedDate: form.selectedDate,
      }),
      price: booking.totalAmount,
      quantity: 1,
      imageUrl: form.service?.imageUrl ?? undefined,
      metadata: {
        [EVENT_CART_BOOKING_META_KEY]: true,
        serviceId: form.service?.id ?? serviceId,
      },
    })
    setBookingComplete(true)
    navigateToListingAfterCartAdd(router, listingBackHref, {
      itemName: serviceName,
    })
  }

  const progressTimeRange = useMemo(() => {
    if (!form.service) {
      return null
    }
    const mode = resolveEventBookingScheduleMode(form.service)
    if (mode === EventBookingScheduleModeEnum.PER_DAY) {
      if (!form.selectedDate) {
        return null
      }
      if (form.selectedToDate && form.selectedToDate !== form.selectedDate) {
        return `${form.selectedDate} – ${form.selectedToDate}`
      }
      return form.selectedDate
    }
    if (!form.selectedWindow) {
      return null
    }
    return `${new Date(form.selectedWindow.startAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${new Date(form.selectedWindow.endAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }, [form.selectedDate, form.selectedToDate, form.selectedWindow, form.service])

  const selectedOptionalCount = useMemo(
    () =>
      Object.values(form.optionalAddOns).reduce(
        (sum, selection) => sum + Math.max(0, selection.quantity),
        0,
      ),
    [form.optionalAddOns],
  )

  const selectedOptionalItems = useMemo(
    () =>
      optionalAddOns
        .map((addOn) => {
          if (includedAddOnIds.has(addOn.id)) {
            return null
          }
          const selection = form.optionalAddOns[addOn.id]
          const quantity = selection?.quantity ?? 0
          if (quantity <= 0) {
            return null
          }
          return {
            ...addOn,
            quantity,
            lineTotal: selection.unitPrice * quantity,
            summary: selection.summary,
          }
        })
        .filter((entry) => entry !== null),
    [form.optionalAddOns, includedAddOnIds, optionalAddOns],
  )

  const configuratorExisting = useMemo(() => {
    if (!configuratorAddOnId) {
      return null
    }
    const selection = form.optionalAddOns[configuratorAddOnId]
    if (!selection || selection.quantity <= 0) {
      return null
    }
    return {
      unitPrice: selection.unitPrice,
      quantity: selection.quantity,
      summary: selection.summary,
      selectedByGroup: selection.selectedByGroup,
      selectedAttributesByGroup: selection.selectedAttributesByGroup,
      customerNote: selection.customerNote ?? '',
    }
  }, [configuratorAddOnId, form.optionalAddOns])

  useEffect(() => {
    if (step === 5 && !bookingComplete) {
      setCustomizeModalOpen(true)
    }
  }, [bookingComplete, step])

  useEffect(() => {
    onProgressChange?.({
      occasion: form.occasion,
      birthdayName: form.birthdayDetails.celebrantName,
      birthdayAge: form.birthdayDetails.celebrantAge,
      packageName: form.selectedPackage?.name ?? null,
      date: form.selectedDate,
      timeRange: progressTimeRange,
      children: form.childrenCount,
      adults: form.adultsCount,
      selectedAddOnCount: selectedOptionalCount,
    })
  }, [
    form.adultsCount,
    form.birthdayDetails.celebrantAge,
    form.birthdayDetails.celebrantName,
    form.childrenCount,
    form.occasion,
    form.selectedDate,
    form.selectedPackage?.name,
    onProgressChange,
    progressTimeRange,
    selectedOptionalCount,
  ])

  return (
    <div
      className={
        embedded
          ? 'w-full min-w-0 space-y-4 overflow-hidden'
          : 'mx-auto w-full max-w-6xl rounded-xl border border-border bg-card p-4 md:p-6'
      }
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Party booking</h2>
        <p className="text-sm text-muted-foreground">Step {step} of 6</p>
      </div>

      {bookingComplete ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 space-y-3 text-center">
          <p className="text-lg font-semibold text-emerald-700">Added to cart</p>
          <p className="text-sm text-emerald-700">
            Your party details are saved as a cart line. Open Event bookings to complete checkout.
          </p>
          <Button type="button" variant="outline" className="w-full bg-background" asChild>
            <Link href="/cart">View cart</Link>
          </Button>
        </div>
      ) : null}

      {!bookingComplete && showOccasionStep && step === 1 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">What are you celebrating?</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {OCCASION_OPTIONS.map((option) => {
              const Icon = option.icon
              const selected = form.occasion === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => form.setOccasion(option.id)}
                  className={cn(
                    'rounded-lg border p-3 text-left transition',
                    selected
                      ? 'border-accent bg-accent/5'
                      : embedded
                        ? BOOKING_CART_OPTION_ROW_CLASS
                        : 'border-border hover:bg-muted/40',
                  )}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium text-foreground">{option.label}</p>
                </button>
              )
            })}
          </div>
          {form.occasion === 'BIRTHDAY' ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birthday-name">Birthday child name</Label>
                <Input
                  id="birthday-name"
                  value={form.birthdayDetails.celebrantName}
                  onChange={(event) =>
                    form.updateBirthdayDetails({ celebrantName: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday-age">Age (1-18)</Label>
                <Input
                  id="birthday-age"
                  type="number"
                  min={1}
                  max={18}
                  value={form.birthdayDetails.celebrantAge ?? ''}
                  onChange={(event) =>
                    form.updateBirthdayDetails({
                      celebrantAge: Number.parseInt(event.target.value || '0', 10) || null,
                    })
                  }
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!bookingComplete && showPackageStep && step === 2 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Choose your package</h3>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Private room booking</p>
            <PackageSelector
              packages={privateRoomPackages}
              selectedId={form.selectedPackageId}
              onSelect={(id) => form.setSelectedPackageId(id)}
              variant="full"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Whole venue</p>
            <PackageSelector
              packages={wholeVenuePackages}
              selectedId={form.selectedPackageId}
              onSelect={(id) => form.setSelectedPackageId(id)}
              variant="full"
            />
          </div>
        </div>
      ) : null}

      {!bookingComplete && step === 3 ? (
        form.service ? (
          <EventBookingScheduleSection
            service={form.service}
            slots={slots}
            durationMinutes={partyDurationMinutes}
            selectedDate={form.selectedDate ?? toIsoDate(new Date())}
            onSelectedDateChange={(date) => {
              form.setSelectedDate(date)
              form.setSelectedWindow(null)
            }}
            selectedToDate={form.selectedToDate ?? form.selectedDate ?? toIsoDate(new Date())}
            onSelectedToDateChange={form.setSelectedToDate}
            selectedWindow={form.selectedWindow}
            onSelectedWindowChange={form.setSelectedWindow}
            dateStripDensity={embedded ? 'compact' : 'default'}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Select a package to load availability.</p>
        )
      ) : null}

      {!bookingComplete && step === 4 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">How many guests?</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <span className="text-sm font-semibold mb-2 block">Children</span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => form.setChildrenCount(Math.max(0, form.childrenCount - 1))}
                  disabled={form.childrenCount <= 0}
                >
                  –
                </Button>
                <span className="font-bold text-base w-12 text-center">{form.childrenCount}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => form.setChildrenCount(form.childrenCount + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            <div>
              <span className="text-sm font-semibold mb-2 block">Adults</span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => form.setAdultsCount(Math.max(0, form.adultsCount - 1))}
                  disabled={form.adultsCount <= 0}
                >
                  –
                </Button>
                <span className="font-bold text-base w-12 text-center">{form.adultsCount}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => form.setAdultsCount(form.adultsCount + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          {form.extraChildren > 0 || form.extraAdults > 0 ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Extra guest fees apply for guests above package included limits.
            </p>
          ) : null}
          <div className={embeddedSummaryClass(embedded, 'p-3 text-sm')}>
            <p>Package: {formatPrice(form.basePrice)}</p>
            <p>
              Extra children ({form.extraChildren}): {formatPrice(form.childrenOverageTotal)}
            </p>
            <p>
              Extra adults ({form.extraAdults}): {formatPrice(form.adultsOverageTotal)}
            </p>
          </div>
        </div>
      ) : null}

      {!bookingComplete && step === 5 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <h3 className="text-lg font-semibold text-foreground">Customize your party</h3>
            <p className="text-sm text-muted-foreground">
              Add optional upgrades from your event add-on catalog. Each selection is configured
              once with a Done button before continuing.
            </p>
            <div className={embeddedPanelClass(embedded, 'p-3 text-sm')}>
              <p className="font-semibold text-foreground">Selected add-ons</p>
              {selectedOptionalItems.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {selectedOptionalItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 text-muted-foreground"
                    >
                      <span className="line-clamp-2">
                        {item.summary}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatPrice(item.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-muted-foreground">
                  No optional add-ons selected yet.
                </p>
              )}
            </div>
            {includedAddOns.length > 0 ? (
              <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-emerald-700">
                  Included with package (no extra charge)
                </p>
                {includedAddOns.map((entry) => (
                  <p key={entry.id} className="text-sm text-emerald-700">
                    {entry.name}
                  </p>
                ))}
              </div>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setCustomizeModalOpen(true)}>
              Choose add-ons
            </Button>
          </div>
          <div className={embeddedSummaryClass(embedded, 'h-fit p-3 text-sm lg:sticky lg:top-4')}>
            <p className="font-semibold text-foreground">Running total</p>
            <p className="mt-2">Base package: {formatPrice(form.basePrice)}</p>
            <p>Guest overage: {formatPrice(form.childrenOverageTotal + form.adultsOverageTotal)}</p>
            <p>Optional add-ons: {formatPrice(form.optionalAddOnTotal)}</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              Subtotal: {formatPrice(form.totalBeforeCoupon)}
            </p>
          </div>

          <Dialog open={customizeModalOpen} onOpenChange={setCustomizeModalOpen}>
            <DialogContent className="h-[92vh] w-[98vw] max-w-[98vw] sm:max-w-[98vw] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Customize your party</DialogTitle>
                <DialogDescription>
                  Choose event add-ons from your admin catalog. Tap Select add-on to configure
                  options, then Done to save each selection.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {OPTIONAL_ADD_ON_SECTIONS.map((section) => {
                  const sectionItems = optionalAddOns.filter((item) => item.category === section.id)
                  if (sectionItems.length === 0) {
                    return null
                  }
                  return (
                    <section
                      key={section.id}
                      className="space-y-3 rounded-xl border border-border bg-muted/20 p-4"
                    >
                      <div>
                        <h3 className="text-xl font-black text-foreground">{section.title}</h3>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {sectionItems.map((addOn) => {
                          const selection = form.optionalAddOns[addOn.id]
                          const isSelected = (selection?.quantity ?? 0) > 0
                          const cardImageUrl = resolveEventAddOnImageUrl(
                            addOn.bookingAddOn,
                            MOCK_CAFE_PRODUCTS,
                            inventoryProducts,
                          )
                          return (
                            <article
                              key={addOn.id}
                              className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card"
                            >
                              <div className="relative h-32 w-full bg-muted">
                                <Image
                                  src={cardImageUrl}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 100vw, 280px"
                                />
                              </div>
                              <div className="flex flex-1 flex-col p-4">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-foreground">
                                    {addOn.name}
                                  </p>
                                  {addOn.isPopular ? (
                                    <Badge variant="secondary" className="text-[10px]">
                                      Popular
                                    </Badge>
                                  ) : null}
                                  {isSelected ? (
                                    <Badge className="text-[10px]">Selected</Badge>
                                  ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground">{addOn.description}</p>
                                <p className="text-xs font-medium text-foreground">
                                  {addOn.pricingLabel}
                                </p>
                              </div>
                              <div className="mt-4 flex flex-1 flex-col justify-end gap-2">
                                <Button
                                  type="button"
                                  variant={isSelected ? 'outline' : 'default'}
                                  className="w-full"
                                  onClick={() => setConfiguratorAddOnId(addOn.id)}
                                >
                                  {isSelected ? 'Edit selection' : 'Select add-on'}
                                </Button>
                                {isSelected ? (
                                  <p className="text-xs text-muted-foreground">
                                    {(() => {
                                      const qty = selection?.quantity ?? 0
                                      const unit = selection?.unitPrice ?? addOn.price
                                      if (qty > 1) {
                                        return `${qty} × ${formatPrice(unit)} · ${formatPrice(unit * qty)}`
                                      }
                                      return formatPrice(unit)
                                    })()}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    From {formatPrice(addOn.price)}
                                  </p>
                                )}
                              </div>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" onClick={() => setCustomizeModalOpen(false)}>
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <EventAddOnConfiguratorModal
            open={configuratorAddOnId !== null}
            onOpenChange={(open) => {
              if (!open) {
                setConfiguratorAddOnId(null)
              }
            }}
            item={configuratorItem}
            cafeProduct={configuratorCafeProduct}
            cafeProducts={MOCK_CAFE_PRODUCTS}
            modifierGroups={MOCK_MODIFIER_GROUPS}
            attributeGroups={MOCK_ATTRIBUTE_GROUPS}
            inventoryProducts={inventoryProducts}
            existing={configuratorExisting}
            onDone={(addOnId, configuration) => {
              form.setOptionalAddOnFromConfiguration(addOnId, configuration)
              setConfiguratorAddOnId(null)
            }}
            onRemove={(addOnId) => {
              form.clearOptionalAddOn(addOnId)
              setConfiguratorAddOnId(null)
            }}
          />
        </div>
      ) : null}

      {!bookingComplete && step === 6 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Review & pay</h3>
          <div className={embeddedSummaryClass(embedded, 'p-3 text-sm')}>
            <p className="font-medium text-foreground">{form.selectedPackage?.name ?? 'No package selected'}</p>
            <p className="text-muted-foreground">
              {form.selectedDate} ·{' '}
              {form.selectedWindow
                ? new Date(form.selectedWindow.startAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'No time selected'}
            </p>
            <p className="text-muted-foreground">
              {form.childrenCount} children, {form.adultsCount} adults
            </p>
          </div>
          <BookingFlowCouponSection
            pricingResetKey={pricingResetKey}
            totalBeforeCoupon={form.totalBeforeCoupon}
            grandTotal={form.grandTotal}
            checkoutCouponDiscount={form.couponDiscount}
            setCoupon={form.setCoupon}
            appliedCouponCode={form.couponCode}
            appliedCouponDiscount={form.couponDiscount}
            hasActiveSubscription={hasSubscriptionForCoupons}
            contactId={primaryContact?.id}
            isFreeInfant={false}
            freeInfantMonths={null}
            depositPercent={null}
            depositDueToday={null}
            depositDueOnArrival={null}
            totalLabel={
              <span className="flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" />
                Total
              </span>
            }
          />
          <div className="space-y-2">
            <Label htmlFor="party-notes">Notes</Label>
            <Textarea
              id="party-notes"
              value={form.notes}
              onChange={(event) => form.setNotes(event.target.value)}
              rows={3}
            />
          </div>
          <div className={embeddedSummaryClass(embedded, 'p-3 text-sm')}>
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(form.totalBeforeCoupon)}</span>
            </p>
            <p className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{formatPrice(form.couponDiscount)}</span>
            </p>
            <p className="mt-2 flex items-center justify-between text-base font-semibold text-foreground">
              <span>Total due</span>
              <span>{formatPrice(form.grandTotal)}</span>
            </p>
          </div>
          <Button type="button" className="w-full" onClick={submit} disabled={!form.canSubmit}>
            {form.selectedPackage?.isWholeVenue
              ? 'Submit inquiry and add to cart'
              : getPlayBookingConfirmCartLabel()}
          </Button>
        </div>
      ) : null}

      {!bookingComplete ? (
        <div className="mt-6 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
            Back
          </Button>
          <Button
            type="button"
            onClick={nextStep}
            disabled={
              !canStart ||
              (step === 1 && !form.canContinueFromOccasion) ||
              (showPackageStep && step === 2 && !form.selectedPackageId) ||
              (step === 3 && !form.canContinueFromTiming)
            }
          >
            {step < 6 ? 'Continue' : 'Finish'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
