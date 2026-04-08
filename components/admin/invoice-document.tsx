/** Print-ready invoice layout — window.print shows only this block. */
'use client'

import { Separator } from '@/components/ui/separator'
import { InvoiceStatusBadge } from '@/components/admin/invoice-status-badge'
import type { Invoice } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

export interface InvoiceDocumentProps {
  readonly invoice: Invoice
  readonly className?: string
}

export function InvoiceDocument({ invoice, className }: Readonly<InvoiceDocumentProps>) {
  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-print-area,
          .invoice-print-area * {
            visibility: visible;
          }
          .invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      <div
        className={`invoice-print-area mx-auto max-w-2xl rounded-xl border border-border bg-card p-8 text-foreground ${className ?? ''}`}
        style={{ fontFamily: 'var(--font-inter), sans-serif' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className="text-xl font-black tracking-tight"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              Discovery Town
            </p>
            <p className="text-xs text-muted-foreground">Invoice</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-bold">{invoice.invoiceNumber}</p>
            <InvoiceStatusBadge status={invoice.status} className="mt-2" />
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Bill to</p>
            <p className="mt-1 font-semibold text-foreground">
              {invoice.contactName ?? invoice.contact?.firstName ?? 'Customer'}{' '}
              {invoice.contact?.lastName ?? ''}
            </p>
            <p className="text-sm text-muted-foreground">
              {invoice.contactEmail ?? invoice.contact?.email ?? '—'}
            </p>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Issued</span>
              <span>{new Date(invoice.createdAt).toLocaleDateString('en-GB')}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Due</span>
              <span>{new Date(invoice.dueDate).toLocaleDateString('en-GB')}</span>
            </div>
            {invoice.paidDate ? (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Paid</span>
                <span>{new Date(invoice.paidDate).toLocaleDateString('en-GB')}</span>
              </div>
            ) : null}
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-right">Qty</span>
            <span className="col-span-2 text-right">Price</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
          {invoice.lineItems.map((li, i) => (
            <div key={li.id ?? i} className="grid grid-cols-12 gap-2 text-sm">
              <span className="col-span-6">{li.description}</span>
              <span className="col-span-2 text-right">{li.quantity}</span>
              <span className="col-span-2 text-right">{formatPrice(li.unitPrice)}</span>
              <span className="col-span-2 text-right font-medium">
                {formatPrice(li.total ?? li.totalPrice)}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        <div className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span>-{formatPrice(invoice.discount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatPrice(invoice.tax)}</span>
          </div>
          <div className="flex justify-between text-base font-black" style={{ fontFamily: 'var(--font-barlow)' }}>
            <span>Total</span>
            <span>{formatPrice(invoice.total)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Paid</span>
            <span>{formatPrice(invoice.paidAmount)}</span>
          </div>
        </div>

        {invoice.notes ? (
          <>
            <Separator className="my-6" />
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm text-foreground">{invoice.notes}</p>
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
