'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Menu, Search, ShoppingCart, User, X } from 'lucide-react'

import { DiscoveryLogo } from '@/components/discovery-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCustomerNavLabels } from '@/hooks/use-customer-nav-labels'
import { isLoginBypassEnabled } from '@/lib/config/auth'
import {
  isCustomerNavItemVisible,
  productTypeToNavLabelKey,
  type CustomerNavLabelKey,
} from '@/lib/customer-nav-labels'

const PLAY_NAV_KEY: CustomerNavLabelKey = 'play'
import {
  PRODUCT_CATALOG_SLUGS,
  catalogSlugToProductType,
  storeSlugFromCatalogSlug,
} from '@/lib/catalog-slugs'
import { useInventory } from '@/lib/inventory-store'
import { hasConsumerVisibleProductType } from '@/lib/product-visibility'
import { cn } from '@/lib/utils'

interface NavbarLinkItem {
  readonly label: string
  readonly href: string
  readonly description?: string
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function CustomerNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { cart, productCategories } = useInventory()
  const { labels, hidden } = useCustomerNavLabels()

  const storeItems = useMemo<NavbarLinkItem[]>(() => {
    const dynamicItems = PRODUCT_CATALOG_SLUGS.filter((slug) => slug !== 'rentals')
      .filter((slug) =>
        hasConsumerVisibleProductType(
          catalogSlugToProductType(slug),
          productCategories,
        ),
      )
      .flatMap((slug) => {
        const productType = catalogSlugToProductType(slug)
        const navKey = productTypeToNavLabelKey(productType)
        if (navKey == null || !isCustomerNavItemVisible(navKey, hidden)) {
          return []
        }
        const label = labels[navKey]
        return [{
          label,
          href: `/store/${storeSlugFromCatalogSlug(slug)}`,
          description: `Browse ${label} collections`,
        }]
      })

    const items: NavbarLinkItem[] = [...dynamicItems]
    if (
      hasConsumerVisibleProductType('rentals', productCategories) &&
      isCustomerNavItemVisible('rentals', hidden)
    ) {
      items.unshift({
        label: labels.rentals,
        href: '/rentals',
        description: 'Equipment, staffed services, and event rentals.',
      })
    }
    return items
  }, [hidden, labels, productCategories])

  const discoverItems: NavbarLinkItem[] = useMemo(() => {
    const discoverConfig: Array<{
      key: CustomerNavLabelKey
      href: string
      description: string
    }> = [
      {
        key: 'play',
        href: '/play',
        description: 'Open play, private play, camps, and more.',
      },
      {
        key: 'gym',
        href: '/gym',
        description: 'Classes for all ages, from babies to seniors.',
      },
      {
        key: 'learn',
        href: '/learn',
        description: 'Tutoring, test prep, and enrichment for every age.',
      },
      {
        key: 'events',
        href: '/events',
        description: 'Discover events and private venue booking.',
      },
    ]

    return discoverConfig.flatMap((item) => {
      if (!isCustomerNavItemVisible(item.key, hidden)) {
        return []
      }
      return [{
        label: labels[item.key],
        href: item.href,
        description: item.description,
      }]
    })
  }, [hidden, labels])

  const allTopLevelLinks: NavbarLinkItem[] = [...discoverItems, ...storeItems]
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  const bypassLogin = isLoginBypassEnabled()
  const isPlayNavVisible = isCustomerNavItemVisible(PLAY_NAV_KEY, hidden)

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <nav
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16">
          <DiscoveryLogo priority />

          <div className="hidden md:flex items-center gap-1">
            {allTopLevelLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? 'text-accent bg-accent/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="w-4 h-4" />
            </Button>
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Cart"
              >
                <ShoppingCart className="w-4 h-4" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-accent text-accent-foreground">
                  {cartCount}
                </Badge>
              </Button>
            </Link>
            <Link href="/account">
              <Button variant="ghost" size="icon" aria-label="Account">
                <User className="w-4 h-4" />
              </Button>
            </Link>
            {bypassLogin ? (
              <Link href="/account">
                <Button variant="outline" size="sm">
                  My account
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            )}
            {isPlayNavVisible ? (
              <Link href="/play">
                <Button
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                >
                  Book Now
                </Button>
              </Link>
            ) : null}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {mobileOpen && (
          <div className="space-y-1 border-t border-border py-4 md:hidden">
            {allTopLevelLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block rounded-md px-4 py-3 text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 flex items-center gap-2 px-4">
              <Link href="/account" className="flex-1">
                <Button variant="outline" className="w-full" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Account
                </Button>
              </Link>
              {bypassLogin ? (
                <Link href="/account" className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    My account
                  </Button>
                </Link>
              ) : (
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    Login
                  </Button>
                </Link>
              )}
              {isPlayNavVisible ? (
                <Link href="/play" className="flex-1">
                  <Button
                    size="sm"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Book Now
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </nav>
      </header>
      {cartCount > 0 ? (
        <Link href="/cart" className="fixed bottom-5 right-5 z-[60]">
          <Button className="h-12 rounded-full bg-accent px-4 text-accent-foreground shadow-lg hover:bg-accent/90">
            <ShoppingCart className="mr-2 h-4 w-4" />
            View cart ({cartCount})
          </Button>
        </Link>
      ) : null}
    </>
  )
}
