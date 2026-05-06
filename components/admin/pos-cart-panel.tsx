/** POS cart panel — cart line items, coupon, totals, and payment actions. */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Minus, Plus, Trash2 } from 'lucide-react'

import { ContactSearchCombobox } from '@/components/admin/contact-search-combobox'
import { CashTenderModal } from '@/components/admin/cash-tender-modal'
import { OrderReceiptModal } from '@/components/admin/order-receipt-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { formatModifierSummary, getMaxPrepTime } from '@/lib/cafe-utils'
import { calcCartTotals, formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import { useClients } from '@/lib/client-store'
import type { Order } from '@/lib/types'

export interface POSCartPanelProps {
  readonly onOrderComplete: (order: Order) => void
}

function buildOrderFromCart(input: {
  orderId: string
  orderNumber: string
  tenantId: string
  channel: 'POS'
  contactId: string
  contactName: string
  contactEmail: string
  items: Order['items']
  subtotal: number
  discount: number
  tax: number
  total: number
  couponCode: string | null
  couponDiscount: number
  paymentGateway: Order['paymentGateway']
  paymentMethod: Order['paymentMethod']
  notes?: string
}): Order {
  const nowIso = new Date().toISOString()
  return {
    id: input.orderId,
    tenantId: input.tenantId,
    orderNumber: input.orderNumber,
    contactId: input.contactId,
    channel: input.channel,
    items: input.items,
    subtotal: input.subtotal,
    discount: input.discount,
    tax: input.tax,
    total: input.total,
    status: 'PROCESSING',
    paymentStatus: 'PAID',
    paymentGateway: input.paymentGateway,
    createdAt: nowIso,
    updatedAt: nowIso,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    couponCode: input.couponCode,
    couponDiscount: input.couponDiscount,
    paymentMethod: input.paymentMethod,
    notes: input.notes,
  }
}

export function POSCartPanel({ onOrderComplete }: Readonly<POSCartPanelProps>) {
  const {
    posCart,
    paymentMethods,
    updatePosCartQuantity,
    removeFromPosCart,
    applyPosCoupon,
    removePosCoupon,
    attachPosCustomer,
    detachPosCustomer,
    addOrder,
    clearPosCart,
  } = useInventory()
  const { contacts } = useClients()
  const { toast } = useToast()

  const [couponInput, setCouponInput] = useState('')
  const [cashOpen, setCashOpen] = useState(false)
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null)

  const { subtotal, tax, total } = useMemo(() => {
    return calcCartTotals(posCart.items, posCart.couponDiscount, 20)
  }, [posCart.couponDiscount, posCart.items])

  const estPrep = useMemo(() => getMaxPrepTime(posCart.items), [posCart.items])

  const discount = posCart.couponDiscount

  const attachedContact = useMemo(() => {
    if (!posCart.contactId) return null
    return contacts.find((c) => c.id === posCart.contactId) ?? null
  }, [posCart.contactId, contacts])

  const contactPaymentMethods = useMemo(() => {
    if (!posCart.contactId) return []
    return paymentMethods
      .filter((m) => m.contactId === posCart.contactId)
      .slice()
      .sort((a, b) => (a.isDefault === b.isDefault ? b.createdAt.localeCompare(a.createdAt) : a.isDefault ? -1 : 1))
  }, [paymentMethods, posCart.contactId])

  useEffect(() => {
    if (selectedPaymentMethodId) return
    const defaultMethod =
      contactPaymentMethods.find((m) => m.isDefault) ?? contactPaymentMethods[0] ?? null
    if (defaultMethod) setSelectedPaymentMethodId(defaultMethod.id)
  }, [contactPaymentMethods, selectedPaymentMethodId])

  const orderItems = useMemo<Order['items']>(() => {
    return posCart.items
      .filter((i) => i.type === 'product')
      .map((i) => {
        const productId = String(i.metadata?.productId ?? '')
        return {
          id: `li-${i.id}`,
          orderId: 'pending',
          productId,
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          totalPrice: i.price * i.quantity,
          total: i.price * i.quantity,
          sku: typeof i.description === 'string' ? i.description : undefined,
          imageUrl: i.imageUrl ?? null,
        }
      })
  }, [posCart.items])

  const canPay = posCart.items.length > 0

  function doApplyCoupon() {
    if (!couponInput.trim()) return
    applyPosCoupon(couponInput.trim())
    setCouponInput('')
  }

  function completePaidOrder(paymentGateway: Order['paymentGateway'], paymentMethod: Order['paymentMethod'], notes?: string) {
    if (!attachedContact) {
      toast({ title: 'Attach customer', description: 'Select a customer before completing payment.' })
      return
    }

    if (paymentMethod === 'CARD') {
      const selected =
        contactPaymentMethods.find((m) => m.id === selectedPaymentMethodId) ??
        contactPaymentMethods.find((m) => m.isDefault) ??
        contactPaymentMethods[0] ??
        null
      if (!selected) {
        toast({
          title: 'No saved card',
          description: 'This customer has no saved card. Ask them to pay online first to save a card.',
          variant: 'destructive',
        })
        return
      }
    }

    const orderId = `order-pos-${Date.now()}`
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const items = orderItems.map((li) => ({ ...li, orderId }))
    const created = buildOrderFromCart({
      orderId,
      orderNumber,
      tenantId: attachedContact.tenantId,
      channel: 'POS',
      contactId: attachedContact.id,
      contactName: `${attachedContact.firstName} ${attachedContact.lastName}`.trim(),
      contactEmail: attachedContact.email ?? '',
      items,
      subtotal,
      discount,
      tax,
      total,
      couponCode: posCart.couponCode,
      couponDiscount: posCart.couponDiscount,
      paymentGateway,
      paymentMethod,
      notes,
    })

    addOrder(created)
    setReceiptOrder(created)
    onOrderComplete(created)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-4 p-4">
        <p className="text-lg font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
          Current order
        </p>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Attach to customer (optional)
          </p>
          <ContactSearchCombobox
            contacts={contacts}
            value={posCart.contactId ?? undefined}
            onChange={(id) => {
              if (!id) {
                detachPosCustomer()
                setSelectedPaymentMethodId(null)
                return
              }
              const c = contacts.find((x) => x.id === id)
              attachPosCustomer(id, c ? `${c.firstName} ${c.lastName}`.trim() : 'Customer')
              setSelectedPaymentMethodId(null)
            }}
            placeholder="Search customers..."
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Saved card
          </p>
          <Select
            value={selectedPaymentMethodId ?? undefined}
            onValueChange={(v) => setSelectedPaymentMethodId(v)}
            disabled={!attachedContact || contactPaymentMethods.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  attachedContact
                    ? contactPaymentMethods.length > 0
                      ? 'Select a card…'
                      : 'No saved cards'
                    : 'Attach a customer first'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {contactPaymentMethods.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.brand} •••• {m.last4} (exp {String(m.expMonth).padStart(2, '0')}/{String(m.expYear).slice(-2)}
                  ){m.isDefault ? ' — default' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Cards are saved after a successful customer checkout (mock).
          </p>
        </div>
      </div>

      <Separator />

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {posCart.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          posCart.items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted/30">
                <Image
                  src={item.imageUrl ?? '/placeholder.jpg'}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                {item.subtypeLabel?.trim() ? (
                  <p className="truncate text-xs text-muted-foreground">{item.subtypeLabel}</p>
                ) : null}
                {item.selectedModifiers?.length ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {formatModifierSummary(item.selectedModifiers)}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">{formatPrice(item.price)}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updatePosCartQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      value={String(item.quantity)}
                      onChange={(e) => {
                        const next = Number.parseInt(e.target.value || '1', 10)
                        if (!Number.isFinite(next)) return
                        updatePosCartQuantity(item.id, next)
                      }}
                      inputMode="numeric"
                      className="h-8 w-16 text-center"
                      aria-label="Quantity"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updatePosCartQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromPosCart(item.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Separator />

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coupon</p>
          <div className="flex gap-2">
            <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Code" />
            <Button variant="outline" onClick={doApplyCoupon}>
              Apply
            </Button>
          </div>
          {posCart.couponCode ? (
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-700">
                Applied <span className="font-mono">{posCart.couponCode}</span> (−{formatPrice(posCart.couponDiscount)})
              </span>
              <button type="button" className="text-muted-foreground underline" onClick={removePosCoupon}>
                Remove
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 ? (
            <div className="flex justify-between text-green-700">
              <span>Discount</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          {estPrep > 0 ? (
            <p className="text-xs text-muted-foreground">Est. prep: ~{estPrep} min</p>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            className="w-full"
            disabled={!canPay || !attachedContact}
            onClick={() => completePaidOrder('STRIPE', 'CARD')}
          >
            Card
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={!canPay || !attachedContact}
            onClick={() => setCashOpen(true)}
          >
            Cash
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={!canPay || !attachedContact}
            onClick={() => completePaidOrder('CASH', 'BANK_TRANSFER')}
          >
            Bank
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          disabled={posCart.items.length === 0}
          onClick={() => {
            clearPosCart()
            toast({ title: 'Cart cleared' })
          }}
        >
          Clear cart
        </Button>
      </div>

      <CashTenderModal
        total={total}
        open={cashOpen}
        onClose={() => setCashOpen(false)}
        onComplete={() => {
          setCashOpen(false)
          completePaidOrder('CASH', 'CASH')
        }}
      />

      {receiptOrder ? (
        <OrderReceiptModal
          order={receiptOrder}
          open={receiptOrder !== null}
          onClose={() => setReceiptOrder(null)}
        />
      ) : null}
    </div>
  )
}

