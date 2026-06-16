/** Custom icons for the homepage values strip — matches brand illustration style. */

interface ValueIconProps {
  readonly className?: string
}

export function ValuesPlayHouseIcon({ className }: ValueIconProps) {
  return (
    <svg
      viewBox="0 0 56 56"
      className={className}
      aria-hidden
    >
      <path
        d="M28 8 L46 22 V44 H34 V32 H22 V44 H10 V22 Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2.5"
        className="text-brand-teal"
      />
      <rect x="24" y="32" width="8" height="12" rx="1" className="fill-brand-teal" />
      <circle cx="16" cy="46" r="3" className="fill-brand-gold" />
      <circle cx="24" cy="48" r="2.5" className="fill-brand-gold" />
      <circle cx="32" cy="48" r="2.5" className="fill-brand-gold" />
      <circle cx="40" cy="46" r="3" className="fill-brand-gold" />
    </svg>
  )
}

export function ValuesLightbulbIcon({ className }: ValueIconProps) {
  return (
    <svg
      viewBox="0 0 56 56"
      className={className}
      aria-hidden
    >
      <g
        className="text-brand-orange"
        stroke="currentColor"
        fill="none"
        strokeWidth="2.25"
        strokeLinecap="round"
      >
        <line x1="28" y1="6" x2="28" y2="10" />
        <line x1="14" y1="12" x2="17" y2="15" />
        <line x1="42" y1="12" x2="39" y2="15" />
        <line x1="8" y1="26" x2="12" y2="26" />
        <line x1="44" y1="26" x2="48" y2="26" />
      </g>
      <path
        d="M22 24 C22 16 34 16 34 24 C34 30 38 32 38 36 H18 C18 32 22 30 22 24 Z"
        fill="currentColor"
        className="text-brand-orange"
      />
      <rect x="20" y="38" width="16" height="4" rx="2" className="fill-brand-orange" />
      <rect x="22" y="43" width="12" height="3" rx="1.5" className="fill-brand-orange/80" />
    </svg>
  )
}

export function ValuesCoffeeIcon({ className }: ValueIconProps) {
  return (
    <svg
      viewBox="0 0 56 56"
      className={className}
      aria-hidden
    >
      <g
        className="text-brand-teal"
        stroke="currentColor"
        fill="none"
        strokeWidth="2.25"
        strokeLinecap="round"
      >
        <path d="M16 22 C16 16 20 12 28 12 C36 12 40 16 40 22" />
        <line x1="20" y1="10" x2="18" y2="6" />
        <line x1="28" y1="8" x2="28" y2="4" />
        <line x1="36" y1="10" x2="38" y2="6" />
      </g>
      <path
        d="M14 24 H42 V38 C42 44 36 48 28 48 C20 48 14 44 14 38 Z"
        fill="currentColor"
        className="text-brand-teal"
      />
      <path
        d="M42 28 H46 C50 28 52 30 52 34 C52 38 50 40 46 40 H42"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        className="text-brand-teal"
      />
    </svg>
  )
}

export function ValuesHeartIcon({ className }: ValueIconProps) {
  return (
    <svg
      viewBox="0 0 56 56"
      className={className}
      aria-hidden
    >
      <path
        d="M28 46 C18 36 10 30 10 22 C10 16 14 12 20 12 C23 12 26 14 28 17 C30 14 33 12 36 12 C42 12 46 16 46 22 C46 30 38 36 28 46 Z"
        className="fill-brand-orange"
      />
    </svg>
  )
}
