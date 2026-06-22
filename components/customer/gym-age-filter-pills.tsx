/** Horizontal age-group filter pills for the Gym page. */
'use client'

import { cn } from '@/lib/utils'

export interface GymAgeGroup {
  readonly id: string
  /** Display label shown in the pill. */
  readonly label: string
  /** Category IDs included in this age group. */
  readonly categoryIds: readonly string[]
}

export const GYM_AGE_GROUPS: readonly GymAgeGroup[] = [
  {
    id: 'all',
    label: 'All ages',
    categoryIds: [],
  },
  {
    id: 'babies',
    label: 'Babies',
    categoryIds: ['cat-gym-babies'],
  },
  {
    id: 'toddlers',
    label: 'Toddlers',
    categoryIds: ['cat-gym-toddlers'],
  },
  {
    id: 'preschool',
    label: 'Preschool',
    categoryIds: ['cat-gym-preschool'],
  },
  {
    id: 'kids',
    label: 'Kids (6–12)',
    categoryIds: ['cat-gym-kids'],
  },
  {
    id: 'teens',
    label: 'Teens',
    categoryIds: ['cat-gym-teens'],
  },
  {
    id: 'adults',
    label: 'Adults',
    categoryIds: ['cat-gym-adults'],
  },
  {
    id: 'seniors',
    label: 'Seniors',
    categoryIds: ['cat-gym-seniors'],
  },
  {
    id: 'family',
    label: 'Family',
    categoryIds: ['cat-gym-family'],
  },
  {
    id: 'inclusive',
    label: 'Inclusive',
    categoryIds: ['cat-gym-prenatal', 'cat-gym-special-needs'],
  },
]

interface GymAgeFilterPillsProps {
  readonly selectedGroupId: string
  readonly onSelect: (groupId: string) => void
}

export function GymAgeFilterPills({ selectedGroupId, onSelect }: GymAgeFilterPillsProps) {
  return (
    <div
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      role="group"
      aria-label="Filter by age group"
    >
      {GYM_AGE_GROUPS.map((group) => {
        const isActive = selectedGroupId === group.id
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelect(group.id)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-primary text-primary-foreground ring-primary'
                : 'bg-background text-foreground ring-border hover:bg-accent hover:text-accent-foreground',
            )}
            aria-pressed={isActive}
          >
            {group.label}
          </button>
        )
      })}
    </div>
  )
}
