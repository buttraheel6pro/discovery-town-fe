/** Location form — shared fields for create/edit modals. */
'use client'

import Image from 'next/image'
import { useId, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { OperatingHours } from '@/lib/types'

export interface LocationDraft {
  readonly name: string
  readonly address: string
  readonly city: string
  readonly country: string
  readonly postcode: string
  readonly timezone: string
  readonly isActive: boolean
  readonly phone: string
  readonly email: string
  readonly imageUrl: string
  readonly operatingHours: OperatingHours[]
}

export interface LocationFormProps {
  readonly value: LocationDraft
  readonly onChange: (next: LocationDraft) => void
  readonly disabled?: boolean
  readonly className?: string
}

export function LocationForm({
  value,
  onChange,
  disabled = false,
  className,
}: Readonly<LocationFormProps>) {
  const fileInputId = useId()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function setOperatingHour(dayOfWeek: number, patch: Partial<OperatingHours>) {
    const next = value.operatingHours.map((h) =>
      h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h,
    )
    onChange({ ...value, operatingHours: next })
  }

  async function handleFileSelected(file: File) {
    setUploadError(null)

    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.')
      return
    }
    if (file.size > 2_500_000) {
      setUploadError('Please choose an image smaller than 2.5MB.')
      return
    }

    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.readAsDataURL(file)
    })

    if (!dataUrl.startsWith('data:image/')) {
      setUploadError('Unsupported image format.')
      return
    }

    onChange({ ...value, imageUrl: dataUrl })
  }

  const orderedHours = value.operatingHours.slice().sort((a, b) => a.dayOfWeek - b.dayOfWeek)
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={cn('grid grid-cols-1 gap-6 lg:grid-cols-12', className)}>
      <div className="lg:col-span-7">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Details</p>
              <p className="mt-1 text-xs text-muted-foreground">
                These fields appear across the admin calendar and private hire forms.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={value.isActive}
                onCheckedChange={(checked) => onChange({ ...value, isActive: checked })}
                disabled={disabled}
                aria-label="Location active"
              />
              <span className="text-xs font-semibold text-foreground">
                {value.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="loc-name">Name</Label>
              <Input
                id="loc-name"
                value={value.name}
                onChange={(e) => onChange({ ...value, name: e.target.value })}
                placeholder="Discovery Town Main Centre"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="loc-address">Address</Label>
              <Input
                id="loc-address"
                value={value.address}
                onChange={(e) => onChange({ ...value, address: e.target.value })}
                placeholder="123 Adventure Way"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loc-city">City</Label>
              <Input
                id="loc-city"
                value={value.city}
                onChange={(e) => onChange({ ...value, city: e.target.value })}
                placeholder="Indianapolis"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loc-postcode">Postcode</Label>
              <Input
                id="loc-postcode"
                value={value.postcode}
                onChange={(e) => onChange({ ...value, postcode: e.target.value })}
                placeholder="M1 2AB"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loc-country">Country</Label>
              <Input
                id="loc-country"
                value={value.country}
                onChange={(e) => onChange({ ...value, country: e.target.value })}
                placeholder="United Kingdom"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loc-timezone">Timezone</Label>
              <Input
                id="loc-timezone"
                value={value.timezone}
                onChange={(e) => onChange({ ...value, timezone: e.target.value })}
                placeholder="America/Indiana/Indianapolis"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loc-phone">Phone</Label>
              <Input
                id="loc-phone"
                value={value.phone}
                onChange={(e) => onChange({ ...value, phone: e.target.value })}
                placeholder="0161 123 4567"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="loc-email">Email</Label>
              <Input
                id="loc-email"
                value={value.email}
                onChange={(e) => onChange({ ...value, email: e.target.value })}
                placeholder="hello@discoverytown.co.uk"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Location image</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a logo or venue photo. Stored locally for the current mock-backed experience.
          </p>

          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-muted/20">
            <div className="relative aspect-video">
              {value.imageUrl ? (
                <Image
                  src={value.imageUrl}
                  alt="Location image preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-6 text-center text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground/80">No image yet</p>
                  <p>Upload a JPG/PNG to show in location pickers.</p>
                </div>
              )}
            </div>
          </div>

          <input
            ref={fileRef}
            id={fileInputId}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              void handleFileSelected(file)
              e.currentTarget.value = ''
            }}
          />

          {uploadError ? (
            <p className="mt-3 text-sm font-medium text-destructive" role="alert">
              {uploadError}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={disabled}
            >
              Upload image
            </Button>
            {value.imageUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onChange({ ...value, imageUrl: '' })}
                disabled={disabled}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="lg:col-span-12">
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Operating hours</p>
              <p className="text-xs text-muted-foreground">
                Set open/closed days and working hours for each day of the week.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {orderedHours.map((h) => (
              <div
                key={h.dayOfWeek}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {dayLabels[h.dayOfWeek] ?? `Day ${h.dayOfWeek}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!h.isClosed}
                      onCheckedChange={(checked) =>
                        setOperatingHour(h.dayOfWeek, { isClosed: !checked })
                      }
                      disabled={disabled}
                      aria-label={`${dayLabels[h.dayOfWeek] ?? 'Day'} open`}
                    />
                    {h.isClosed ? (
                      <Badge variant="secondary" className="text-xs font-semibold">
                        Closed
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Open</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      From
                    </p>
                    <Input
                      value={h.openTime}
                      onChange={(e) =>
                        setOperatingHour(h.dayOfWeek, { openTime: e.target.value })
                      }
                      type="time"
                      disabled={disabled || h.isClosed}
                      aria-label={`${dayLabels[h.dayOfWeek] ?? 'Day'} opening time`}
                      className="h-11 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      To
                    </p>
                    <Input
                      value={h.closeTime}
                      onChange={(e) =>
                        setOperatingHour(h.dayOfWeek, { closeTime: e.target.value })
                      }
                      type="time"
                      disabled={disabled || h.isClosed}
                      aria-label={`${dayLabels[h.dayOfWeek] ?? 'Day'} closing time`}
                      className="h-11 text-base"
                    />
                  </div>
                </div>

                <p className="mt-3 text-right text-xs text-muted-foreground">
                  {h.isClosed ? '—' : `${h.openTime}–${h.closeTime}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

