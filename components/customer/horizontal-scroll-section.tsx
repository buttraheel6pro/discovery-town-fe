/** Horizontal product/service rail with optional heading actions. */
'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { ProminentSectionContainer } from '@/components/customer/prominent-section-container'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HorizontalScrollSectionProps {
  readonly title: string
  readonly description?: string
  readonly viewAllHref?: string
  readonly children: React.ReactNode
  readonly className?: string
}

const SCROLL_DISTANCE = 340

export function HorizontalScrollSection({
  title,
  description,
  viewAllHref,
  children,
  className,
}: Readonly<HorizontalScrollSectionProps>) {
  const railRef = useRef<HTMLDivElement | null>(null)

  const handleScroll = (direction: 'left' | 'right') => {
    const node = railRef.current
    if (!node) {
      return
    }

    const distance = direction === 'left' ? -SCROLL_DISTANCE : SCROLL_DISTANCE
    node.scrollBy({ left: distance, behavior: 'smooth' })
  }

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
          <div className="flex items-center gap-2">
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
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
      </ProminentSectionContainer>
    </section>
  )
}
