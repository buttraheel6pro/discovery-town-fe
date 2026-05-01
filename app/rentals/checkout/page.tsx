/** Rentals checkout page. */
import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { RentalCheckoutClient } from '@/components/customer/rental-checkout-client'

export default function RentalCheckoutPage() {
  return (
    <>
      <CustomerNavbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <RentalCheckoutClient />
      </main>
      <CustomerFooter />
    </>
  )
}
