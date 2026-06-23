/** Public About Us & FAQ page. */
import type { Metadata } from 'next'

import { AboutFaqPage } from '@/components/customer/about-faq-page'
import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'

export const metadata: Metadata = {
  title: 'About Us & FAQ',
  description:
    'Learn about Discovery Town — our indoor play café, family experiences, and answers to common questions.',
  openGraph: {
    title: 'About Us & FAQ | Discovery Town',
    description:
      'Who we are, what we offer, and FAQs about visits, parties, and memberships.',
  },
}

export default function AboutPage() {
  return (
    <>
      <CustomerNavbar />
      <main>
        <AboutFaqPage />
      </main>
      <CustomerFooter />
    </>
  )
}
