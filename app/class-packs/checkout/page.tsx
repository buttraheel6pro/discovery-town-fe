/** Class pack checkout flow for purchasing credit bundles. */
'use client'

import { FormEvent, Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cmCreditPackDefinitions } from '@/lib/mock-data'

function ClassPacksCheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [securityCode, setSecurityCode] = useState('')

  const selectedPackId = searchParams.get('pack')
  const selectedPack = useMemo(
    () =>
      cmCreditPackDefinitions.find((pack) => pack.id === selectedPackId) ?? cmCreditPackDefinitions[0],
    [selectedPackId],
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.push('/account/credits')
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Class packs</p>
            <h1
              className="text-3xl font-black text-primary-foreground sm:text-4xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              Checkout
            </h1>
          </div>
        </section>

        <section className="bg-background py-10">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle>Payment details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Name on card</Label>
                    <Input
                      id="cardName"
                      value={cardName}
                      onChange={(event) => setCardName(event.target.value)}
                      placeholder="Alex Johnson"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card number</Label>
                    <Input
                      id="cardNumber"
                      value={cardNumber}
                      onChange={(event) => setCardNumber(event.target.value)}
                      placeholder="4242 4242 4242 4242"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry</Label>
                      <Input
                        id="expiry"
                        value={expiry}
                        onChange={(event) => setExpiry(event.target.value)}
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="securityCode">CVC</Label>
                      <Input
                        id="securityCode"
                        value={securityCode}
                        onChange={(event) => setSecurityCode(event.target.value)}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Complete purchase
                  </Button>
                  <Link href="/class-packs" className="block">
                    <Button type="button" variant="outline" className="w-full">
                      Back to class packs
                    </Button>
                  </Link>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{selectedPack.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{selectedPack.description}</p>
                <p>
                  <span className="font-semibold text-foreground">{selectedPack.creditCount}</span> credits
                </p>
                <p>
                  Valid for{' '}
                  <span className="font-semibold text-foreground">{selectedPack.validityDays} days</span>
                </p>
                <div className="rounded-lg border border-border bg-secondary/40 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
                  <p
                    className="text-2xl font-black text-foreground"
                    style={{ fontFamily: 'var(--font-barlow)' }}
                  >
                    USD {selectedPack.price}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}

export default function ClassPacksCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-background" />}>
      <ClassPacksCheckoutContent />
    </Suspense>
  )
}
