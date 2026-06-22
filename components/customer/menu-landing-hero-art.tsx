/** Unified SVG background art for consumer menu landing heroes. */
export function MenuLandingHeroArt() {
  return (
    <svg
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMin slice"
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="menu-hero-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A4A5E" />
          <stop offset="45%" stopColor="#3C918C" />
          <stop offset="100%" stopColor="#2F7F79" />
        </linearGradient>
        <linearGradient id="menu-hero-scrim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2A4A5E" stopOpacity="0.92" />
          <stop offset="52%" stopColor="#2A4A5E" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#2A4A5E" stopOpacity="0" />
        </linearGradient>
        <pattern id="menu-hero-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="white" fillOpacity="0.06" />
        </pattern>
      </defs>

      <rect width="1440" height="320" fill="url(#menu-hero-bg)" />
      <rect width="1440" height="320" fill="url(#menu-hero-dots)" />
      <rect width="1440" height="320" fill="url(#menu-hero-scrim)" />

      <circle cx="1220" cy="88" r="108" fill="white" fillOpacity="0.06" />
      <circle cx="1340" cy="156" r="72" fill="white" fillOpacity="0.05" />
      <circle cx="1140" cy="176" r="52" fill="#E87722" fillOpacity="0.12" />
    </svg>
  )
}
