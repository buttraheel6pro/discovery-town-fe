/** Admin subscription modal for creating memberships on behalf of contacts. */
'use client'

import { useMemo, useState } from 'react'

import { CouponPanel } from '@/components/customer/coupon-panel'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useClients } from '@/lib/client-store'
import type { CmContact, ContactSubscription, Coupon, MembershipPlan } from '@/lib/types'

interface SubscribeAdminModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly contact: CmContact
}

type AdminSubscriptionPayment = 'CARD' | 'CASH' | 'INVOICE' | 'COMPLIMENTARY'

const MOCK_STAFF_ID = 'staff-1'

function subscriptionPeriodEndIso(plan: MembershipPlan): string {
  const periodEnd = new Date()
  if (plan.billingCycle === 'MONTHLY') {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  } else if (plan.billingCycle === 'ANNUAL') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else if (plan.billingCycle === 'WEEKLY') {
    periodEnd.setDate(periodEnd.getDate() + 7)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 3)
  }
  return periodEnd.toISOString()
}

export function SubscribeAdminModal({
  open,
  onOpenChange,
  contact,
}: SubscribeAdminModalProps) {
  const { contacts, membershipPlans, enrollContact, subscriptions } = useClients()
  const { toast } = useToast()

  const activePlans = useMemo(
    () => membershipPlans.filter((plan) => plan.isActive),
    [membershipPlans],
  )
  const [planId, setPlanId] = useState(activePlans[0]?.id ?? '')
  const [paymentMethod, setPaymentMethod] = useState<AdminSubscriptionPayment>('CARD')
  const [selectedFamilyMemberIds, setSelectedFamilyMemberIds] = useState<string[]>([])
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)

  const selectedPlan = activePlans.find((plan) => plan.id === planId) ?? null
  const existingActive = subscriptions.some(
    (subscription) =>
      subscription.contactId === contact.id &&
      ['ACTIVE', 'TRIALING', 'PAUSED'].includes(subscription.status),
  )

  const childFamilyMembers = useMemo(() => {
    const relatedIds = new Set((contact.relationships ?? []).map((row) => row.relatedContactId))
    return contacts.filter(
      (entry) => relatedIds.has(entry.id) && entry.contactType === 'CHILD',
    )
  }, [contact.relationships, contacts])

  function toggleFamilyMember(id: string, checked: boolean) {
    setSelectedFamilyMemberIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id]
      }
      return prev.filter((entry) => entry !== id)
    })
  }

  function submitSubscription() {
    if (!selectedPlan || existingActive) {
      return
    }
    if (selectedPlan.allowFamilyMember && selectedFamilyMemberIds.length === 0) {
      toast({
        title: 'Select family members',
        description: 'This plan requires at least one linked child profile.',
        variant: 'destructive',
      })
      return
    }

    const nowIso = new Date().toISOString()
    const created: ContactSubscription = {
      id: `sub-admin-${contact.id}-${selectedPlan.id}-${Date.now()}`,
      tenantId: contact.tenantId,
      contactId: contact.id,
      planId: selectedPlan.id,
      plan: selectedPlan,
      status: paymentMethod === 'INVOICE' ? 'PAST_DUE' : 'ACTIVE',
      startedAt: nowIso,
      currentPeriodStart: nowIso,
      currentPeriodEnd: subscriptionPeriodEndIso(selectedPlan),
      familyMemberIds:
        selectedPlan.allowFamilyMember && selectedFamilyMemberIds.length > 0
          ? selectedFamilyMemberIds
          : undefined,
      couponCode: couponCode && couponDiscount > 0 ? couponCode : undefined,
      actedByStaffId: MOCK_STAFF_ID,
    }
    enrollContact(created)
    toast({
      title: 'Membership created',
      description: `${selectedPlan.name} added to ${contact.firstName} ${contact.lastName}.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add membership</DialogTitle>
          <DialogDescription>
            Create a subscription on behalf of {contact.firstName} {contact.lastName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Membership plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {activePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlan?.allowFamilyMember ? (
            <div className="space-y-2">
              <Label>Family members</Label>
              {childFamilyMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No linked child contacts available.
                </p>
              ) : (
                <div className="space-y-2 rounded-md border border-border p-3">
                  {childFamilyMembers.map((member) => {
                    const checked = selectedFamilyMemberIds.includes(member.id)
                    return (
                      <label key={member.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleFamilyMember(member.id, value === true)}
                        />
                        {member.firstName} {member.lastName}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          ) : null}

          <CouponPanel
            context="MEMBERSHIP"
            subtotal={selectedPlan?.price ?? 0}
            onCouponApplied={(coupon: Coupon | null, discountAmount: number) => {
              if (!coupon || discountAmount <= 0) {
                setCouponCode(null)
                setCouponDiscount(0)
                return
              }
              setCouponCode(coupon.code)
              setCouponDiscount(discountAmount)
            }}
            contactId={contact.id}
            hasActiveSubscription={existingActive}
          />

          <div className="space-y-2">
            <Label>Payment method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as AdminSubscriptionPayment)}
            >
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="CARD" />
                Charge card on file
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="CASH" />
                Cash or POS payment
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="INVOICE" />
                Record as invoice
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="COMPLIMENTARY" />
                Complimentary
              </label>
            </RadioGroup>
          </div>

          {existingActive ? (
            <p className="text-sm text-destructive">
              This contact already has an active membership.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!selectedPlan || existingActive} onClick={submitSubscription}>
            Add membership
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
