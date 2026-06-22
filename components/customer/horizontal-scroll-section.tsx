/** Horizontal product/service rail with optional heading actions and load-more. */
'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { ProminentSectionContainer } from '@/components/customer/prominent-section-container'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HorizontalScrollSectionProps {
  readonly title: string
  readonly description?: string
  readonly viewAllHref?: string
  readonly headerAction?: React.ReactNode
  readonly children: React.ReactNode
  readonly className?: string
  readonly hasMore?: boolean
  readonly isLoadingMore?: boolean
  readonly onLoadMore?: () => void
  /** When true, fires onLoadMore automatically when the "Load more" button scrolls into view. */
  readonly autoLoadMore?: boolean
}

const SCROLL_DISTANCE = 340

export function HorizontalScrollSection({
  title,
  description,
  viewAllHref,
  headerAction,
  children,
  className,
  hasMore,
  isLoadingMore,
  onLoadMore,
  autoLoadMore,
}: Readonly<HorizontalScrollSectionProps>) {
  const railRef = useRef<HTMLDivElement | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const handleScroll = (direction: 'left' | 'right') => {
    const node = railRef.current
    if (!node) return
    node.scrollBy({ left: direction === 'left' ? -SCROLL_DISTANCE : SCROLL_DISTANCE, behavior: 'smooth' })
  }

  // Auto-trigger loadMore when the load-more button scrolls into view within the rail.
  useEffect(() => {
    if (!autoLoadMore || !hasMore || !onLoadMore || !loadMoreRef.current || !railRef.current) return

    const button = loadMoreRef.current
    const rail = railRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          onLoadMore()
        }
      },
      { root: rail, threshold: 0.5 },
    )

    observer.observe(button)
    return () => observer.disconnect()
  }, [autoLoadMore, hasMore, isLoadingMore, onLoadMore])

  return (
    <section className={cn('space-y-4', className)} aria-label={title}>
      <ProminentSectionContainer>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2
              className="text-xl font-black tracking-tight text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {title}
            </h2>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {headerAction}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label={`Scroll ${title} left`}
              onClick={() => handleScroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label={`Scroll ${title} right`}
              onClick={() => handleScroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {viewAllHref ? (
              <Link href={viewAllHref} className="ml-1">
                <Button type="button" variant="ghost" size="sm" className="font-semibold">
                  View all
                </Button>
              </Link>
            ) : null}
          </div>
        </div>

        <div
          ref={railRef}
          className="flex items-stretch snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}

          {hasMore ? (
            <div ref={loadMoreRef} className="flex shrink-0 snap-start items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-full min-h-[120px] w-28 flex-col gap-2 rounded-xl border-dashed"
                onClick={onLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="text-xs font-semibold">
                  {isLoadingMore ? 'Loading…' : 'Load more'}
                </span>
              </Button>
            </div>
          ) : null}
        </div>
      </ProminentSectionContainer>
    </section>
  )
}
