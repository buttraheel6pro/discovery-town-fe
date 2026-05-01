/** Admin staff assignment page for pending rental/service roles. */
'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'

import { StaffAssignmentAssignModal } from '@/components/admin/staff-assignment-assign-modal'
import { useInventory } from '@/lib/inventory-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { StaffAssignment } from '@/lib/types'

export default function StaffAssignmentsPage() {
  const { staffAssignments, assignStaffToAssignment, updateStaffAssignmentStatus } = useInventory()
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<StaffAssignment | null>(null)
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  >('PENDING')
  const filteredAssignments = useMemo(() => {
    if (statusFilter === 'ALL') {
      return staffAssignments
    }
    return staffAssignments.filter((assignment) => assignment.status === statusFilter)
  }, [staffAssignments, statusFilter])

  function openAssignModal(assignment: StaffAssignment) {
    setSelectedAssignment(assignment)
    setAssignModalOpen(true)
  }

  function handleAssign(staffId: string, notes: string) {
    if (!selectedAssignment) {
      return
    }
    assignStaffToAssignment(selectedAssignment.id, staffId, notes)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Staff Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">Assign pending rental and service staffing requests.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Staff assignments</CardTitle>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED')
              }
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order/Booking</TableHead>
                <TableHead>Role needed</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assign</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>{assignment.orderId ?? assignment.bookingId ?? '—'}</TableCell>
                  <TableCell>{assignment.role}</TableCell>
                  <TableCell>
                    {format(new Date(assignment.scheduledAt), 'PPP p')} -{' '}
                    {format(new Date(assignment.endsAt), 'p')}
                  </TableCell>
                  <TableCell>{assignment.notes ?? '—'}</TableCell>
                  <TableCell>{assignment.status}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openAssignModal(assignment)}>
                      Assign staff
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStaffAssignmentStatus(assignment.id, 'COMPLETED')}
                      >
                        Complete
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => updateStaffAssignmentStatus(assignment.id, 'CANCELLED')}
                      >
                        Cancel
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <StaffAssignmentAssignModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        onAssign={handleAssign}
      />
    </div>
  )
}
