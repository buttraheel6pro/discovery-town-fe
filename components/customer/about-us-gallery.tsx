/** Carousel photo gallery for the About Us page — prev/next controls and auto-advance. */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { LazyFadeImage } from '@/components/customer/lazy-fade-image'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { ABOUT_GALLERY_IMAGES } from '@/lib/about-faq-content'
import { cn } from '@/lib/utils'

const AUTO_ADVANCE_MS = 5000

export interface AboutUsGalleryProps {
  readonly className?: string
}

export function AboutUsGallery({ className }: Readonly<AboutUsGalleryProps>) {
  const [api, setApi] = useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    setCurrentIndex(carouselApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!api) {
      return undefined
    }

    onSelect(api)
    api.on('select', onSelect)
    api.on('reInit', onSelect)

    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api, onSelect])

  useEffect(() => {
    if (!api || isPaused) {
      return undefined
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (prefersReducedMotion) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      api.scrollNext()
    }, AUTO_ADVANCE_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [api, isPaused])

  const navButtonClassName = cn(
    'absolute top-1/2 z-10 size-11 -translate-y-1/2 rounded-md border-0 shadow-sm',
    'bg-accent text-accent-foreground hover:bg-accent/90',
  )

  return (
    <section
      className={cn('relative w-full', className)}
      aria-label="Discovery Town photo gallery"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false)
        }
      }}
    >
      <div className="relative w-full">
        <Carousel setApi={setApi} opts={{ loop: true, align: 'center' }} className="w-full">
          <CarouselContent className="-ml-0">
            {ABOUT_GALLERY_IMAGES.map((image) => (
              <CarouselItem key={image.src} className="basis-full pl-0">
                <figure className="relative aspect-[16/9] max-h-[22rem] w-full overflow-hidden rounded-3xl border border-border shadow-lg sm:max-h-[24rem]">
                  <LazyFadeImage
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 1280px) 100vw, 80rem"
                    className="object-cover object-center"
                  />
                </figure>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <Button
          type="button"
          variant="default"
          size="icon"
          className={cn(navButtonClassName, 'left-3 sm:left-4')}
          aria-label="Previous photo"
          onClick={() => api?.scrollPrev()}
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Button>

        <Button
          type="button"
          variant="default"
          size="icon"
          className={cn(navButtonClassName, 'right-3 sm:right-4')}
          aria-label="Next photo"
          onClick={() => api?.scrollNext()}
        >
          <ChevronRight className="size-6" aria-hidden />
        </Button>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground" aria-live="polite">
        {currentIndex + 1} of {ABOUT_GALLERY_IMAGES.length}
      </p>
    </section>
  )
}
