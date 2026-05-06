/** Horizontal, scrollable section breadcrumbs used across customer pages. */
'use client'

const SCROLL_TOP_OFFSET = 132

export interface ScrollableSectionBreadcrumbItem {
  readonly id: string
  readonly label: string
  readonly href: string
}

interface ScrollableSectionBreadcrumbsProps {
  readonly items: readonly ScrollableSectionBreadcrumbItem[]
}

export function ScrollableSectionBreadcrumbs({
  items,
}: Readonly<ScrollableSectionBreadcrumbsProps>) {
  if (items.length === 0) {
    return null
  }

  function scrollToSection(href: string) {
    if (typeof window === 'undefined') return
    if (!href.startsWith('#')) return
    const targetId = href.slice(1)
    if (!targetId) return
    const target = document.getElementById(targetId)
    if (!target) return
    const targetTop = target.getBoundingClientRect().top + window.scrollY - SCROLL_TOP_OFFSET
    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    })
  }

  return (
    <div className="overflow-hidden">
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="shrink-0 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
            onClick={(event) => {
              if (!item.href.startsWith('#')) return
              event.preventDefault()
              scrollToSection(item.href)
            }}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}
