/** Staff & payroll — hours, pay, instructor performance, CSV export. */
'use client'

import { useMemo, useState } from 'react'

import { ExportButton } from '@/components/admin/export-button'
import { GlobalDateRangePicker } from '@/components/admin/global-date-range-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useReports } from '@/lib/reports-store'
import { formatPrice } from '@/lib/utils'

const PAY_PERIODS = ['April 2026', 'March 2026', 'February 2026'] as const

export default function ReportsStaffPage() {
  const { payroll, instructorStats } = useReports()
  const [payPeriod, setPayPeriod] = useState<string>(PAY_PERIODS[0])

  const payrollExportRows = useMemo(
    () =>
      payroll.map((p) => ({
        staffName: p.staffName,
        role: p.role,
        regularHours: p.regularHours,
        overtimeHours: p.overtimeHours,
        regularPay: p.regularPay,
        overtimePay: p.overtimePay,
        totalPay: p.totalPay,
        payPeriod,
      })),
    [payroll, payPeriod],
  )

  const instructorExportRows = useMemo(
    () =>
      instructorStats.map((s) => ({
        staffName: s.staffName,
        classesInstructed: s.classesInstructed,
        avgAttendancePct: s.avgAttendancePct,
        revenueGenerated: s.revenueGenerated,
        payPeriod,
      })),
    [instructorStats, payPeriod],
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-black tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Staff & payroll
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Payroll summary and instructor contribution (mock period data).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Pay period</p>
            <Select value={payPeriod} onValueChange={setPayPeriod}>
              <SelectTrigger className="w-[180px]" aria-label="Pay period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAY_PERIODS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <GlobalDateRangePicker />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Payroll</CardTitle>
            <CardDescription>Regular and overtime pay by role.</CardDescription>
          </div>
          <ExportButton
            label="Export payroll CSV"
            filename={`payroll-${payPeriod.replace(/\s+/g, '-').toLowerCase()}`}
            data={payrollExportRows}
            columns={[
              { key: 'staffName', header: 'Staff' },
              { key: 'role', header: 'Role' },
              { key: 'regularHours', header: 'Regular hours' },
              { key: 'overtimeHours', header: 'Overtime hours' },
              { key: 'regularPay', header: 'Regular pay' },
              { key: 'overtimePay', header: 'Overtime pay' },
              { key: 'totalPay', header: 'Total pay' },
              { key: 'payPeriod', header: 'Period' },
            ]}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Reg. hrs</TableHead>
                <TableHead className="text-right">OT hrs</TableHead>
                <TableHead className="text-right">Reg. pay</TableHead>
                <TableHead className="text-right">OT pay</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payroll.map((p) => (
                <TableRow key={p.staffId}>
                  <TableCell className="font-medium">{p.staffName}</TableCell>
                  <TableCell className="text-muted-foreground">{p.role}</TableCell>
                  <TableCell className="text-right">{p.regularHours}</TableCell>
                  <TableCell className="text-right">{p.overtimeHours}</TableCell>
                  <TableCell className="text-right">{formatPrice(p.regularPay)}</TableCell>
                  <TableCell className="text-right">{formatPrice(p.overtimePay)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatPrice(p.totalPay)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Instructor performance</CardTitle>
            <CardDescription>Classes delivered, attendance, attributed revenue.</CardDescription>
          </div>
          <ExportButton
            label="Export instructors CSV"
            filename={`instructors-${payPeriod.replace(/\s+/g, '-').toLowerCase()}`}
            data={instructorExportRows}
            columns={[
              { key: 'staffName', header: 'Instructor' },
              { key: 'classesInstructed', header: 'Classes' },
              { key: 'avgAttendancePct', header: 'Avg attendance %' },
              { key: 'revenueGenerated', header: 'Revenue' },
              { key: 'payPeriod', header: 'Period' },
            ]}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instructor</TableHead>
                <TableHead className="text-right">Classes</TableHead>
                <TableHead className="text-right">Avg attendance</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructorStats.map((s) => (
                <TableRow key={s.staffId}>
                  <TableCell className="font-medium">{s.staffName}</TableCell>
                  <TableCell className="text-right">{s.classesInstructed}</TableCell>
                  <TableCell className="text-right">{s.avgAttendancePct}%</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatPrice(s.revenueGenerated)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
