import Image from 'next/image'
import Link from 'next/link'
import {
  Facebook,
  Instagram,
  Mail,
  Phone,
  Twitter,
} from 'lucide-react'

import { BrandFooterBar } from '@/components/customer/brand-footer-bar'
import { ScallopDivider } from '@/components/customer/home-wave-divider'
import { locations } from '@/lib/mock-data'

const FOOTER_LOGO_SRC = '/Discovery-logo-transparent.svg'
const FOOTER_LOGO_WIDTH = 1101
const FOOTER_LOGO_HEIGHT = 643

const mainLocation = locations[0]

const footerLinks = {
  Explore: [
    { label: 'Play', href: '/play' },
    { label: 'Events', href: '/events' },
    { label: 'Gym', href: '/gym' },
    { label: 'Learn', href: '/learn' },
  ],
  Shop: [
    { label: 'Shop', href: '/shop' },
    { label: 'Café & Food', href: '/cafe' },
    { label: 'Gifts', href: '/gifts' },
    { label: 'Rentals', href: '/rentals' },
  ],
  Account: [
    { label: 'Sign In', href: '/account/login' },
    { label: 'Register', href: '/account/register' },
    { label: 'My Bookings', href: '/account/bookings' },
    { label: 'Membership', href: '/membership' },
  ],
}

export function CustomerFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Image
              src={FOOTER_LOGO_SRC}
              alt="Discovery Town"
              width={FOOTER_LOGO_WIDTH}
              height={FOOTER_LOGO_HEIGHT}
              className="h-14 w-auto object-contain object-left sm:h-16"
            />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              An imaginative indoor play café where families explore, celebrate,
              and make memories together.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>{mainLocation?.phone ?? '(317) 555-0142'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>{mainLocation?.email ?? 'hello@discoverytown.com'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading} className="space-y-3">
              <h3
                className="text-sm font-bold uppercase tracking-wide text-primary"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                {heading}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground sm:text-left">
          &copy; {new Date().getFullYear()} Discovery Town. All rights reserved.
        </p>
      </div>

      <ScallopDivider fill="teal" direction="up" />
      <BrandFooterBar />
    </footer>
  )
}
