import type { Metadata } from 'next'
import { Inter, Barlow } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CalendarProvider } from '@/lib/calendar-store'
import { ClientProvider } from '@/lib/client-store'
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
    <html lang="en" className={`${inter.variable} ${barlow.variable}`}>
      <body className="font-sans antialiased">
        <AppStoreProvider>
          <SchedulingProvider>
            <InventoryProvider>
              <ReportsProvider>
                <LocationProvider>
                  <CalendarProvider>
                    <ClientProvider>{children}</ClientProvider>
                  </CalendarProvider>
                </LocationProvider>
              </ReportsProvider>
            </InventoryProvider>
          </SchedulingProvider>
        </AppStoreProvider>
        <Analytics />
      </body>
    </html>
  )
}
