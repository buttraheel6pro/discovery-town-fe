/** Public membership marketing page with SEO metadata. */
import type { Metadata } from 'next'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { ListingCard } from '@/components/customer/listing-card'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { membershipPlans } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Membership',
  description:
    'Discovery Town membership plans — unlimited play, swim lessons, and member perks for your family.',
  openGraph: {
    title: 'Membership | Discovery Town',
    description:
      'Choose a membership that fits your family — soft play, swimming, classes, and exclusive events.',
  },
}

export default function MembershipMarketingPage() {
  const featured = membershipPlans.filter((p) => p.isFeatured && p.isActive)

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary text-primary-foreground py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
              Membership
            </p>
            <h1
              className="text-3xl md:text-4xl font-black tracking-tight"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              One membership, endless family adventures
            </h1>
            <p className="max-w-2xl mx-auto text-primary-foreground/80 text-sm md:text-base">
              Save on everyday visits, unlock priority booking, and enjoy members-only experiences
              across Discovery Town.
            </p>
            <Link href="/account/membership">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                Manage membership in your account
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2
              className="text-xl font-bold text-foreground mb-6"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              Compare plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(featured.length ? featured : membershipPlans.filter((p) => p.isActive)).map(
                (plan) => (
                  <ListingCard
                    key={plan.id}
                    href="/account/membership"
                    title={plan.name}
                    description={plan.description}
                    imageUrl="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80"
                    topLeft={
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                        {plan.billingCycle}
                      </span>
                    }
                    bottomRight={
                      <span className="rounded-full bg-foreground/90 px-2 py-1 text-xs font-bold text-background">
                        £{plan.price}
                      </span>
                    }
                    meta={
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {plan.benefits.slice(0, 4).map((b) => (
                          <li key={b}>• {b}</li>
                        ))}
                      </ul>
                    }
                    footer={
                      <span className="text-sm font-semibold text-accent">
                        Join via account →
                      </span>
                    }
                  />
                ),
              )}
            </div>
          </div>
        </section>

        <section className="py-12 border-t border-border bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Why join?</CardTitle>
                <CardDescription>Built for busy families</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Members save on repeat visits and get first access to holiday camps and events.</p>
                <p>Flexible plans with clear cancellation terms — ask our team if you need a custom corporate package.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">FAQ</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  <strong className="text-foreground">Can I pause?</strong> Yes — pause and resume
                  from your account where your plan allows.
                </p>
                <p>
                  <strong className="text-foreground">Class packs?</strong> Stackable with membership
                  — see our Class Packs page for bundles.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
