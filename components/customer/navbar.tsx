'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Calendar, Menu, ShoppingCart, User, X } from 'lucide-react'

import { HomeHeroCloudDivider } from '@/components/customer/home-hero-cloud-divider'
import { CustomerNavIcon } from '@/components/customer/navbar-icons'
import { DiscoveryLogo } from '@/components/discovery-logo'
import { Button } from '@/components/ui/button'
import { useCustomerNavLabels } from '@/hooks/use-customer-nav-labels'
import { isLoginBypassEnabled } from '@/lib/config/auth'
import {
  CUSTOMER_NAV_LABEL_ROUTES,
  isCustomerNavItemVisible,
  type CustomerNavLabelKey,
} from '@/lib/customer-nav-labels'
import { isApiEnabled } from '@/lib/config/data-source'
import {
  catalogSlugToProductType,
  type ProductCatalogSlug,
} from '@/lib/catalog-slugs'
import { useInventory } from '@/lib/inventory-store'
import { hasConsumerVisibleProductType } from '@/lib/product-visibility'
import { cn } from '@/lib/utils'

const PLAY_NAV_KEY: CustomerNavLabelKey = 'play'

const NAVBAR_ITEM_ORDER: readonly CustomerNavLabelKey[] = [
  'play',
  'events',
  'rentals',
  'cafeFood',
  'shop',
  'gifts',
  'gym',
  'learn',
] as const

const PRODUCT_NAV_KEYS = new Set<CustomerNavLabelKey>([
  'shop',
  'gifts',
  'rentals',
  'cafeFood',
])

const PRODUCT_KEY_TO_SLUG: Record<
  Extract<CustomerNavLabelKey, 'shop' | 'gifts' | 'rentals' | 'cafeFood'>,
  ProductCatalogSlug
> = {
  shop: 'shop',
  gifts: 'gifts',
  rentals: 'rentals',
  cafeFood: 'cafe-food',
}

interface NavbarNavItem {
  readonly key: CustomerNavLabelKey
  readonly label: string
  readonly href: string
}

interface CustomerNavbarProps {
  readonly priority?: boolean
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isNavbarItemVisible(
  key: CustomerNavLabelKey,
  hidden: Record<CustomerNavLabelKey, boolean>,
  productCategories: ReturnType<typeof useInventory>['productCategories'],
): boolean {
  if (!isCustomerNavItemVisible(key, hidden)) {
    return false
  }
  if (!PRODUCT_NAV_KEYS.has(key)) {
    return true
  }
  if (isApiEnabled) {
    return true
  }
  const slug = PRODUCT_KEY_TO_SLUG[key as keyof typeof PRODUCT_KEY_TO_SLUG]
  const productType = catalogSlugToProductType(slug)
  return hasConsumerVisibleProductType(productType, productCategories)
}

function buildNavbarItems(
  labels: Record<CustomerNavLabelKey, string>,
  hidden: Record<CustomerNavLabelKey, boolean>,
  productCategories: ReturnType<typeof useInventory>['productCategories'],
): NavbarNavItem[] {
  return NAVBAR_ITEM_ORDER.flatMap((key) => {
    if (!isNavbarItemVisible(key, hidden, productCategories)) {
      return []
    }
    return [{
      key,
      label: labels[key],
      href: CUSTOMER_NAV_LABEL_ROUTES[key],
    }]
  })
}

interface NavbarIconLinkProps {
  readonly item: NavbarNavItem
  readonly active: boolean
  readonly onNavigate?: () => void
  readonly layout?: 'column' | 'row'
}

function NavbarIconLink({
  item,
  active,
  onNavigate,
  layout = 'column',
}: NavbarIconLinkProps) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group flex min-w-[4.25rem] items-center rounded-xl px-2 py-1 transition-colors xl:min-w-[4.75rem] xl:px-2.5',
        layout === 'column' ? 'flex-col gap-1' : 'flex-row gap-3',
        active
          ? 'text-brand-teal'
          : 'text-brand-navy/80 hover:text-brand-teal',
      )}
    >
      <CustomerNavIcon
        navKey={item.key}
        className="transition-transform duration-200 group-hover:scale-110"
      />
      <span
        className={cn(
          'text-center text-[0.625rem] leading-tight font-semibold tracking-wide sm:text-[0.6875rem] xl:text-xs',
          layout === 'row' && 'text-left text-sm',
        )}
      >
        {item.label}
      </span>
    </Link>
  )
}

export function CustomerNavbar({ priority = false }: CustomerNavbarProps) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [mobileOpen, setMobileOpen] = useState(false)
  const { cart, productCategories } = useInventory()
  const { labels, hidden } = useCustomerNavLabels()

  const navItems = useMemo(
    () => buildNavbarItems(labels, hidden, productCategories),
    [hidden, labels, productCategories],
  )

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  const bypassLogin = isLoginBypassEnabled()
  const isPlayNavVisible = isCustomerNavItemVisible(PLAY_NAV_KEY, hidden)
  const showFloatingCart = cartCount > 0
  const bookCtaLabel = 'Book Open Play'

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full',
          isHome ? 'bg-home-cream' : 'bg-brand-cream',
          isHome && 'relative overflow-x-clip',
        )}
      >
        <div className="relative w-full">
          <nav
            className={cn(
              'relative z-10 flex w-full items-center gap-2 py-2 sm:gap-3 sm:py-2.5',
              isHome
                ? 'max-w-none px-2 sm:px-3 lg:px-4 xl:px-5'
                : 'mx-auto max-w-[96rem] px-3 sm:px-5',
            )}
            aria-label="Main navigation"
          >
          <DiscoveryLogo
            size="homeNav"
            variant="transparent"
            priority={priority || isHome}
            className="shrink-0"
          />

          <div className="hidden min-w-0 flex-1 lg:flex lg:justify-center">
            <div className="flex flex-wrap items-end justify-center gap-x-2 xl:gap-x-3">
              {navItems.map((item) => (
                <NavbarIconLink
                  key={item.key}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                />
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {isPlayNavVisible ? (
              <Link href="/play" className="hidden sm:block">
                <Button
                  size="sm"
                  className="h-10 rounded-full bg-brand-orange px-6 text-xs font-bold text-white shadow-md hover:bg-brand-orange/90 sm:px-8 sm:text-sm"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {bookCtaLabel}
                </Button>
              </Link>
            ) : null}

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-brand-navy lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
          </nav>

          {isHome ? (
            <HomeHeroCloudDivider
              priority={priority}
              className="top-full -translate-y-4 sm:-translate-y-5 lg:-translate-y-6"
            />
          ) : null}
        </div>

        {mobileOpen ? (
          <div
            className={cn(
              'border-t border-brand-navy/10 px-3 py-3 lg:hidden',
              isHome ? 'bg-home-cream' : 'bg-brand-cream',
            )}
          >
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {navItems.map((item) => (
                <NavbarIconLink
                  key={item.key}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                  layout="row"
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {isPlayNavVisible ? (
                <Link href="/play" className="flex-1 sm:flex-none" onClick={() => setMobileOpen(false)}>
                  <Button
                    size="sm"
                    className="w-full rounded-full bg-brand-orange font-bold text-white hover:bg-brand-orange/90"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {bookCtaLabel}
                  </Button>
                </Link>
              ) : null}
              <Link href="/cart" className="flex-1 sm:flex-none" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="sm" className="w-full rounded-full border-brand-teal/30">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Cart{cartCount > 0 ? ` (${cartCount})` : ''}
                </Button>
              </Link>
              <Link
                href={bypassLogin ? '/account' : '/login'}
                className="flex-1 sm:flex-none"
                onClick={() => setMobileOpen(false)}
              >
                <Button variant="outline" size="sm" className="w-full rounded-full border-brand-teal/30">
                  <User className="mr-2 h-4 w-4" />
                  Account
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      {showFloatingCart ? (
        <Link href="/cart" className="fixed bottom-5 right-5 z-[60]">
          <Button className="h-12 rounded-full bg-brand-orange px-4 font-semibold text-white shadow-lg hover:bg-brand-orange/90">
            <ShoppingCart className="mr-2 h-4 w-4" />
            View cart ({cartCount})
          </Button>
        </Link>
      ) : null}
    </>
  )
}
