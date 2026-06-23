/** Booking cart card shell — nav-cream (#FFF7E9) surface matching the navbar. */
'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export const BOOKING_CART_SURFACE_CLASS = 'bg-nav-cream'

/** White interiors for inputs on nav-cream cards (shadcn fields default to bg-transparent). */
export const BOOKING_CART_FORM_FIELD_CLASS =
  '[&_[data-slot=input]]:bg-white [&_[data-slot=textarea]]:bg-white [&_[data-slot=select-trigger]]:bg-white [&_button.bg-background]:bg-white'

/** Bordered option row on booking cart forms (passes, adults, add-ons). */
export const BOOKING_CART_OPTION_ROW_CLASS =
  'rounded-lg border border-border bg-white'

/** Quantity stepper cluster inside booking option rows. */
export const BOOKING_CART_STEPPER_CLASS =
  'flex items-center gap-1 rounded-md border border-border bg-white px-1 py-0.5'

interface BookingCartCardProps {
  readonly className?: string
  readonly children: ReactNode
}

export function BookingCartCard({ className, children }: Readonly<BookingCartCardProps>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border py-4 shadow-xl',
        BOOKING_CART_SURFACE_CLASS,
        className,
      )}
      style={{ backgroundColor: 'var(--nav-cream)' }}
    >
      {children}
    </div>
  )
}

interface BookingCartCardSectionProps {
  readonly className?: string
  readonly children: ReactNode
}

export function BookingCartCardHeader({
  className,
  children,
}: Readonly<BookingCartCardSectionProps>) {
  return <div className={cn('px-6 pb-3', className)}>{children}</div>
}

export function BookingCartCardTitle({
  className,
  children,
}: Readonly<BookingCartCardSectionProps>) {
  return (
    <div className={cn('text-lg font-bold leading-none text-foreground', className)}>
      {children}
    </div>
  )
}

export function BookingCartCardContent({
  className,
  children,
}: Readonly<BookingCartCardSectionProps>) {
  return (
    <div className={cn('px-6', BOOKING_CART_FORM_FIELD_CLASS, className)}>{children}</div>
  )
}
