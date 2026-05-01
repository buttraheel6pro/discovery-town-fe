/** Character and staffed service booking page. */
import { Suspense } from 'react'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { StaffedServiceBooking } from '@/components/customer/staffed-service-booking'

export default function CharacterBookingPage() {
  return (
    <>
      <CustomerNavbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-black text-foreground">Character & Staff Booking</h1>
          <p className="text-muted-foreground">
            Select duration, add travel details, and choose an available time.
          </p>
        </header>
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading booking options...</div>}>
          <StaffedServiceBooking />
        </Suspense>
      </main>
      <CustomerFooter />
    </>
  )
}
