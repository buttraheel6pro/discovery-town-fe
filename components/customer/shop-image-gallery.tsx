/** ShopImageGallery — product image gallery with thumbnails + keyboard + swipe. */
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

export interface ShopImageGalleryProps {
  readonly images: string[]
  readonly alt: string
  readonly className?: string
  /**
   * When true, the hero image grows to fill available column height (gift detail beside tall copy).
   * Thumbnails stay fixed height below.
   */
  readonly fillMainHeight?: boolean
}

const SHOP_FALLBACK_SRC = '/placeholder.jpg'
const PLACEHOLDER_SRC = '/placeholder.jpg'

export function ShopImageGallery({
  images,
  alt,
  className,
  fillMainHeight = false,
}: Readonly<ShopImageGalleryProps>) {
  const sanitized = useMemo(() => {
    const cleaned = images.filter((i) => i && i.trim().length > 0)
    return cleaned.length ? cleaned : [SHOP_FALLBACK_SRC]
  }, [images])

  const [activeIdx, setActiveIdx] = useState(0)
  const [usePlaceholder, setUsePlaceholder] = useState(false)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    setActiveIdx(0)
    setUsePlaceholder(false)
  }, [sanitized.join('|')])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (sanitized.length <= 1) return
      if (e.key === 'ArrowLeft') {
        setActiveIdx((i) => (i - 1 + sanitized.length) % sanitized.length)
      }
      if (e.key === 'ArrowRight') {
        setActiveIdx((i) => (i + 1) % sanitized.length)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sanitized.length])

  const activeSrc = usePlaceholder ? PLACEHOLDER_SRC : (sanitized[activeIdx] ?? PLACEHOLDER_SRC)

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current
    const dx = endX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(dx) < 40) return
    if (dx > 0) {
      setActiveIdx((i) => (i - 1 + sanitized.length) % sanitized.length)
    } else {
      setActiveIdx((i) => (i + 1) % sanitized.length)
    }
  }

  return (
    <div
      className={cn(
        fillMainHeight ? 'flex h-full min-h-0 flex-1 flex-col gap-3' : 'space-y-3',
        className,
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-border bg-muted/30',
          fillMainHeight
            ? 'min-h-[14rem] w-full flex-1 lg:min-h-0'
            : 'aspect-[4/3]',
        )}
        style={{ touchAction: 'pan-y' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={activeSrc}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          onError={() => setUsePlaceholder(true)}
        />
      </div>

      {sanitized.length > 1 ? (
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1">
          {sanitized.map((src, idx) => {
            const active = idx === activeIdx
            return (
              <button
                key={`${src}-${idx}`}
                type="button"
                className={cn(
                  'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border',
                  active ? 'border-accent' : 'border-border hover:border-muted-foreground/40',
                )}
                onClick={() => setActiveIdx(idx)}
                aria-label={`Select image ${idx + 1}`}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="64px" />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

