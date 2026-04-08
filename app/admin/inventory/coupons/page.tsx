/** Admin coupons — manage promo codes and usage. */
'use client'

import { useMemo, useState } from 'react'
import { Copy, Plus } from 'lucide-react'

import { CrudModal } from '@/components/admin/crud-modal'
import { CouponForm, type CouponDraft, couponToDraft, draftToCouponPatch } from '@/components/admin/coupon-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useInventory } from '@/lib/inventory-store'
import type { Coupon } from '@/lib/types'

function defaultCouponDraft(): CouponDraft {
  const now = new Date()
  const from = new Date(now.getTime() - 86400000).toISOString()
  const until = new Date(now.getTime() + 86400000 * 30).toISOString()
  return {
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: '',
    usageLimit: '',
    perContactLimit: '',
    validFrom: from,
    validUntil: until,
    requiresSubscription: false,
    isActive: true,
    applicableToShop: true,
    applicableToBooking: false,
    applicableToMembership: false,
  }
}

export default function AdminInventoryCouponsPage() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon, orders } = useInventory()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Coupon | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState<CouponDraft>(defaultCouponDraft)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return coupons
      .filter((c) => (q ? `${c.code} ${c.name}`.toLowerCase().includes(q) : true))
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code))
  }, [coupons, search])

  const usageOrders = useMemo(() => {
    if (!selected) return []
    return orders.filter((o) => (o.couponCode ?? '').toUpperCase() === selected.code.toUpperCase())
  }, [orders, selected])

  function openCreate() {
    setDraft(defaultCouponDraft())
    setCreateOpen(true)
  }

  function persistCreate() {
    const patch = draftToCouponPatch(draft)
    const created: Coupon = {
      id: `coupon-admin-${Date.now()}`,
      tenantId: 'tenant-1',
      code: patch.code ?? 'NEW',
      name: patch.name ?? 'New coupon',
      description: patch.description,
      type: patch.type ?? 'PERCENTAGE',
      value: patch.value ?? 0,
      usageLimit: patch.usageLimit,
      usageCount: 0,
      validFrom: patch.validFrom ?? new Date().toISOString(),
      validUntil: patch.validUntil ?? new Date().toISOString(),
      requiresSubscription: patch.requiresSubscription ?? false,
      applicableTo: patch.applicableTo ?? ['SHOP'],
      isActive: patch.isActive ?? true,
      perContactLimit: patch.perContactLimit,
      restrictToTagId: patch.restrictToTagId,
    }
    addCoupon(created)
    setCreateOpen(false)
  }

  function openEdit(c: Coupon) {
    setSelected(c)
    setDraft(couponToDraft(c))
  }

  function persistEdit() {
    if (!selected) return
    updateCoupon(selected.id, draftToCouponPatch(draft))
    setSelected(null)
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      toast({ title: 'Copied', description: `${code} copied to clipboard.` })
    } catch {
      toast({ title: 'Copy failed', description: 'Clipboard permission denied.' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Coupons</h1>
          <p className="text-muted-foreground mt-2">Create and manage discount codes.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupon list</CardTitle>
          <CardDescription>Search by code or name.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Usage</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      {c.code}
                      <Button variant="ghost" size="icon" onClick={() => void copyCode(c.code)} aria-label="Copy code">
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.description ?? '—'}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.type}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {c.type === 'PERCENTAGE' ? `${c.value}%` : `£${c.value}`}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {c.usageCount}
                    {c.usageLimit != null ? ` / ${c.usageLimit}` : ' / ∞'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch checked={c.isActive} onCheckedChange={(v) => updateCoupon(c.id, { isActive: v })} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          deleteCoupon(c.id)
                          toast({ title: 'Coupon deleted' })
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CrudModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New coupon"
        description="Create a coupon code for shop or booking discounts."
        size="lg"
        variant="create"
        scrollMode="dialog"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={persistCreate}>Create</Button>
          </>
        }
      >
        <CouponForm value={draft} onChange={setDraft} />
      </CrudModal>

      <CrudModal
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title="Edit coupon"
        description="Update coupon details and view usage."
        size="lg"
        variant="edit"
        scrollMode="dialog"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button onClick={persistEdit}>Save</Button>
          </>
        }
      >
        <div className="space-y-6">
          <CouponForm value={draft} onChange={setDraft} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usage history</CardTitle>
              <CardDescription>Orders that used this coupon code.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {usageOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders have used this coupon yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {usageOrders.slice(0, 10).map((o) => (
                    <li key={o.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <span className="font-mono text-xs font-semibold text-foreground">{o.orderNumber}</span>
                      <span className="text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</span>
                      <span className="font-semibold text-foreground">−£{(o.couponDiscount ?? 0).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </CrudModal>
    </div>
  )
}

