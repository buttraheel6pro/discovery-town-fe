/** Two-step private hire enquiry — validates with shared Zod schema; persists via useCalendar. */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'

import { PrivateHireSuccessCard } from '@/components/customer/private-hire-success-card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCalendar } from '@/lib/calendar-store'
import { useLocations } from '@/lib/location-store'
import { useScheduling } from '@/lib/scheduling-store'
import { cn, privateHireInquirySchema } from '@/lib/utils'
import type { PrivateHireEventType, PrivateHireInquiry } from '@/lib/types'
import { PrivateHireEventTypeEnum } from '@/lib/types'

export interface PrivateHireInquiryFormProps {
  readonly prefilledServiceId?: string
  readonly prefilledLocationId?: string
  readonly prefilledStartAt?: string
  readonly prefilledEndAt?: string
  readonly onSubmitted?: (inquiry: PrivateHireInquiry) => void
}

const eventOptions: { value: PrivateHireEventType; label: string }[] = [
  { value: PrivateHireEventTypeEnum.BIRTHDAY_PARTY, label: 'Birthday party' },
  { value: PrivateHireEventTypeEnum.CORPORATE, label: 'Corporate event' },
  { value: PrivateHireEventTypeEnum.OTHER, label: 'Other' },
]

export function PrivateHireInquiryForm({
  prefilledServiceId,
  prefilledLocationId,
  prefilledStartAt,
  prefilledEndAt: _prefilledEndAt,
  onSubmitted,
}: Readonly<PrivateHireInquiryFormProps>) {
  const { addInquiry } = useCalendar()
  const { services } = useScheduling()
  const { locations } = useLocations()
  const hireServices = useMemo(
    () => services.filter((s) => s.serviceType === 'PRIVATE_HIRE' && s.isActive),
    [services],
  )

  const [step, setStep] = useState<1 | 2>(1)
  const [submitted, setSubmitted] = useState<PrivateHireInquiry | null>(null)

  const [eventType, setEventType] = useState<PrivateHireEventType>(
    PrivateHireEventTypeEnum.BIRTHDAY_PARTY,
  )
  const [serviceId, setServiceId] = useState(prefilledServiceId ?? hireServices[0]?.id ?? '')
  const [locationId, setLocationId] = useState(
    prefilledLocationId ?? locations[0]?.id ?? '',
  )
  const [preferredDay, setPreferredDay] = useState<Date | undefined>(() => {
    if (!prefilledStartAt) return undefined
    try {
      return parseISO(prefilledStartAt)
    } catch {
      return undefined
    }
  })
  const [alternateDay, setAlternateDay] = useState<Date | undefined>(undefined)
  const [guestCount, setGuestCount] = useState(10)
  const [notes, setNotes] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (prefilledStartAt) {
      try {
        setPreferredDay(parseISO(prefilledStartAt))
      } catch {
        /* ignore */
      }
    }
  }, [prefilledStartAt])

  useEffect(() => {
    if (prefilledServiceId) setServiceId(prefilledServiceId)
  }, [prefilledServiceId])

  useEffect(() => {
    if (prefilledLocationId) setLocationId(prefilledLocationId)
  }, [prefilledLocationId])

  const locationName =
    locations.find((l) => l.id === locationId)?.name ?? 'Discovery Town'

  const preferredDateIso = useMemo(() => {
    if (prefilledStartAt) return prefilledStartAt
    if (!preferredDay) return ''
    const d = new Date(preferredDay)
    d.setHours(14, 0, 0, 0)
    return d.toISOString()
  }, [prefilledStartAt, preferredDay])

  const alternateDateIso = useMemo(() => {
    if (!alternateDay) return undefined
    const d = new Date(alternateDay)
    d.setHours(11, 0, 0, 0)
    return d.toISOString()
  }, [alternateDay])

  function handleStep1Next() {
    setFormError(null)
    if (!serviceId || !locationId) {
      setFormError('Please select a package and location.')
      return
    }
    if (!preferredDateIso) {
      setFormError('Please select a preferred date.')
      return
    }
    setStep(2)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)

    const parsed = privateHireInquirySchema.safeParse({
      eventType,
      serviceId,
      locationId,
      preferredDate: preferredDateIso,
      alternateDate: alternateDateIso,
      guestCount,
      notes: notes.trim() || undefined,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      agreedToTerms,
    })

    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors
      const msg =
        Object.values(first)[0]?.[0] ?? 'Please check the form and try again.'
      setFormError(msg)
      return
    }

    const service = services.find((s) => s.id === parsed.data.serviceId)
    if (!service) {
      setFormError('Selected package is no longer available.')
      return
    }

    const inquiry: PrivateHireInquiry = {
      id: `hire-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      contactName: `${parsed.data.firstName} ${parsed.data.lastName}`.trim(),
      contactEmail: parsed.data.email,
      contactPhone: parsed.data.phone,
      eventType: parsed.data.eventType,
      serviceId: parsed.data.serviceId,
      service: { ...service },
      locationId: parsed.data.locationId,
      locationName,
      preferredDate: parsed.data.preferredDate,
      alternateDate: parsed.data.alternateDate ?? null,
      guestCount: parsed.data.guestCount,
      notes: parsed.data.notes ?? null,
      status: 'PENDING',
      depositAmount: null,
      internalNotes: null,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    }

    addInquiry(inquiry)
    setSubmitted(inquiry)
    onSubmitted?.(inquiry)
  }

  if (submitted) {
    return <PrivateHireSuccessCard inquiry={submitted} />
  }

  if (hireServices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Enquiries are not available right now. Please try again later.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn('font-semibold', step === 1 && 'text-foreground')}>1. Event</span>
        <span aria-hidden>/</span>
        <span className={cn('font-semibold', step === 2 && 'text-foreground')}>2. Contact</span>
      </div>

      {formError ? (
        <p className="text-sm text-destructive font-medium" role="alert">
          {formError}
        </p>
      ) : null}

      {step === 1 ? (
        <div className="space-y-5">
          <div className="space-y-3">
            <Label>Event type</Label>
            <RadioGroup
              value={eventType}
              onValueChange={(v) => setEventType(v as PrivateHireEventType)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              {eventOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm font-medium hover:bg-muted/50',
                    eventType === opt.value && 'border-accent ring-1 ring-accent',
                  )}
                >
                  <RadioGroupItem value={opt.value} id={`ev-${opt.value}`} />
                  {opt.label}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Package</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select package" />
              </SelectTrigger>
              <SelectContent>
                {hireServices.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger>
                <SelectValue />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preferred date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    {preferredDay ? format(preferredDay, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={preferredDay}
                    onSelect={setPreferredDay}
                    disabled={(d) => {
                      const t = new Date()
                      t.setHours(0, 0, 0, 0)
                      return d < t
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Alternate date (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    {alternateDay ? format(alternateDay, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={alternateDay} onSelect={setAlternateDay} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Guest count</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                aria-label="Decrease guests"
              >
                –
              </Button>
              <span className="font-bold w-10 text-center">{guestCount}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setGuestCount((g) => g + 1)}
                aria-label="Increase guests"
              >
                +
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ph-notes">Notes (optional)</Label>
            <Textarea
              id="ph-notes"
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Themes, accessibility, setup time…"
            />
            <p className="text-xs text-muted-foreground">{notes.length}/1000</p>
          </div>

          <Button
            type="button"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
            onClick={handleStep1Next}
          >
            Continue
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ph-fn">First name</Label>
              <Input
                id="ph-fn"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph-ln">Last name</Label>
              <Input
                id="ph-ln"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ph-email">Email</Label>
              <Input
                id="ph-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph-phone">Phone</Label>
              <Input
                id="ph-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="ph-terms"
              checked={agreedToTerms}
              onCheckedChange={(v) => setAgreedToTerms(v === true)}
            />
            <Label htmlFor="ph-terms" className="text-sm leading-relaxed font-normal">
              I agree to Discovery Town&apos;s terms and conditions.
            </Label>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
            >
              Submit enquiry
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
