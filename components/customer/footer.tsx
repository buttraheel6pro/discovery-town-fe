/** Site-wide customer footer — wavy teal transition with logo, links, and contact. */
import Image from 'next/image'
import Link from 'next/link'
import {
  Facebook,
  Instagram,
  Mail,
  Phone,
  Twitter,
} from 'lucide-react'

import { ScallopDivider } from '@/components/customer/home-wave-divider'
import { locations } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

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
  'About Us & FAQ': [
    { label: 'About Us', href: '/about#about-us' },
    { label: 'FAQ', href: '/about#faq' },
  ],
} as const

interface CustomerFooterProps {
  readonly className?: string
}

export function CustomerFooter({ className }: Readonly<CustomerFooterProps>) {
  return (
    <footer className={cn('w-full', className)}>
      <ScallopDivider fill="teal" direction="up" size="footer" />

      <div className="bg-brand-teal text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-4 lg:col-span-2">
              <Image
                src={FOOTER_LOGO_SRC}
                alt="Discovery Town"
                width={FOOTER_LOGO_WIDTH}
                height={FOOTER_LOGO_HEIGHT}
                className="h-14 w-auto object-contain object-left sm:h-16"
              />
              <p className="max-w-sm text-sm leading-relaxed text-white/85">
                An imaginative indoor play café where families explore, celebrate,
                and make memories together.
              </p>
              <div className="space-y-2 text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-white" aria-hidden />
                  <a
                    href={`tel:${(mainLocation?.phone ?? '(317) 555-0142').replace(/\D/g, '')}`}
                    className="transition-colors hover:text-brand-gold"
                  >
                    {mainLocation?.phone ?? '(317) 555-0142'}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-white" aria-hidden />
                  <a
                    href={`mailto:${mainLocation?.email ?? 'hello@discoverytown.com'}`}
                    className="transition-colors hover:text-brand-gold"
                  >
                    {mainLocation?.email ?? 'hello@discoverytown.com'}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white hover:text-brand-teal"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  aria-label="Twitter"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white hover:text-brand-teal"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white hover:text-brand-teal"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>

            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading} className="space-y-3">
                <h3
                  className="text-sm font-bold uppercase tracking-wide text-white"
                  style={{ fontFamily: 'var(--font-barlow)' }}
                >
                  {heading}
                </h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/85 transition-colors hover:text-brand-gold"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-10 border-t border-white/20 pt-6 text-center text-xs text-white/75 sm:text-left">
            &copy; {new Date().getFullYear()} Discovery Town. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
