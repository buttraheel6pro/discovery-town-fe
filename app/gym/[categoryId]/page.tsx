/**
 * Gym category page — facility-style hero, class list, and cart sidebar.
 */
'use client'

import { use } from 'react'

import { GymCategoryRoutePage } from '@/components/customer/gym-category-route-page'

interface GymCategoryPageProps {
  readonly params: Promise<{ categoryId: string }>
}

export default function GymCategoryPage({ params }: GymCategoryPageProps) {
  const { categoryId } = use(params)
  return <GymCategoryRoutePage categoryId={categoryId} />
}
