/** Shows a queued add-to-cart toast after client navigation completes. */
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import { toast } from '@/hooks/use-toast'
import {
  CART_ADDED_TOAST_DURATION_MS,
  consumeQueuedCartAddedToast,
  getAddedToCartToastContent,
} from '@/lib/product-detail-navigation'

export function CartAddedToastListener() {
  const pathname = usePathname()

  useEffect(() => {
    const pending = consumeQueuedCartAddedToast()
    if (!pending) {
      return
    }
    const content = getAddedToCartToastContent(pending.itemName)
    toast({
      title: content.title,
      description: content.description,
      duration: CART_ADDED_TOAST_DURATION_MS,
    })
  }, [pathname])

  return null
}
