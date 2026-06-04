/** Global not-found page for unavailable or missing customer routes. */
import Link from 'next/link'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <>
      <CustomerNavbar />
      <main className="min-h-[60vh] bg-background">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            404
          </p>
          <h1
            className="mt-2 text-3xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Page not found
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This page does not exist or is not available right now.
          </p>
          <Button asChild className="mt-8">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
