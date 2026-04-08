/** Single invoice — document preview, print, lifecycle actions. */
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'

import { InvoiceDocument } from '@/components/admin/invoice-document'
import { InvoiceStatusBadge } from '@/components/admin/invoice-status-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useReports } from '@/lib/reports-store'
import type { Invoice } from '@/lib/types'
import { InvoiceStatusEnum } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''
  const { invoices, sendInvoice, markInvoicePaid, voidInvoice } = useReports()
  const { toast } = useToast()
  const [voidOpen, setVoidOpen] = useState(false)

  const invoice = useMemo(() => invoices.find((i) => i.id === id), [invoices, id])

  if (!invoice) {
    return (
      <div className="space-y-6">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/admin/reports/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Back to invoices
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
            Invoice not found.
          </CardContent>
        </Card>
      </div>
    )
  }

  const inv = invoice

  function handlePrint() {
    window.print()
  }

  function handleSend(target: Invoice) {
    sendInvoice(target.id)
    toast({ title: 'Invoice sent' })
  }

  function handlePaid(target: Invoice) {
    markInvoicePaid(target.id)
    toast({ title: 'Marked as paid' })
  }

  function handleVoid() {
    voidInvoice(inv.id)
    toast({ title: 'Invoice voided', variant: 'destructive' })
    setVoidOpen(false)
    router.push('/admin/reports/invoices')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/admin/reports/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Invoices
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" aria-hidden />
            Print
          </Button>
          {inv.status === InvoiceStatusEnum.DRAFT ? (
            <Button
              type="button"
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => handleSend(inv)}
            >
              Send
            </Button>
          ) : null}
          {inv.status === InvoiceStatusEnum.SENT || inv.status === InvoiceStatusEnum.OVERDUE ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => handlePaid(inv)}
            >
              Mark paid
            </Button>
          ) : null}
          {inv.status !== InvoiceStatusEnum.VOID && inv.status !== InvoiceStatusEnum.PAID ? (
            <Button type="button" size="sm" variant="destructive" onClick={() => setVoidOpen(true)}>
              Void
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h1
          className="text-2xl font-black tracking-tight text-foreground"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {inv.invoiceNumber}
        </h1>
        <InvoiceStatusBadge status={inv.status} />
        <span className="text-sm text-muted-foreground">
          Total {formatPrice(inv.total)}
        </span>
      </div>

      <InvoiceDocument invoice={inv} />

      <AlertDialog open={voidOpen} onOpenChange={setVoidOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark {inv.invoiceNumber} as void. This action is intended for billing
              corrections only.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleVoid}
            >
              Void invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
