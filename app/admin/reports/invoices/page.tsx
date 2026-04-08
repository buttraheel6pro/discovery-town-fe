/** Invoice list — filters, actions, create/edit modal. */
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Plus } from 'lucide-react'

import { InvoiceFormModal } from '@/components/admin/invoice-form-modal'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useReports } from '@/lib/reports-store'
import type { Invoice } from '@/lib/types'
import { InvoiceStatusEnum } from '@/lib/types'
import { formatPrice, isInvoiceOverdue } from '@/lib/utils'

type InvTab = 'ALL' | 'OVERDUE' | 'DRAFT' | 'SENT' | 'PAID' | 'VOID'

const TAB_ITEMS: { value: InvTab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'VOID', label: 'Void' },
]

function invoiceMatchesTab(inv: Invoice, tab: InvTab): boolean {
  if (tab === 'ALL') return true
  if (tab === 'OVERDUE') {
    return (
      inv.status === 'OVERDUE' || (inv.status === 'SENT' && isInvoiceOverdue(inv))
    )
  }
  return inv.status === tab
}

export default function ReportsInvoicesPage() {
  const { invoices, sendInvoice, markInvoicePaid, voidInvoice } = useReports()
  const { toast } = useToast()
  const [tab, setTab] = useState<InvTab>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [voidTarget, setVoidTarget] = useState<Invoice | null>(null)

  const filtered = useMemo(
    () => invoices.filter((i) => invoiceMatchesTab(i, tab)),
    [invoices, tab],
  )

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(inv: Invoice) {
    setEditing(inv)
    setFormOpen(true)
  }

  function handleSend(id: string) {
    sendInvoice(id)
    toast({ title: 'Invoice sent' })
  }

  function handlePaid(id: string) {
    markInvoicePaid(id)
    toast({ title: 'Marked as paid' })
  }

  function confirmVoid() {
    if (!voidTarget) return
    voidInvoice(voidTarget.id)
    toast({ title: 'Invoice voided', variant: 'destructive' })
    setVoidTarget(null)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-black tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Invoices
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create, send, and reconcile billing documents.
          </p>
        </div>
        <Button
          type="button"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={openNew}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          New invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>All invoices</CardTitle>
          <CardDescription>Filter by lifecycle status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as InvTab)}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              {TAB_ITEMS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link
                      href={`/admin/reports/invoices/${inv.id}`}
                      className="font-mono text-sm font-semibold text-primary hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground">
                      {inv.contactName ?? '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">{inv.contactEmail ?? ''}</div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatPrice(inv.total)}</TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(inv.dueDate).toLocaleDateString('en-GB')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" aria-label="Invoice actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/reports/invoices/${inv.id}`} className="cursor-pointer">
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(inv)}>Edit</DropdownMenuItem>
                        {inv.status === InvoiceStatusEnum.DRAFT ? (
                          <DropdownMenuItem onClick={() => handleSend(inv.id)}>Send</DropdownMenuItem>
                        ) : null}
                        {inv.status === InvoiceStatusEnum.SENT || inv.status === InvoiceStatusEnum.OVERDUE ? (
                          <DropdownMenuItem onClick={() => handlePaid(inv.id)}>Mark paid</DropdownMenuItem>
                        ) : null}
                        {inv.status !== InvoiceStatusEnum.VOID && inv.status !== InvoiceStatusEnum.PAID ? (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setVoidTarget(inv)}
                          >
                            Void
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InvoiceFormModal
        invoice={editing}
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
      />

      <AlertDialog open={voidTarget !== null} onOpenChange={(o) => !o && setVoidTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              {voidTarget
                ? `This will mark ${voidTarget.invoiceNumber} as void. You can still view it for audit.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmVoid}
            >
              Void invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
