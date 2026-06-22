/** Stripe Elements payment form for storefront checkout. */
'use client'

import { useMemo, useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js'
import { Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

function CheckoutPaymentForm({
  onSuccess,
  onError,
}: Readonly<{
  onSuccess: () => void
  onError: (message: string) => void
}>) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  async function handlePay() {
    if (!stripe || !elements) return
    setSubmitting(true)
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })
    setSubmitting(false)
    if (result.error) {
      const message = result.error.message ?? 'Payment failed'
      onError(message)
      toast({ title: 'Payment failed', description: message, variant: 'destructive' })
      return
    }
    onSuccess()
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      <Button type="button" className="w-full gap-2" disabled={!stripe || submitting} onClick={handlePay}>
        <Lock className="h-4 w-4" />
        {submitting ? 'Processing…' : 'Pay securely'}
      </Button>
    </div>
  )
}

export interface StripeCheckoutFormProps {
  clientSecret: string
  onSuccess: () => void
  onError?: (message: string) => void
}

export function StripeCheckoutForm({
  clientSecret,
  onSuccess,
  onError = () => {},
}: Readonly<StripeCheckoutFormProps>) {
  const stripePromise = useMemo(() => {
    if (!publishableKey) return null
    return loadStripe(publishableKey)
  }, [])

  const options = useMemo<StripeElementsOptions>(
    () => ({
      clientSecret,
      appearance: { theme: 'stripe' },
    }),
    [clientSecret],
  )

  if (!stripePromise) {
    return (
      <p className="text-sm text-destructive">
        Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in the frontend environment.
      </p>
    )
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutPaymentForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}

export function isStripeCheckoutEnabled(): boolean {
  return Boolean(publishableKey)
}
