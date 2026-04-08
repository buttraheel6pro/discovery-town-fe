/** Admin private hire enquiries — review, approve, reject. */
'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { ApproveHireModal } from '@/components/admin/approve-hire-modal'
import { PrivateHireStatusBadge } from '@/components/admin/private-hire-status-badge'
import { RejectHireModal } from '@/components/admin/reject-hire-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useCalendar } from '@/lib/calendar-store'
import { formatPrivateHireEventType } from '@/lib/utils'
import type { PrivateHireInquiry, PrivateHireStatus } from '@/lib/types'

function formatWhen(iso: string): string {
  try {
    return format(parseISO(iso), 'd MMM yyyy, HH:mm')
  } catch {
    return iso
  }
}

export default function AdminPrivateHirePage() {
  const { inquiries, updateInternalNotes } = useCalendar()
  const [tab, setTab] = useState<'all' | PrivateHireStatus>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [approveFor, setApproveFor] = useState<PrivateHireInquiry | null>(null)
  const [rejectFor, setRejectFor] = useState<PrivateHireInquiry | null>(null)

  const filtered = useMemo(() => {
    if (tab === 'all') return inquiries
    return inquiries.filter((i) => i.status === tab)
  }, [inquiries, tab])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Private hire requests</h1>
        <p className="text-muted-foreground mt-2">
          Review enquiries, add internal notes, and approve or reject requests.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Enquiries</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-sm text-muted-foreground">No private hire requests yet.</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/private-hire">View public page</Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>Guest</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Preferred date</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => {
                      const open = expandedId === row.id
                      return (
                        <Fragment key={row.id}>
                          <TableRow
                            className="cursor-pointer"
                            onClick={() => setExpandedId(open ? null : row.id)}
                          >
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-expanded={open}>
                                {open ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">{row.contactName}</TableCell>
                            <TableCell>{formatPrivateHireEventType(row.eventType)}</TableCell>
                            <TableCell className="max-w-[140px] truncate">{row.service.name}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatWhen(row.preferredDate)}
                            </TableCell>
                            <TableCell>{row.guestCount}</TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                              {formatWhen(row.submittedAt)}
                            </TableCell>
                            <TableCell>
                              <PrivateHireStatusBadge status={row.status} />
                            </TableCell>
                          </TableRow>
                          {open ? (
                            <TableRow>
                              <TableCell colSpan={8} className="bg-muted/30">
                                <div
                                  className="p-4 space-y-4 max-w-3xl"
                                  onClick={(e) => e.stopPropagation()}
                                  role="presentation"
                                >
                                  {row.notes ? (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground">
                                        Customer notes
                                      </p>
                                      <p className="text-sm mt-1">{row.notes}</p>
                                    </div>
                                  ) : null}
                                  {row.alternateDate ? (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground">
                                        Alternate date
                                      </p>
                                      <p className="text-sm mt-1">{formatWhen(row.alternateDate)}</p>
                                    </div>
                                  ) : null}
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                                      Internal notes
                                    </p>
                                    <Textarea
                                      defaultValue={row.internalNotes ?? ''}
                                      rows={3}
                                      onBlur={(e) => updateInternalNotes(row.id, e.target.value)}
                                      placeholder="Visible to staff only"
                                    />
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {row.status === 'PENDING' || row.status === 'REJECTED' ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setApproveFor(row)
                                        }}
                                      >
                                        Approve
                                      </Button>
                                    ) : null}
                                    {row.status === 'PENDING' || row.status === 'APPROVED' ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setRejectFor(row)
                                        }}
                                      >
                                        Reject
                                      </Button>
                                    ) : null}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

      {approveFor ? (
        <ApproveHireModal
          inquiry={approveFor}
          open
          onClose={() => setApproveFor(null)}
        />
      ) : null}
      {rejectFor ? (
        <RejectHireModal inquiry={rejectFor} open onClose={() => setRejectFor(null)} />
      ) : null}
    </div>
  )
}
