'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ChevronDown, Menu, Search, ShoppingCart, User, X, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useInventory } from '@/lib/inventory-store'
import { cn } from '@/lib/utils'

interface NavbarLinkItem {
  readonly label: string
  readonly href: string
  readonly description?: string
}

interface NavbarDropdownItem {
  readonly label: string
  readonly items: readonly NavbarLinkItem[]
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  shop: 'Shop',
  gifts: 'Gifts',
  rentals: 'Rentals',
  'cafe&food': 'Cafe & Food',
}

function toStoreSlug(productType: string): string {
  return productType.replace(/&/g, '-')
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavbarDropdown({
  label,
  items,
  pathname,
  onItemClick,
}: Readonly<NavbarDropdownItem & { pathname: string; onItemClick?: () => void }>) {
  const isActive = items.some((item) => isActivePath(pathname, item.href))

  return (
    <div className="group relative">
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent/10 text-accent'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
      >
        {label}
        <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-card p-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'block rounded-lg px-3 py-2.5 transition-colors',
              isActivePath(pathname, item.href)
                ? 'bg-accent/10 text-accent'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <p className="text-sm font-semibold">{item.label}</p>
            {item.description ? <p className="text-xs text-muted-foreground">{item.description}</p> : null}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function CustomerNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { cart, productCategories } = useInventory()

  const storeItems = useMemo<NavbarLinkItem[]>(() => {
    const productTypeValues = [...new Set(productCategories.map((category) => category.productType ?? 'shop'))]
    const sortedProductTypes = productTypeValues.sort((left, right) => left.localeCompare(right))

    const dynamicItems = sortedProductTypes.map((productType) => ({
      label: PRODUCT_TYPE_LABELS[productType] ?? productType,
      href: `/store/${toStoreSlug(productType)}`,
      description: `Browse ${PRODUCT_TYPE_LABELS[productType] ?? productType} collections`,
    }))

    return dynamicItems
  }, [productCategories])

  const discoverItems: NavbarLinkItem[] = [
    { label: 'Play', href: '/play', description: 'Open play, private play, camps, and more.' },
    { label: 'Gym', href: '/gym', description: 'Classes for all ages, from babies to seniors.' },
    { label: 'Events', href: '/events', description: 'Discover events and private venue booking.' },
  ]

  const desktopLinks: NavbarLinkItem[] = [
    { label: 'Membership', href: '/membership' },
    { label: 'Class Packs', href: '/class-packs' },
  ]
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <nav
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-accent rounded-sm flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent-foreground" fill="currentColor" />
            </div>
            <span
              className="text-lg font-black tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-barlow)" }}
            >
              Discovery Town
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavbarDropdown label="Discover" items={discoverItems} pathname={pathname} />
            <NavbarDropdown label="Store" items={storeItems} pathname={pathname} />
            {desktopLinks.map((link) => (
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
            <Link href="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/play">
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                Book Now
              </Button>
            </Link>
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
            <details className="rounded-md border border-border">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-foreground">
                Discover
              </summary>
              <div className="border-t border-border p-2">
                {discoverItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
            <details className="rounded-md border border-border">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-foreground">
                Store
              </summary>
              <div className="border-t border-border p-2">
                {storeItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
            {desktopLinks.map((link) => (
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
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/play" className="flex-1">
                <Button
                  size="sm"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Book Now
                </Button>
              </Link>
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
