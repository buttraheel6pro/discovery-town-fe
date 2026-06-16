/** Navbar icons — colored illustrations above each customer nav link. */

import type { ReactNode } from 'react'

import type { CustomerNavLabelKey } from '@/lib/customer-nav-labels'
import { cn } from '@/lib/utils'

interface NavIconProps {
  readonly className?: string
}

function NavBalloonIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M16 6 C11 6 8 10 8 14.5 C8 19 11 22 16 26 C21 22 24 19 24 14.5 C24 10 21 6 16 6 Z"
        className="fill-brand-orange"
      />
      <path
        d="M16 26 L14 31 M16 26 L18 31"
        className="stroke-brand-orange"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function NavEventsIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect
        x="6"
        y="8"
        width="20"
        height="18"
        rx="3"
        className="fill-brand-teal"
      />
      <rect x="6" y="8" width="20" height="6" rx="3" className="fill-brand-teal" />
      <path
        d="M11 5 V10 M21 5 V10"
        className="stroke-brand-teal"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 17 L17.8 19.5 L15 19 L16.5 21.5 L14 19.5 L16 17 Z"
        className="fill-white"
      />
    </svg>
  )
}

function NavRentalsIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M6 24 H26 V14 L16 8 L6 14 Z"
        className="fill-brand-gold"
      />
      <rect x="10" y="17" width="5" height="7" rx="1" className="fill-brand-orange/90" />
      <rect x="17" y="17" width="5" height="7" rx="1" className="fill-brand-orange/90" />
      <path
        d="M6 14 H26"
        className="stroke-brand-orange"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M16 8 V14"
        className="stroke-brand-orange"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  )
}

function NavCafeIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M8 12 H20 C22 12 23 13.5 23 15.5 C23 17.5 22 19 20 19 H8 Z"
        className="fill-[#8b5e3c]"
      />
      <rect x="8" y="19" width="10" height="3" rx="1" className="fill-[#8b5e3c]" />
      <path
        d="M12 8 C11 6 13 4 14 6 M16 7 C15 5 17 3 18 5 M20 8 C19 6 21 4 22 6"
        className="stroke-[#8b5e3c]"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function NavShopIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M10 12 L12 7 H20 L22 12 Z"
        className="fill-brand-teal"
      />
      <rect x="8" y="12" width="16" height="14" rx="2" className="fill-brand-teal" />
      <path
        d="M16 17 C14.5 17 13.5 18.5 14 20 C14.5 21.5 16 22 16 22 C16 22 17.5 21.5 18 20 C18.5 18.5 17.5 17 16 17 Z"
        className="fill-brand-gold"
      />
    </svg>
  )
}

function NavGiftsIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="7" y="14" width="18" height="12" rx="2" className="fill-brand-teal" />
      <rect x="7" y="11" width="18" height="5" rx="1.5" className="fill-brand-teal" />
      <rect x="14.5" y="11" width="3" height="15" className="fill-brand-gold" />
      <path
        d="M16 11 C16 8 12 7 11 9.5 C10 11.5 13 12.5 16 11 Z M16 11 C16 8 20 7 21 9.5 C22 11.5 19 12.5 16 11 Z"
        className="fill-brand-orange"
      />
    </svg>
  )
}

function NavGymIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="4" y="14" width="4" height="4" rx="1" className="fill-brand-orange" />
      <rect x="24" y="14" width="4" height="4" rx="1" className="fill-brand-orange" />
      <rect x="8" y="15" width="16" height="2" rx="1" className="fill-brand-orange" />
      <rect x="10" y="12" width="2" height="8" rx="1" className="fill-brand-orange" />
      <rect x="20" y="12" width="2" height="8" rx="1" className="fill-brand-orange" />
    </svg>
  )
}

function NavLearnIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M6 10 L16 6 L26 10 V22 L16 26 L6 22 Z"
        className="fill-brand-teal"
      />
      <path
        d="M16 6 V26 M6 10 L16 14 L26 10"
        className="stroke-white/90"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  )
}

const NAV_ICON_MAP: Record<CustomerNavLabelKey, (props: NavIconProps) => ReactNode> = {
  play: NavBalloonIcon,
  events: NavEventsIcon,
  rentals: NavRentalsIcon,
  cafeFood: NavCafeIcon,
  shop: NavShopIcon,
  gifts: NavGiftsIcon,
  gym: NavGymIcon,
  learn: NavLearnIcon,
}

interface CustomerNavIconProps extends NavIconProps {
  readonly navKey: CustomerNavLabelKey
}

export function CustomerNavIcon({ navKey, className }: CustomerNavIconProps) {
  const Icon = NAV_ICON_MAP[navKey]
  return <Icon className={cn('h-8 w-8 sm:h-9 sm:w-9', className)} />
}
