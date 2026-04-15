/** Admin shop modal for placing contact-linked orders. */
'use client'

import { useMemo, useState } from 'react'

import { ProductPOSCard } from '@/components/admin/product-pos-card'
import { CouponPanel } from '@/components/customer/coupon-panel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useInventory } from '@/lib/inventory-store'
import { formatPrice } from '@/lib/utils'
import type { CmContact, Coupon, Order, OrderItem, Product } from '@/lib/types'

interface ShopAdminModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly contact: CmContact
}

type AdminOrderPayment = 'CARD' | 'CASH' | 'BANK_TRANSFER' | 'INVOICE' | 'COMPLIMENTARY'

const MOCK_STAFF_ID = 'staff-1'

interface CartRow {
  readonly product: Product
  readonly quantity: number
}

export function ShopAdminModal({ open, onOpenChange, contact }: ShopAdminModalProps) {
  const { products, addOrder } = useInventory()
  const { toast } = useToast()

  const [paymentMethod, setPaymentMethod] = useState<AdminOrderPayment>('CARD')
  const [search, setSearch] = useState('')
  const [cartRows, setCartRows] = useState<CartRow[]>([])
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)

  const searchableProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products
      .filter((product) => product.isActive)
      .filter((product) => product.availablePOS !== false)
      .filter((product) => {
        if (!query) return true
        const source = `${product.name} ${product.sku ?? ''}`.toLowerCase()
        return source.includes(query)
      })
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, search])

  const subtotal = useMemo(
    () =>
      Math.round(
        cartRows.reduce((sum, row) => sum + row.product.price * row.quantity, 0) * 100,
      ) / 100,
    [cartRows],
  )
  const total = Math.max(0, Math.round((subtotal - couponDiscount) * 100) / 100)

  function addProductToCart(product: Product, quantity: number) {
    setCartRows((prev) => {
      const idx = prev.findIndex((row) => row.product.id === product.id)
      if (idx === -1) {
        return [...prev, { product, quantity }]
      }
      return prev.map((row, index) =>
        index === idx ? { ...row, quantity: row.quantity + quantity } : row,
      )
    })
  }

  function updateQuantity(productId: string, quantity: number) {
    setCartRows((prev) =>
      prev
        .map((row) =>
          row.product.id === productId ? { ...row, quantity: Math.max(1, quantity) } : row,
        )
        .filter((row) => row.quantity > 0),
    )
  }

  function removeRow(productId: string) {
    setCartRows((prev) => prev.filter((row) => row.product.id !== productId))
  }

  function submitOrder() {
    if (cartRows.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add at least one product to place an order.',
        variant: 'destructive',
      })
      return
    }

    const nowIso = new Date().toISOString()
    const orderId = `order-admin-${Date.now()}`
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const items: OrderItem[] = cartRows.map((row, index) => ({
      id: `order-item-admin-${index}-${row.product.id}`,
      orderId,
      productId: row.product.id,
      product: row.product,
      productName: row.product.name,
      quantity: row.quantity,
      unitPrice: row.product.price,
      totalPrice: Math.round(row.product.price * row.quantity * 100) / 100,
      total: Math.round(row.product.price * row.quantity * 100) / 100,
    }))

    const created: Order = {
      id: orderId,
      tenantId: contact.tenantId,
      orderNumber,
      contactId: contact.id,
      channel: 'POS',
      items,
      subtotal,
      discount: couponDiscount,
      tax: 0,
      total,
      status: paymentMethod === 'INVOICE' ? 'PROCESSING' : 'PROCESSING',
      paymentStatus: paymentMethod === 'INVOICE' ? 'PENDING' : 'PAID',
      paymentGateway:
        paymentMethod === 'CARD'
          ? 'STRIPE'
          : paymentMethod === 'BANK_TRANSFER'
            ? 'CASH'
            : paymentMethod === 'CASH'
              ? 'CASH'
              : undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
      contactName: `${contact.firstName} ${contact.lastName}`.trim(),
      contactEmail: contact.email ?? null,
      couponCode: couponCode && couponDiscount > 0 ? couponCode : null,
      couponDiscount,
      paymentMethod:
        paymentMethod === 'INVOICE' || paymentMethod === 'COMPLIMENTARY'
          ? null
          : paymentMethod,
      actedByStaffId: MOCK_STAFF_ID,
    }

    addOrder(created)
    toast({
      title: 'Order created',
      description: `Order ${orderNumber} created for ${contact.firstName} ${contact.lastName}.`,
    })
    setCartRows([])
    setCouponCode(null)
    setCouponDiscount(0)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Add order</DialogTitle>
          <DialogDescription>
            Create a shop order on behalf of {contact.firstName} {contact.lastName}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product name or SKU..."
            />
            <ScrollArea className="h-[calc(90vh-250px)] rounded-md border border-border p-3">
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {searchableProducts.map((product) => (
                  <ProductPOSCard
                    key={product.id}
                    product={product}
                    onAdd={(nextProduct, quantity) => addProductToCart(nextProduct, quantity)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-border p-3">
              <p className="text-sm font-semibold text-foreground">Cart</p>
              <div className="mt-2 space-y-2">
                {cartRows.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No items added.</p>
                ) : (
                  cartRows.map((row) => (
                    <div key={row.product.id} className="space-y-2 rounded-md border border-border p-2">
                      <p className="text-sm font-medium text-foreground">{row.product.name}</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(event) =>
                            updateQuantity(
                              row.product.id,
                              Number.parseInt(event.target.value || '1', 10) || 1,
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRow(row.product.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <CouponPanel
              context="ORDER"
              subtotal={subtotal}
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
            />

            <div className="rounded-md border border-border p-3">
              <p className="text-sm font-semibold text-foreground">Payment method</p>
              <RadioGroup
                className="mt-2"
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as AdminOrderPayment)}
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
                  <RadioGroupItem value="BANK_TRANSFER" />
                  Bank transfer
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

            <div className="rounded-md border border-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatPrice(couponDiscount)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between font-semibold text-foreground">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={submitOrder}>
            Create order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
