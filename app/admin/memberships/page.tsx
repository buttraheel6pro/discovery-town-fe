/** Admin membership plans — catalog cards, subscriber counts, and create sheet. */
'use client'

import { useMemo, useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useClients } from '@/lib/client-store'
import type { BillingCycle, MembershipPlan } from '@/lib/types'

export default function AdminMembershipsPage() {
  const {
    membershipPlans,
    subscriptions,
    addMembershipPlan,
    updateMembershipPlan,
  } = useClients()

  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY')
  const [benefitsText, setBenefitsText] = useState('')
  const [featured, setFeatured] = useState(false)

  const subscriberCountByPlan = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of subscriptions) {
      if (s.status !== 'ACTIVE' && s.status !== 'TRIALING' && s.status !== 'PAUSED') {
        continue
      }
      m.set(s.planId, (m.get(s.planId) ?? 0) + 1)
    }
    return m
  }, [subscriptions])

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const p = Number.parseFloat(price)
    if (!name.trim() || !Number.isFinite(p)) return
    const benefits = benefitsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const now = new Date().toISOString()
    const plan: MembershipPlan = {
      id: `mplan-${Date.now()}`,
      tenantId: 'tenant-1',
      name: name.trim(),
      description: description.trim() || undefined,
      billingCycle,
      price: p,
      benefits,
      isActive: true,
      isFeatured: featured,
      createdAt: now,
      updatedAt: now,
    }
    addMembershipPlan(plan)
    setName('')
    setDescription('')
    setPrice('')
    setBenefitsText('')
    setFeatured(false)
    setBillingCycle('MONTHLY')
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Memberships
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage recurring plans shown to customers and staff.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
          New plan
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {membershipPlans.map((plan) => (
          <Card key={plan.id} className={!plan.isActive ? 'opacity-70' : ''}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div>
                <CardTitle
                  className="text-base font-semibold"
                  style={{ fontFamily: 'var(--font-barlow)' }}
                >
                  {plan.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {subscriberCountByPlan.get(plan.id) ?? 0} active subscribers
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {plan.billingCycle}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">£{plan.price}</span>
                <span className="text-xs text-muted-foreground">/ cycle</span>
              </div>
              {plan.description ? (
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              ) : null}
              <ul className="text-xs text-muted-foreground space-y-1">
                {plan.benefits.slice(0, 5).map((b) => (
                  <li key={b} className="flex gap-1.5">
                    <span className="text-accent">•</span>
                    {b}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={plan.isActive}
                    onCheckedChange={(c) =>
                      updateMembershipPlan(plan.id, { isActive: c })
                    }
                    id={`active-${plan.id}`}
                  />
                  <Label htmlFor={`active-${plan.id}`} className="text-xs">
                    Active
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={plan.isFeatured}
                    onCheckedChange={(c) =>
                      updateMembershipPlan(plan.id, { isFeatured: c })
                    }
                    id={`feat-${plan.id}`}
                  />
                  <Label htmlFor={`feat-${plan.id}`} className="text-xs">
                    Featured
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CrudModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="New membership plan"
        description="Recurring plan shown to customers and staff."
        size="md"
        variant="create"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="admin-membership-form">
              Save plan
            </Button>
          </>
        }
      >
        <form id="admin-membership-form" onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea
              id="p-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-price">Price (£)</Label>
              <Input
                id="p-price"
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Billing</Label>
              <Select
                value={billingCycle}
                onValueChange={(v) => setBillingCycle(v as BillingCycle)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-ben">Benefits (one per line)</Label>
            <Textarea
              id="p-ben"
              rows={5}
              value={benefitsText}
              onChange={(e) => setBenefitsText(e.target.value)}
              placeholder="Unlimited weekday play&#10;10% off parties"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="p-feat" checked={featured} onCheckedChange={setFeatured} />
            <Label htmlFor="p-feat">Featured on marketing pages</Label>
          </div>
        </form>
      </CrudModal>
    </div>
  )
}
