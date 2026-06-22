---
tags: [frontend, nextjs, redux, context, discovery-town]
scope: discovery-town-fe
purpose: ai-context-only — machine-readable frontend map for AI coding tools
related: [[../CONTEXT.md]], [[../discovery-town-be/CLAUDE.md]]
last-updated: 2026-06-11
---

# Discovery Town Frontend — AI Context

## Doc Maintenance Rule
> **AI tools must update this file whenever** a new page, component, store, API call, or pattern is added/changed. Rules:
> 1. AI-readable only — no prose explanations, dense bullets/tables only
> 2. Token-optimized — summarize, no copy-paste of code
> 3. Repo-level — must reflect interconnection with backend (endpoint ↔ store ↔ page)
> 4. Tool-agnostic — Cursor, Claude Code, Copilot, Windsurf all read this identically

## Tech Stack
- **Framework:** Next.js 14 App Router (`app/` directory, RSC + `'use client'`)
- **State:** Redux Toolkit (RTK) + React Context stores + localStorage persistence
- **HTTP:** Axios (`lib/api/client.ts`) with interceptors
- **Styling:** Tailwind CSS + CSS variables (`lib/css-vars.ts`)
- **Auth:** `next-auth` v4 (staff login) + custom contact JWT (consumer)
- **Forms:** `react-hook-form` + `zod`

## Key Environment Variables
```
NEXT_PUBLIC_API_URL=            # Backend base (e.g. http://localhost:8000/api/v1)
NEXT_PUBLIC_TENANT_ID=          # UUID — sent as x-tenant-id header on public endpoints
NEXT_PUBLIC_ENABLE_MOCKS=       # true = mock-data only (ignores API URL); false = API when URL+tenant set
NEXT_PUBLIC_BYPASS_ADMIN_AUTH=  # dev: skip admin JWT check
NEXT_PUBLIC_BYPASS_USER_AUTH=   # dev: skip consumer JWT check
```
Data source: `lib/config/data-source.ts` — `isMockDataEnabled()`, `isApiConfigured()`, `isApiEnabled` (re-exported from `lib/api/client.ts`).
`isApiEnabled = !ENABLE_MOCKS && API_URL && TENANT_ID` — gates consumer catalog API calls.

---

## Directory Structure

```
app/                        Next.js App Router pages
  admin/                    Staff/admin pages (protected)
  play/                     Consumer play booking page
  gym/                      Consumer gym & classes page
  cafe/                     Cafe & food menu page
  events/                   Sports events & bookings page
  shop/                     Merchandise shop page
  gifts/                    Gift products page
  rentals/                  Rental equipment page
  membership/               Consumer membership page
  private-hire/             Consumer private hire form
lib/
  api/                      Real API layer (see below)
  hooks/                    Custom React hooks (batch-load, catalog)
  redux/                    Redux store, slices, provider
  mock-data.ts              Fallback mock data for all sections
  types.ts                  Shared TypeScript types (frontend canonical)
  scheduling-store.tsx      React context for scheduling UI state
  client-store.tsx          React context for client/membership state
  cafe-store.tsx            Cafe section state
  inventory-store.tsx       Inventory React context
  calendar-store.tsx        Calendar UI state
  constants/api.ts          API_PATHS map (all endpoints)
components/customer/        Consumer-facing UI components
  *-scroll-card.tsx         Horizontal rail item cards
  *-scroll-card-skeleton.tsx  Loading placeholders
  *-menu-client.tsx         Page-level client components with API integration
```

---

## API Layer (`lib/api/`)

### `client.ts`
- Axios instance with `baseURL = NEXT_PUBLIC_API_URL`
- Request interceptor: injects `Authorization: Bearer <token>` + `x-tenant-id: NEXT_PUBLIC_TENANT_ID`
- Exports: `apiClient`, `isApiEnabled`, `PaginatedResponse<T>`

### `mappers.ts`
Transforms raw API shapes to frontend types.
| Raw API type | Frontend type | Mapper fn |
|---|---|---|
| `ApiCategory` | `SchedulingCategory` | `mapCategory()` |
| `ApiService` | `SchedulingService` | `mapService()` |
| `ApiEventPackage` | `EventPackage` | `mapEventPackage()` |
| `ApiOccasion` | `SchedulingOccasion` | `mapOccasion()` |
| `ApiPlan` | `MembershipPlan` | `mapPlan()` |

Key helpers:
- `num(v, fallback)` — Prisma Decimal string → `number`
- `slotIncrementToMinutes(v)` — `NONE→null`, `HALF_HOUR→30`, `HOUR→60`

### `scheduling.api.ts`
- `fetchSchedulingCatalog()` — parallel fetches categories + services + packages + occasions
- `fetchCategories(params)`, `fetchServices(params, categoryMap)`, `fetchEventPackages(params)`, `fetchOccasions()`
- `fetchServicesByCategory(categoryId, page, limit, categoryMap)` — paginated services for one section (used by `useCatalogPageServices`)

### `plans.api.ts`
- `fetchPlans(params): Promise<MembershipPlan[]>`

### `cafe.api.ts`
- `fetchCafeCategories()` — `GET /product-categories/public?tenantId=X&catalogSlug=cafe`
- `fetchCafeProductsByCategory(categoryId, page, limit)` — `GET /products/public?tenantId=X&categoryId=Y`
- Types: `CafePublicProduct`, `CafeProductsPage`, `CafePublicCategory`

### `shop.api.ts`
- `fetchShopCategories()` — `GET /product-categories/public?tenantId=X&catalogSlug=shop`
- `fetchShopProductsByCategory(categoryId, page, limit)`
- Types: `ShopPublicProduct`, `ShopProductsPage`, `ShopPublicCategory`

### `gifts.api.ts`
- `fetchGiftCategories()` — `GET /product-categories/public?tenantId=X&catalogSlug=gifts`
- `fetchGiftProductsByCategory(categoryId, page, limit)`
- Types: `GiftPublicProduct`, `GiftProductsPage`, `GiftPublicCategory`

### `rentals.api.ts`
- `fetchRentalCategories()` — `GET /product-categories/public?tenantId=X&catalogSlug=rentals`
- `fetchRentalProductsByCategory(categoryId, page, limit)`
- Types: `RentalPublicProduct` (includes `fulfillment`, `requiresDelivery`, `requiresStaff`, `depositAmount`), `RentalProductsPage`, `RentalPublicCategory`

### `private-hire.api.ts`
- `submitPrivateHireInquiry(payload)` — POST to `/v1/private-hire`

### `constants/api.ts` — `API_PATHS`
```typescript
serviceCategories, services, openBooking, bookings, addOns, slots, waitlist,
eventPackages, schedulingOccasions, plans, privateHire, inventory, ...
```

### Public endpoint security patterns
- **Scheduling** (`/service-categories`, `/services`, `/event-packages`, `/plans`): `@NoAuth @PublicBrowse @UseGuards(OptionalJwtGuard) @TenantIdAny` — tenantId from JWT or `x-tenant-id` header
- **Inventory** (`/product-categories/public`, `/products/public`): `@NoAuth()` + required `tenantId` UUID query param (class-validator `@IsUUID()`)

---

## State Management

### Redux Store (`lib/redux/`)

#### `scheduling-slice.ts`
```typescript
state: {
  categories: SchedulingCategory[]
  services: SchedulingService[]
  packages: EventPackage[]
  occasions: SchedulingOccasion[]
  slots: ServiceSlot[]
  bookings: Booking[]
}
```
- `hydrateSchedulingState(payload)` — restore from localStorage
- `loadSchedulingCatalog` — `createAsyncThunk` that calls `fetchSchedulingCatalog()` (dynamic import to avoid SSR)
- `extraReducers` on `fulfilled`: merges API data only when `length > 0` (preserves mock data on empty response)
- Persisted to `localStorage` key `SCHEDULING_STORAGE_KEY` via `SchedulingPersistenceBridge`

#### `inventory-slice.ts`
- `hydrateInventoryState(payload)` — restore from localStorage
- Persisted via `InventoryHydrationProvider`

### Redux Provider (`lib/redux/provider.tsx`)
Mount order inside `AppStoreProvider`:
```
<Provider store={store}>
  <InventoryHydrationProvider>   // localStorage hydration for inventory
    <SchedulingPersistenceBridge /> // localStorage hydration for scheduling
    <SchedulingApiLoader />          // fires loadSchedulingCatalog() if isApiEnabled
    {children}
  </InventoryHydrationProvider>
</Provider>
```

### React Context Stores
| File | Hook | What it holds |
|------|------|--------------|
| `scheduling-store.tsx` | `useScheduling()` | UI selections, booking flow state, derived from Redux |
| `client-store.tsx` | `useClients()` | contacts, membershipPlans (loads `fetchPlans` if isApiEnabled) |
| `cafe-store.tsx` | `useCafe()` | cafe menu, cart |
| `inventory-store.tsx` | `useInventory()` | product catalog |
| `calendar-store.tsx` | `useCalendar()` | calendar view state |
| `location-store.tsx` | `useLocation()` | selected location |

---

## Mock vs API Data Source

| `NEXT_PUBLIC_ENABLE_MOCKS` | API URL + tenant | Behavior |
|----------------------------|------------------|----------|
| `true` | any | Mock only — Redux seeded from `mock-data.ts`, no catalog API calls |
| `false` | both set | API only — empty Redux catalog seed, fetch from backend, no static fallbacks |
| `false` | missing | Empty catalog — no API calls |

- Config: `lib/config/data-source.ts`
- Redux: `scheduling-slice` / `inventory-slice` empty initial state when `isApiEnabled`
- Provider: mock mode full localStorage hydrate; API mode session-only (bookings/slots/waitlist)
- Menu clients: `STATIC_*_CATEGORIES` only when `isMockDataEnabled()`
- `client-store` membership plans: mock init when mocks on; `[]` + `fetchPlans` when API on
- Ancillary mock (footer locations, instructors, account orders) still uses `mock-data.ts` in API mode

Mock data lives in `lib/mock-data.ts`.

---

## Page → Store → API Map

| Page | Primary store / hook | Key API | DB seed |
|------|---------------------|---------|---------|
| `app/play/` | `useScheduling()` + `useCatalogPageServices` | `GET /v1/service-categories` + `/v1/services` | `catalogSlug=play` (9 cats, 32 svcs) |
| `app/gym/` | `useScheduling()` + `useCatalogPageServices` | same | `catalogSlug=gym` (11 cats, 30 svcs) |
| `app/events/` | `useScheduling()` + `useCatalogPageServices` | services + event-packages | `catalogSlug=events` (5 cats, 14 svcs, 17 pkgs) |
| `app/cafe/` | `CafeMenuClient` + `useCafePageProducts` | `GET /product-categories/public` + `/products/public` | `catalogSlug=cafe` (11 cats, 33 products) |
| `app/shop/` | `ShopMenuClient` + `useShopPageProducts` | same | `catalogSlug=shop` (10 cats, 31 products) |
| `app/gifts/` | `GiftsCategoriesGrid` + `useGiftsCategories` | `GET /product-categories/public` + `/products/public` | `catalogSlug=gifts` (4 cats, 31 products) |
| `app/rentals/` | `RentalsMenuClient` + `useRentalsPageProducts` | same | `catalogSlug=rentals` (8 cats, 26 products) |
| `app/membership/` | `useClients()` | `GET /v1/plans` | 7 active plans |
| `app/private-hire/` | local form state | `POST /v1/private-hire` | — |
| `app/classes/[id]/` | `useScheduling()` | service detail, slot selection, cart checkout | — |
| `app/admin/**` | module-specific hooks | full CRUD via admin APIs | — |

---

## Frontend TypeScript Types (`lib/types.ts`)

Key types — must stay in sync with backend Prisma schema:
```typescript
SchedulingCategory    // ↔ ServiceCategory model
SchedulingService     // ↔ Service model (slotIncrementMinutes: number|null, not enum)
EventPackage          // ↔ EventPackage model
SchedulingOccasion    // ↔ SchedulingOccasion model
MembershipPlan        // ↔ Plan model
ServiceSlot           // ↔ ServiceSlot model
Booking               // ↔ Booking model
```

---

## Adding a New API Integration (checklist)

1. Add path to `lib/constants/api.ts`
2. Add raw `Api*` interface + `map*()` fn in `lib/api/mappers.ts`
3. Create `lib/api/<feature>.api.ts` with typed fetch fn
4. Add `createAsyncThunk` to relevant slice OR call in context store with `isApiEnabled` gate
5. Mount loader component in `lib/redux/provider.tsx` OR call from context store init

---

## Lazy Batch-Load Pattern (all consumer menus)

All consumer menus use one of two hooks:

### `useCatalogPageServices` — scheduling menus (Play, Gym, Events)
- Input: `SchedulingCategory[]` from Redux
- On mount: `Promise.allSettled` fetches page 1 (10 items) for every category in parallel via `fetchServicesByCategory`
- `loadMore(categoryId)` — fetches next page, appends to section
- Returns `{ sectionMap: Map<categoryId, SectionPageData>, loadMore }`
- `SectionPageData`: `{ services, total, page, hasMore, isLoading, isLoadingMore }`
- Used by: `app/play/page.tsx`, `app/gym/page.tsx`, `app/events/page.tsx`

### `useCafePageProducts` / `useShopPageProducts` / `useGiftsPageProducts` / `useRentalsPageProducts` — product menus
- Same pattern — input: category list, output: `{ sectionMap, loadMore }`
- `SectionPageData`: `{ products, hasMore, page, isLoading, isLoadingMore }`
- Each wrapped in a `*MenuClient` component that: fetches categories from API on mount, falls back to `STATIC_*_CATEGORIES` on error or when API disabled, passes hookCategories to the hook

### `HorizontalScrollSection` — shared rail component
- Props: `title`, `description?`, `hasMore`, `isLoadingMore`, `onLoadMore`, `autoLoadMore`
- `autoLoadMore=true` → `IntersectionObserver` triggers `onLoadMore` when "Load more" sentinel scrolls into view

---

## Consumer Menu Component Map

| Menu | MenuClient | ScrollCard | Skeleton | Hook |
|------|-----------|-----------|---------|------|
| Cafe | `cafe-menu-client.tsx` | `cafe-product-scroll-card.tsx` | `cafe-product-scroll-card-skeleton.tsx` | `use-cafe-page-products.ts` |
| Shop | `shop-menu-client.tsx` | `shop-product-scroll-card.tsx` | `shop-product-scroll-card-skeleton.tsx` | `use-shop-page-products.ts` |
| Gifts | `gifts-landing-page.tsx` + `gifts-categories-grid.tsx` | — | — | `use-gifts-categories.ts` + `use-gifts-page-products.ts` (detail) |
| Rentals | `rentals-menu-client.tsx` | `rental-product-scroll-card.tsx` | `rental-product-scroll-card-skeleton.tsx` | `use-rentals-page-products.ts` |
| Play/Gym/Events | page.tsx inline | `service-scroll-card.tsx` / `gym-class-scroll-card.tsx` / `event-package-scroll-card.tsx` | `service-scroll-card-skeleton.tsx` | `use-catalog-page-services.ts` |

---

## Gym Section — Component Architecture

```
app/gym/page.tsx
  ├── GymAgeFilterPills             → components/customer/gym-age-filter-pills.tsx
  │     GYM_AGE_GROUPS[]            → categoryIds mapped to cat-gym-* IDs
  │     selectedAgeGroupId (useState) → filters visibleGymClassCategories (all sections pre-fetched)
  ├── GymClassScrollCard            → components/customer/gym-class-scroll-card.tsx
  │     renders: sport badge, age range, first schedule entry, duration, price
  │     href: /classes/${service.id}
  │     CTA: "View class" (SCHEDULED) | "Book now" (other)
  ├── ServiceScrollCard             → used only for open-play/membership-offer sections
  ├── OpenPlayMembershipOfferCard   → membership offers in open-play block if present
  └── SchedulingMenuProductRails    → placed AFTER class rails (bottom) — gym products/gear
```

**Key diff across scheduling menus:**
- Play: `ServiceScrollCard` everywhere; product rails at bottom
- Gym: `GymClassScrollCard` for classes; `ServiceScrollCard` for open-play; age-group filter bar
- Events: `EventPackageScrollCard` for `isPackageService=true` services; `ServiceScrollCard` for plain; search + status filter bar

## Rentals Page — Dual-section layout
`app/rentals/page.tsx` has two sections stacked:
1. `<RentalsMenuClient />` — NEW horizontal scroll rails per category (API-powered, lazy batch-load)
2. `<RentalCategoryGrid />` — EXISTING grid view (Redux inventory store, mock data fallback, cart/demo-seeding)

## Running / Build

```bash
npm run dev           # localhost:3000
npm run build         # Next.js production build
npm run lint          # ESLint
# No backend? → NEXT_PUBLIC_ENABLE_MOCKS=true (API_URL optional)
# Live API?   → NEXT_PUBLIC_ENABLE_MOCKS=false + API_URL + TENANT_ID
```

## Path Aliases
```typescript
@/lib/*   → lib/
@/app/*   → app/
@/components/* → components/
// configured in tsconfig.json paths
```
