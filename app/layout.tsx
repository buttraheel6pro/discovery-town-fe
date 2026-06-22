import type { Metadata } from 'next'
import { Barlow, Fredoka, Inter, Mukta, Roboto } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import { CalendarProvider } from '@/lib/calendar-store'
import { ClientProvider } from '@/lib/client-store'
import { CafeInventorySyncBridge } from '@/lib/cafe-inventory-sync-bridge'
import { CafeProvider } from '@/lib/cafe-store'
import { CustomerNavLabelsProvider } from '@/lib/customer-nav-labels-provider'
import { InventoryProvider } from '@/lib/inventory-store'
import { LocationProvider } from '@/lib/location-store'
import { AppStoreProvider } from '@/lib/redux/provider'
import { ReportsProvider } from '@/lib/reports-store'
import { SchedulingProvider } from '@/lib/scheduling-store'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-barlow',
  display: 'swap',
})

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
})

const mukta = Mukta({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-mukta',
  display: 'swap',
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-roboto',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Discovery Town',
    template: '%s | Discovery Town',
  },
  description: 'Book activities, join classes, and explore fun experiences at Discovery Town — your family-friendly play and activity centre.',
  keywords: ['play centre', 'kids activities', 'soft play', 'swimming lessons', 'gym classes', 'birthday parties', 'family activities'],
  authors: [{ name: 'Discovery Town' }],
  openGraph: {
    title: 'Discovery Town',
    description: 'Book activities, join classes, and explore fun experiences at Discovery Town.',
    type: 'website',
  },
}

export const viewport = {
  themeColor: '#1E3A5F',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${barlow.variable} ${fredoka.variable} ${mukta.variable} ${roboto.variable}`}
    >
      <body suppressHydrationWarning className="font-sans antialiased">
        <AppStoreProvider>
          <SchedulingProvider>
            <InventoryProvider>
              <CafeProvider>
                <CafeInventorySyncBridge />
                <ReportsProvider>
                  <LocationProvider>
                    <CalendarProvider>
                      <ClientProvider>
                        <CustomerNavLabelsProvider>{children}</CustomerNavLabelsProvider>
                      </ClientProvider>
                    </CalendarProvider>
                  </LocationProvider>
                </ReportsProvider>
              </CafeProvider>
            </InventoryProvider>
          </SchedulingProvider>
        </AppStoreProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
