/** Horizontal, scrollable section breadcrumbs used across customer pages. */

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

  return (
    <div className="overflow-hidden">
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="shrink-0 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}
