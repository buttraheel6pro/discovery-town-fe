/** Create / edit invoice — CrudModal + line items + contact picker. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { ContactSearchCombobox } from '@/components/admin/contact-search-combobox'
import { CrudModal } from '@/components/admin/crud-modal'
import { LineItemBuilder, type LineItemDraft } from '@/components/admin/line-item-builder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useClients } from '@/lib/client-store'
import { useReports } from '@/lib/reports-store'
import type { Invoice, InvoiceLineItem } from '@/lib/types'
import { InvoiceStatusEnum } from '@/lib/types'
import { calcInvoiceTotals, formatPrice } from '@/lib/utils'

export interface InvoiceFormModalProps {
  readonly invoice?: Invoice | null
  readonly open: boolean
  readonly onClose: () => void
}

function nextInvoiceNumber(existing: Invoice[]): string {
  const nums = existing
    .map((i) => i.invoiceNumber.match(/INV-(\d+)/)?.[1])
    .filter(Boolean)
    .map((s) => Number.parseInt(s ?? '0', 10))
  const max = nums.length ? Math.max(...nums) : 0
  return `INV-${String(max + 1).padStart(4, '0')}`
}

export function InvoiceFormModal({
  invoice,
  open,
  onClose,
}: Readonly<InvoiceFormModalProps>) {
  const { contacts } = useClients()
  const { addInvoice, updateInvoice, sendInvoice, invoices } = useReports()
  const { toast } = useToast()

  const [contactId, setContactId] = useState<string | undefined>(undefined)
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ])
  const [discount, setDiscount] = useState('0')
  const [taxRate, setTaxRate] = useState('20')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (invoice) {
      setContactId(invoice.contactId)
      setLineItems(
        invoice.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        })),
      )
      setDiscount(String(invoice.discount))
      setTaxRate(
        invoice.subtotal > 0
          ? String(Math.round((invoice.tax / (invoice.subtotal - invoice.discount)) * 100) || 20)
          : '20',
      )
      setDueDate(invoice.dueDate.split('T')[0] ?? '')
      setNotes(invoice.notes ?? '')
    } else {
      setContactId(undefined)
      setLineItems([{ description: '', quantity: 1, unitPrice: 0 }])
      setDiscount('0')
      setTaxRate('20')
      const d = new Date()
      d.setDate(d.getDate() + 14)
      setDueDate(d.toISOString().split('T')[0] ?? '')
      setNotes('')
    }
  }, [open, invoice])

  const totals = useMemo(() => {
    const disc = Number.parseFloat(discount) || 0
    const rate = Number.parseFloat(taxRate) || 0
    return calcInvoiceTotals(lineItems, disc, rate)
  }, [discount, lineItems, taxRate])

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === contactId),
    [contacts, contactId],
  )

  function buildLineItems(): InvoiceLineItem[] {
    return lineItems
      .filter((li) => li.description.trim().length > 0)
      .map((li, i) => {
        const totalPrice = Math.round(li.quantity * li.unitPrice * 100) / 100
        return {
          id: `ili-new-${i}`,
          description: li.description.trim(),
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          totalPrice,
          total: totalPrice,
        }
      })
  }

  function save(asDraft: boolean) {
    if (!contactId || !selectedContact) {
      toast({ title: 'Select a contact', variant: 'destructive' })
      return
    }
    const items = buildLineItems()
    if (items.length === 0) {
      toast({ title: 'Add at least one line item', variant: 'destructive' })
      return
    }
    const disc = Number.parseFloat(discount) || 0
    const rate = Number.parseFloat(taxRate) || 0
    const { subtotal, taxAmount, total } = calcInvoiceTotals(
      items.map((li) => ({ quantity: li.quantity, unitPrice: li.unitPrice })),
      disc,
      rate,
    )

    const nowIso = new Date().toISOString()
    const dueIso = new Date(dueDate || nowIso).toISOString()
    const displayName = `${selectedContact.firstName} ${selectedContact.lastName}`.trim()

    if (invoice) {
      updateInvoice(invoice.id, {
        lineItems: items,
        subtotal,
        discount: disc,
        tax: taxAmount,
        total,
        dueDate: dueIso,
        notes: notes.trim() || undefined,
        contactName: displayName,
        contactEmail: selectedContact.email ?? null,
      })
      if (!asDraft) {
        sendInvoice(invoice.id)
      }
      toast({
        title: asDraft ? 'Invoice saved' : 'Invoice saved and sent',
      })
    } else {
      const newInv: Invoice = {
        id: `inv-${Date.now()}`,
        tenantId: 'tenant-1',
        invoiceNumber: nextInvoiceNumber(invoices),
        contactId,
        contactName: displayName,
        contactEmail: selectedContact.email ?? null,
        lineItems: items,
        subtotal,
        discount: disc,
        tax: taxAmount,
        total,
        paidAmount: 0,
        status: asDraft ? InvoiceStatusEnum.DRAFT : InvoiceStatusEnum.SENT,
        dueDate: dueIso,
        paidDate: null,
        sentAt: asDraft ? null : nowIso,
        notes: notes.trim() || undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      }
      addInvoice(newInv)
      toast({
        title: asDraft ? 'Draft created' : 'Invoice created and sent',
      })
    }
    onClose()
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
      title={invoice ? `Edit ${invoice.invoiceNumber}` : 'New invoice'}
      description="Line items, tax, and due date."
      size="lg"
      variant={invoice ? 'edit' : 'create'}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={() => save(true)}>
            Save as draft
          </Button>
          <Button
            type="button"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => save(false)}
          >
            Save and send
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Contact</Label>
          <ContactSearchCombobox
            contacts={contacts}
            value={contactId}
            onChange={setContactId}
            placeholder="Search customer…"
          />
        </div>

        <LineItemBuilder items={lineItems} onChange={setLineItems} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="inv-discount">Discount (£)</Label>
            <Input
              id="inv-discount"
              type="number"
              min={0}
              step={0.01}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-tax">Tax rate (%)</Label>
            <Input
              id="inv-tax"
              type="number"
              min={0}
              step={0.01}
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-due">Due date</Label>
            <Input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatPrice(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">{formatPrice(totals.taxAmount)}</span>
          </div>
          <div className="mt-2 flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(totals.total)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inv-notes">Notes</Label>
          <Textarea
            id="inv-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes…"
          />
        </div>
      </div>
    </CrudModal>
  )
}
