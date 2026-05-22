/** Category + sub-category placement for where a membership plan appears on customer pages. */
'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  groupSchedulingCategoriesByPage,
  MEMBERSHIP_DISPLAY_PAGE_OPTIONS,
  MEMBERSHIP_PLACEMENT_ALL_SUBCATEGORIES,
  primaryDisplayPageFromDraft,
  primarySchedulingCategoryIdFromDraft,
  type MembershipDisplayPage,
  type MembershipPlacementDraft,
} from '@/lib/membership-placement'
import { useScheduling } from '@/lib/scheduling-store'
import type { SchedulingCategory } from '@/lib/types'

export interface MembershipPlacementFieldsProps {
  readonly value: MembershipPlacementDraft
  readonly onChange: (next: MembershipPlacementDraft) => void
}

export function MembershipPlacementFields({
  value,
  onChange,
}: Readonly<MembershipPlacementFieldsProps>) {
  const { categories } = useScheduling()
  const grouped = groupSchedulingCategoriesByPage(categories)
  const primaryPage = primaryDisplayPageFromDraft(value)
  const primaryCategoryId = primarySchedulingCategoryIdFromDraft(value)
  const subCategories =
    primaryPage && primaryPage !== 'membership'
      ? grouped[primaryPage]
      : []

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold">Where to show this plan</p>
        <p className="text-xs text-muted-foreground">
          Choose the customer page and play/events/gym sub-category (e.g. Play → Open Play).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="placement-page">Category (page)</Label>
        <Select
          value={primaryPage || '__none__'}
          onValueChange={(page) => {
            if (page === '__none__') {
              onChange({ displayPages: [], schedulingCategoryIds: [] })
              return
            }
            const nextPage = page as MembershipDisplayPage
            const displayPages = value.displayPages.includes('membership')
              ? [...new Set<MembershipDisplayPage>(['membership', nextPage])]
              : [nextPage]
            onChange({
              displayPages,
              schedulingCategoryIds: [],
            })
          }}
        >
          <SelectTrigger id="placement-page">
            <SelectValue placeholder="Select page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Not listed on section pages</SelectItem>
            {MEMBERSHIP_DISPLAY_PAGE_OPTIONS.filter((opt) => opt.value !== 'membership').map(
              (opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      {primaryPage && primaryPage !== 'membership' ? (
        <div className="space-y-2">
          <Label htmlFor="placement-sub">Sub-category (section)</Label>
          <Select
            value={primaryCategoryId || MEMBERSHIP_PLACEMENT_ALL_SUBCATEGORIES}
            onValueChange={(categoryId) => {
              if (categoryId === MEMBERSHIP_PLACEMENT_ALL_SUBCATEGORIES) {
                onChange({ ...value, schedulingCategoryIds: [] })
                return
              }
              onChange({ ...value, schedulingCategoryIds: [categoryId] })
            }}
          >
            <SelectTrigger id="placement-sub">
              <SelectValue placeholder="All sub-categories on page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MEMBERSHIP_PLACEMENT_ALL_SUBCATEGORIES}>
                All sub-categories on this page
              </SelectItem>
              {subCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border"
          checked={value.displayPages.includes('membership')}
          onChange={() => {
            const has = value.displayPages.includes('membership')
            onChange({
              ...value,
              displayPages: has
                ? value.displayPages.filter((entry) => entry !== 'membership')
                : [...value.displayPages, 'membership'],
            })
          }}
        />
        Also list on membership page (/membership)
      </label>
    </div>
  )
}
