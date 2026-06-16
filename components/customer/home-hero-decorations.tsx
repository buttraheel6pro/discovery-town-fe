/** Hand-drawn style sparkles and heart accents for the homepage hero headline. */

import { cn } from "@/lib/utils";

interface HeroSunSparklesProps {
  readonly className?: string;
}

export function HeroSunSparkles({ className }: HeroSunSparklesProps) {
  return (
    <svg
      viewBox="0 0 42 36"
      className={cn("h-9 w-10 sm:h-11 sm:w-12", className)}
      aria-hidden
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3.5"
        className="text-[#F1A619]" // Matches the bright warm gold/yellow sun accents
      >
        {/* Three hand-drawn outward rays */}
        <line x1="8" y1="28" x2="2" y2="20" />
        <line x1="18" y1="24" x2="12" y2="8" />
        <line x1="28" y1="28" x2="32" y2="14" />
      </g>
    </svg>
  );
}

interface HeroOutlineHeartProps {
  readonly className?: string;
}

export function HeroOutlineHeart({ className }: HeroOutlineHeartProps) {
  return (
    <svg
      viewBox="0 0 32 30"
      className={cn("h-8 w-8 sm:h-10 sm:w-10", className)}
      aria-hidden
    >
      <path
        d="M16 26 C10 20.5 3 16 3 10.5 C3 6.5 6 3.5 10 3.5 C12.5 3.5 14.8 4.8 16 6.8 C17.2 4.8 19.5 3.5 22 3.5 C26 3.5 29 6.5 29 10.5 C29 16 22 20.5 16 26 Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        className="text-[#2B9A93]" // Matches the vibrant teal line art heart
      />
    </svg>
  );
}
