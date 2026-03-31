import type { Metadata } from 'next'
import { Inter, Barlow } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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
        {children}
        <Analytics />
      </body>
    </html>
  )
}
