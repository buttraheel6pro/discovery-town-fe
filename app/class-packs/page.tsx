/** Public class packs marketing page with SEO metadata. */
import type { Metadata } from 'next'
import Link from 'next/link'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { ListingCard } from '@/components/customer/listing-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cmCreditPackDefinitions } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Class packs',
  description:
    'Pre-paid class and activity packs at Discovery Town — swim, gym, camps, and more.',
  openGraph: {
    title: 'Class packs | Discovery Town',
    description: 'Buy credits in bulk and save on lessons, classes, and programmes.',
  },
}

export default function ClassPacksMarketingPage() {
  const packs = cmCreditPackDefinitions.filter((p) => p.isActive)

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary text-primary-foreground py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
              Class packs
            </p>
            <h1
              className="text-3xl md:text-4xl font-black tracking-tight"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              Credits that flex with your schedule
            </h1>
            <p className="max-w-2xl mx-auto text-primary-foreground/80 text-sm md:text-base">
              Purchase a pack, use credits when it suits you, and top up anytime from your account.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/account/credits">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                >
                  My credits
                </Button>
              </Link>
              <Link href="/membership">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  View memberships
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2
              className="text-xl font-bold text-foreground mb-6"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              Popular packs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(packs.length ? packs : cmCreditPackDefinitions).map((pack) => (
                <ListingCard
                  key={pack.id}
                  href={`/class-packs/checkout?pack=${pack.id}`}
                  title={pack.name}
                  description={pack.description}
                  imageUrl="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80"
                  topLeft={
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                      {pack.applicableServiceTypes.join(' · ')}
                    </span>
                  }
                  bottomRight={
                    <span className="rounded-full bg-foreground/90 px-2 py-1 text-xs font-bold text-background">
                      ${pack.price}
                    </span>
                  }
                  meta={
                    <p className="text-xs text-muted-foreground">
                      {pack.creditCount} credits · valid {pack.validityDays} days
                    </p>
                  }
                  footer={
                    <span className="block w-full text-center text-sm font-semibold text-accent">
                      Buy now →
                    </span>
                  }
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 border-t border-border bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2
              className="text-xl font-bold text-foreground mb-6"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: '1',
                  title: 'Pick a pack',
                  body: 'Choose the credit bundle that matches how often you visit.',
                },
                {
                  step: '2',
                  title: 'Book with credits',
                  body: 'Apply credits at checkout for eligible classes and sessions.',
                },
                {
                  step: '3',
                  title: 'Top up anytime',
                  body: 'Renew or upgrade before you run out — track balance in your account.',
                },
              ].map((item) => (
                <Card key={item.step}>
                  <CardContent className="pt-6 space-y-2">
                    <span className="text-xs font-bold text-accent">{item.step}</span>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
