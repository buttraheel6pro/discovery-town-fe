/** Empty cart sidebar — same card shell as facility booking “Add to cart”. */
'use client'

import { ShoppingCart } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SchedulingEmptyCartCard() {
  return (
    <Card className="border-border shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">Your cart</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-10 text-center">
        <ShoppingCart className="mx-auto h-14 w-14 text-accent" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Your cart is empty.</p>
          <p className="text-sm text-muted-foreground">Add some items to get started</p>
        </div>
      </CardContent>
    </Card>
  )
}
