/** Empty state when a customer catalog section has no data from the API or mocks. */
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export const CATALOG_SECTION_EMPTY_DESCRIPTION =
  "We don't have any items in this section right now. Please check back later or explore another part of Discovery Town."

export interface CatalogEmptyStateProps {
  readonly title: string
  readonly description: string
  readonly backHref?: string
  readonly backLabel?: string
}

export interface CatalogSectionEmptyStateOptions {
  readonly backHref?: string
  readonly backLabel?: string
}

/** Shared copy for store / gifts / rentals when a whole catalog section has no listings. */
export function catalogSectionEmptyStateProps(
  sectionLabel: string,
  options: CatalogSectionEmptyStateOptions = {},
): CatalogEmptyStateProps {
  return {
    title: `No ${sectionLabel.toLowerCase()} listings yet`,
    description: CATALOG_SECTION_EMPTY_DESCRIPTION,
    backHref: options.backHref ?? '/',
    backLabel: options.backLabel ?? 'Back to home',
  }
}

export function CatalogEmptyState({
  title,
  description,
  backHref,
  backLabel = 'Browse other sections',
}: Readonly<CatalogEmptyStateProps>) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-12 text-center sm:px-10">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {backHref ? (
        <Button asChild variant="outline" className="mt-6">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}
