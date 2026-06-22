/** Illustration icons for menu landing highlight cards. */

interface HighlightIconProps {
  readonly className?: string
}

export function HighlightLearningIcon({ className }: HighlightIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect x="10" y="8" width="28" height="34" rx="3" className="fill-chart-3" />
      <rect x="14" y="12" width="20" height="3" rx="1.5" className="fill-background/70" />
      <rect x="14" y="18" width="16" height="2.5" rx="1.25" className="fill-background/55" />
      <rect x="14" y="23" width="18" height="2.5" rx="1.25" className="fill-background/55" />
      <rect x="32" y="6" width="3" height="14" rx="1" className="fill-brand-gold" />
    </svg>
  )
}

export function HighlightImaginativeIcon({ className }: HighlightIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="22" r="14" className="fill-chart-4" />
      <circle cx="34" cy="34" r="7" className="fill-brand-gold" />
      <path
        d="M31 34 L33 36 L37 32"
        fill="none"
        className="stroke-brand-navy"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HighlightMemoriesIcon({ className }: HighlightIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect x="8" y="10" width="32" height="28" rx="4" className="fill-chart-3" />
      <rect x="12" y="14" width="8" height="6" rx="1" className="fill-background/80" />
      <rect x="22" y="14" width="8" height="6" rx="1" className="fill-background/80" />
      <rect x="12" y="22" width="8" height="6" rx="1" className="fill-background/80" />
      <rect x="22" y="22" width="8" height="6" rx="1" className="fill-background/80" />
    </svg>
  )
}

export function HighlightCoffeeIcon({ className }: HighlightIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="22" r="14" className="fill-chart-4" />
      <path
        d="M18 30 C18 24 21 20 24 20 C27 20 30 24 30 30"
        fill="none"
        className="stroke-background"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="34" cy="34" r="7" className="fill-brand-gold" />
    </svg>
  )
}
