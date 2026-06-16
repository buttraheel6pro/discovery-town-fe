/** Lazy-loaded image with skeleton placeholder and fade-in on load. */
'use client'

import { useState } from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

interface LazyFadeImageProps {
  readonly src: string
  readonly alt: string
  readonly fill?: boolean
  readonly width?: number
  readonly height?: number
  readonly priority?: boolean
  readonly shouldLoad?: boolean
  readonly className?: string
  readonly sizes?: string
}

export function LazyFadeImage({
  src,
  alt,
  fill = false,
  width,
  height,
  priority = false,
  shouldLoad = true,
  className,
  sizes,
}: LazyFadeImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <div
        className={cn(
          'absolute inset-0 bg-muted transition-opacity duration-500',
          loaded ? 'opacity-0' : 'animate-pulse opacity-100',
        )}
        aria-hidden
      />
      {shouldLoad ? (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          sizes={sizes}
          className={cn(
            'transition-opacity duration-700 ease-out',
            loaded ? 'opacity-100' : 'opacity-0',
            className,
          )}
          onLoad={() => setLoaded(true)}
        />
      ) : null}
    </>
  )
}
