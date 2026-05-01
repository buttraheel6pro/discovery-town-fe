/** Hero section for rentals landing page. */
import Link from 'next/link'

import { RentalHowItWorks } from '@/components/customer/rental-how-it-works'
import { Button } from '@/components/ui/button'

export function RentalLandingHero() {
  return (
    <section className="bg-primary py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-widest text-accent">Rentals</p>
        <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">Plan your event rentals.</h1>
        <p className="mt-4 max-w-3xl text-white/80">
          Deliver to your door. Pick up at the venue. We handle the details.
        </p>
        <div className="mt-4">
          <Link href="/rentals/character-booking?demo=character">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              Book Character Demo
            </Button>
          </Link>
        </div>
        <div className="mt-4">
          <RentalHowItWorks compact />
        </div>
      </div>
    </section>
  )
}
