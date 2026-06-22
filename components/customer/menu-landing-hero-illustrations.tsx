/** Module-specific vector illustrations for menu landing heroes — shared visual style. */
import type { ReactElement } from 'react'

import type { MenuLandingHeroKey } from '@/lib/menu-landing-hero-config'

const STROKE = '#FFF5E5'
const STROKE_MUTED = 'rgba(255,245,229,0.55)'
const FILL_ACCENT = '#E87722'
const FILL_GOLD = '#F2A900'
const FILL_SOFT = 'rgba(255,255,255,0.14)'

interface ModuleIllustrationProps {
  readonly menuKey: MenuLandingHeroKey
}

function PlayIllustration() {
  return (
    <g>
      <rect x="24" y="120" width="200" height="16" rx="8" fill={FILL_SOFT} />
      <path
        d="M48 120 L88 56 L168 56 L208 120 Z"
        fill={FILL_SOFT}
        stroke={STROKE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="188" cy="188" r="28" fill={FILL_ACCENT} fillOpacity="0.9" />
      <path d="M188 160 L188 216 M160 188 L216 188" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

function GymIllustration() {
  return (
    <g>
      <rect x="40" y="108" width="160" height="12" rx="6" fill={FILL_SOFT} />
      <rect x="72" y="56" width="96" height="12" rx="6" fill={FILL_GOLD} fillOpacity="0.85" />
      <rect x="20" y="68" width="24" height="56" rx="8" fill={FILL_SOFT} stroke={STROKE} strokeWidth="3" />
      <rect x="196" y="68" width="24" height="56" rx="8" fill={FILL_SOFT} stroke={STROKE} strokeWidth="3" />
      <circle cx="120" cy="132" r="32" fill="none" stroke={STROKE_MUTED} strokeWidth="3" strokeDasharray="8 10" />
    </g>
  )
}

function EventsIllustration() {
  return (
    <g>
      <path
        d="M120 40 L148 96 L208 104 L164 144 L176 188 L120 164 L64 188 L76 144 L32 104 L92 96 Z"
        fill={FILL_GOLD}
        fillOpacity="0.9"
        stroke={STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect x="88" y="176" width="64" height="40" rx="8" fill={FILL_SOFT} stroke={STROKE} strokeWidth="3" />
      <circle cx="56" cy="72" r="8" fill={FILL_ACCENT} />
      <circle cx="184" cy="60" r="6" fill={FILL_ACCENT} fillOpacity="0.7" />
    </g>
  )
}

function LearnIllustration() {
  return (
    <g>
      <path
        d="M32 72 L120 40 L208 72 V152 C208 160 120 184 120 184 C120 184 32 160 32 152 Z"
        fill={FILL_SOFT}
        stroke={STROKE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M120 40 V184" stroke={STROKE_MUTED} strokeWidth="3" />
      <circle cx="176" cy="56" r="22" fill={FILL_GOLD} fillOpacity="0.85" stroke={STROKE} strokeWidth="3" />
      <path d="M176 50 V62 M170 56 H182" stroke={STROKE} strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

function ShopIllustration() {
  return (
    <g>
      <path
        d="M56 88 H184 L168 176 H72 L56 88 Z"
        fill={FILL_SOFT}
        stroke={STROKE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M72 88 L88 56 H152 L168 88" fill="none" stroke={STROKE} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="120" cy="140" r="20" fill={FILL_ACCENT} fillOpacity="0.85" />
    </g>
  )
}

function CafeIllustration() {
  return (
    <g>
      <path
        d="M72 152 H168 V96 C168 76 144 64 120 64 C96 64 72 76 72 96 Z"
        fill={FILL_SOFT}
        stroke={STROKE}
        strokeWidth="4"
      />
      <path d="M168 104 H196 C208 104 216 112 216 124 C216 136 208 144 196 144 H168" fill="none" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M96 40 C96 52 104 60 112 60" stroke={STROKE_MUTED} strokeWidth="3" strokeLinecap="round" />
      <path d="M120 32 C120 48 128 56 136 56" stroke={STROKE_MUTED} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="120" cy="112" rx="28" ry="10" fill={FILL_GOLD} fillOpacity="0.5" />
    </g>
  )
}

function RentalsIllustration() {
  return (
    <g>
      <path
        d="M40 160 H200 L160 64 H80 L40 160 Z"
        fill={FILL_SOFT}
        stroke={STROKE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M80 64 L120 36 L160 64" fill="none" stroke={STROKE} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="64" cy="48" r="14" fill={FILL_ACCENT} fillOpacity="0.8" />
      <line x1="64" y1="34" x2="64" y2="18" stroke={STROKE_MUTED} strokeWidth="3" strokeLinecap="round" />
      <circle cx="176" cy="40" r="12" fill={FILL_GOLD} fillOpacity="0.85" />
      <line x1="176" y1="28" x2="176" y2="12" stroke={STROKE_MUTED} strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

function GiftsIllustration() {
  return (
    <g>
      <rect x="56" y="80" width="128" height="88" rx="10" fill={FILL_SOFT} stroke={STROKE} strokeWidth="4" />
      <rect x="56" y="108" width="128" height="12" fill={FILL_GOLD} fillOpacity="0.75" />
      <rect x="112" y="80" width="16" height="88" fill={FILL_GOLD} fillOpacity="0.75" />
      <path d="M88 80 C88 60 104 52 120 64 C136 52 152 60 152 80" fill="none" stroke={FILL_ACCENT} strokeWidth="5" strokeLinecap="round" />
      <circle cx="176" cy="52" r="10" fill={FILL_ACCENT} fillOpacity="0.75" />
    </g>
  )
}

const ILLUSTRATIONS: Record<MenuLandingHeroKey, () => ReactElement> = {
  play: PlayIllustration,
  gym: GymIllustration,
  events: EventsIllustration,
  learn: LearnIllustration,
  shop: ShopIllustration,
  cafe: CafeIllustration,
  rentals: RentalsIllustration,
  gifts: GiftsIllustration,
}

export function MenuLandingHeroIllustration({ menuKey }: ModuleIllustrationProps) {
  const Illustration = ILLUSTRATIONS[menuKey]

  return (
    <svg
      viewBox="0 0 240 220"
      className="h-auto w-full max-w-[5.5rem] sm:max-w-[9rem] lg:max-w-[13rem]"
      aria-hidden
    >
      <Illustration />
    </svg>
  )
}
