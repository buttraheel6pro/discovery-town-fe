/** IntersectionObserver hook — detects when an element enters the viewport. */
import { useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
  readonly rootMargin?: string
  readonly threshold?: number
  readonly once?: boolean
}

export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {},
) {
  const {
    rootMargin = '0px',
    threshold = 0.12,
    once = true,
  } = options

  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return undefined
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }
        setInView(true)
        if (once) {
          observer.disconnect()
        }
      },
      { rootMargin, threshold },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [once, rootMargin, threshold])

  return { ref, inView }
}
