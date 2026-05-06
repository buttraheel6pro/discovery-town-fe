/** Rotation manager — pool order, schedule summary, manual override. */
'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useCafe } from '@/lib/cafe-store'
import type { RotationGroup } from '@/lib/types'

function cronPreview(period: RotationGroup['period']): string {
  switch (period) {
    case 'daily':
      return 'Runs daily at 00:00 UTC'
    case 'monthly':
      return 'Runs on the 1st of each month at 00:00 UTC'
    case 'seasonal':
      return 'Seasonal window activates at start date 00:00 UTC and ends end date 23:59 UTC'
    default:
      return ''
  }
}

export default function AdminCafeRotationPage() {
  const { toast } = useToast()
  const {
    rotationGroups,
    cafeProducts,
    upsertRotationGroup,
    setRotationManualOverride,
    reorderRotationPool,
  } = useCafe()

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editing, setEditing] = useState<RotationGroup | null>(null)

  const productName = useMemo(() => {
    const map = new Map(cafeProducts.map((p) => [p.id, p.name]))
    return (id: string | null) => (id ? map.get(id) ?? id : '—')
  }, [cafeProducts])

  function openSchedule(g: RotationGroup) {
    setEditing({ ...g })
    setScheduleOpen(true)
  }

  function saveSchedule() {
    if (!editing) return
    upsertRotationGroup(editing)
    toast({ title: 'Schedule updated' })
    setScheduleOpen(false)
    setEditing(null)
  }

  function moveInPool(group: RotationGroup, index: number, dir: -1 | 1) {
    const pool = [...group.pool]
    const j = index + dir
    if (j < 0 || j >= pool.length) return
    const t = pool[index]!
    pool[index] = pool[j]!
    pool[j] = t
    reorderRotationPool(group.id, pool)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-barlow)' }}>
          Rotation manager
        </h1>
        <p className="text-sm text-muted-foreground">
          Cron-driven schedules — manual override resets at next rotation tick (mock).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {rotationGroups.map((g) => (
          <Card key={g.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {g.name}
                {g.manualOverride ? (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Override active
                  </span>
                ) : null}
              </CardTitle>
              <CardDescription>
                Active:{' '}
                <span className="font-medium text-foreground">{productName(g.activeProductId)}</span>
                {g.nextProductId ? (
                  <>
                    {' '}
                    · Next: {productName(g.nextProductId)}{' '}
                    {g.nextActivationAt ? `— ${new Date(g.nextActivationAt).toLocaleString()}` : ''}
                  </>
                ) : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {g.manualOverride ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    Manual override active — resets at next scheduled rotation
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setRotationManualOverride(g.id, null)
                      toast({ title: 'Override cleared' })
                    }}
                  >
                    Clear override
                  </Button>
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Pool order</p>
                <ul className="space-y-1">
                  {g.pool.map((pid, idx) => (
                    <li
                      key={`${g.id}-${pid}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1 text-sm"
                    >
                      <span className="truncate">{productName(pid)}</span>
                      <span className="flex shrink-0 gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => moveInPool(g, idx, -1)}>
                          ↑
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => moveInPool(g, idx, 1)}>
                          ↓
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => openSchedule(g)}>
                  Edit schedule
                </Button>
                <Select
                  onValueChange={(productId) => {
                    setRotationManualOverride(g.id, productId)
                    toast({ title: 'Manual override applied' })
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Manual override…" />
                  </SelectTrigger>
                  <SelectContent>
                    {g.pool.map((pid) => (
                      <SelectItem key={pid} value={pid}>
                        {productName(pid)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Rotation period</Label>
                <Select
                  value={editing.period}
                  onValueChange={(v) =>
                    setEditing((e) =>
                      e ? { ...e, period: v as RotationGroup['period'] } : e,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editing.period === 'seasonal' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Seasonal start</Label>
                    <Input
                      type="date"
                      value={editing.seasonalRange?.start ?? ''}
                      onChange={(ev) =>
                        setEditing((e) =>
                          e
                            ? {
                                ...e,
                                seasonalRange: {
                                  start: ev.target.value,
                                  end: e.seasonalRange?.end ?? ev.target.value,
                                },
                              }
                            : e,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Seasonal end</Label>
                    <Input
                      type="date"
                      value={editing.seasonalRange?.end ?? ''}
                      onChange={(ev) =>
                        setEditing((e) =>
                          e
                            ? {
                                ...e,
                                seasonalRange: {
                                  start: e.seasonalRange?.start ?? ev.target.value,
                                  end: ev.target.value,
                                },
                              }
                            : e,
                        )
                      }
                    />
                  </div>
                </div>
              ) : null}
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                Cron preview: {cronPreview(editing.period)}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveSchedule}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
