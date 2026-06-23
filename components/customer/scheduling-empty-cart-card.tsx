/** Empty cart sidebar — same card shell as facility booking “Add to cart”. */
'use client'

import Image from 'next/image'

import {
  BookingCartCard,
  BookingCartCardContent,
  BookingCartCardHeader,
  BookingCartCardTitle,
} from '@/components/customer/booking-cart-card'

const CART_ICON_SRC = '/Img.svg'

export function SchedulingEmptyCartCard() {
  return (
    <BookingCartCard>
      <BookingCartCardHeader>
        <BookingCartCardTitle>Your cart</BookingCartCardTitle>
      </BookingCartCardHeader>
      <BookingCartCardContent className="space-y-4 py-10 text-center">
        <Image
          src={CART_ICON_SRC}
          alt=""
          width={44}
          height={44}
          className="mx-auto h-14 w-14"
          aria-hidden
        />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Your cart is empty.</p>
          <p className="text-sm text-muted-foreground">Add some items to get started</p>
        </div>
      </BookingCartCardContent>
    </BookingCartCard>
  )
}
