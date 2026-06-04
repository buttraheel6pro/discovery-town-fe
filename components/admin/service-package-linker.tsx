/** Linked packages, attach combobox, and inline package creation for an event service. */
'use client'

import { useMemo, useState } from 'react'

import { ChevronsUpDown, Pencil, Unlink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  buildDuplicatePackagePatch,
  DuplicatePackageDialog,
} from '@/components/admin/duplicate-package-dialog'
import { useToast } from '@/hooks/use-toast'
import { useScheduling } from '@/lib/scheduling-store'
import { cn, formatPrice } from '@/lib/utils'
import type { EventPackage } from '@/lib/types'

interface ServicePackageLinkerProps {
  readonly serviceId: string
  readonly serviceName: string
  readonly serviceCategoryId: string
  readonly onRequestEditPackage: (packageId: string) => void
}

function createPackageId(): string {
  return `pkg-${Math.random().toString(16).slice(2, 10)}`
}

function tierPillClass(tier: EventPackage['tier']): string {
  if (tier === 'SILVER') return 'border-slate-400 bg-slate-500/15 text-slate-700 dark:text-slate-200'
  if (tier === 'GOLD') return 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200'
  return 'border-purple-500 bg-purple-500/15 text-purple-900 dark:text-purple-200'
}

export function ServicePackageLinker({
  serviceId,
  serviceName,
  serviceCategoryId,
  onRequestEditPackage,
}: Readonly<ServicePackageLinkerProps>) {
  const { toast } = useToast()
  const {
    packages,
    addPackage,
    updatePackage,
    duplicatePackage,
    canDetachPackage,
  } = useScheduling()

  const [attachOpen, setAttachOpen] = useState(false)
  const [miniOpen, setMiniOpen] = useState(false)
  const [detachTarget, setDetachTarget] = useState<EventPackage | null>(null)
  const [duplicateSource, setDuplicateSource] = useState<EventPackage | null>(null)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [savingPackage, setSavingPackage] = useState(false)

  const [miniName, setMiniName] = useState('')
  const [miniTier, setMiniTier] = useState<EventPackage['tier']>('SILVER')
  const [miniBasePrice, setMiniBasePrice] = useState('0')
  const [miniDeposit, setMiniDeposit] = useState('')
  const [miniWholeVenue, setMiniWholeVenue] = useState(false)
  const [miniRequiresApproval, setMiniRequiresApproval] = useState(false)
  const [miniMinChild, setMiniMinChild] = useState('')
  const [miniMaxChild, setMiniMaxChild] = useState('')
  const [miniMinAdult, setMiniMinAdult] = useState('')
  const [miniMaxAdult, setMiniMaxAdult] = useState('')
  const [miniExtraChild, setMiniExtraChild] = useState('')
  const [miniDuration, setMiniDuration] = useState('120')
  const [miniSetup, setMiniSetup] = useState('30')
  const [miniStaff, setMiniStaff] = useState('1')
  const [miniRooms, setMiniRooms] = useState('1')
  const [miniFeatures, setMiniFeatures] = useState<string[]>([''])

  const linked = useMemo(
    () => packages.filter((p) => p.serviceId === serviceId),
    [packages, serviceId],
  )

  const attachCandidates = useMemo(() => {
    return packages.filter((p) => p.serviceId !== serviceId && p.isActive)
  }, [packages, serviceId])

  function resetMiniForm() {
    setMiniName('')
    setMiniTier('SILVER')
    setMiniBasePrice('0')
    setMiniDeposit('')
    setMiniWholeVenue(false)
    setMiniRequiresApproval(false)
    setMiniMinChild('')
    setMiniMaxChild('')
    setMiniMinAdult('')
    setMiniMaxAdult('')
    setMiniExtraChild('')
    setMiniDuration('120')
    setMiniSetup('30')
    setMiniStaff('1')
    setMiniRooms('1')
    setMiniFeatures([''])
    setInlineError(null)
  }

  function handleToggleMini() {
    if (miniOpen) {
      setMiniOpen(false)
      resetMiniForm()
      return
    }
    setMiniOpen(true)
    setMiniName('Demo Package')
    setMiniTier('GOLD')
    setMiniBasePrice('500')
    setMiniMaxChild('15')
    setMiniMaxAdult('30')
    setMiniDuration('120')
  }

  function addFeatureRow() {
    setMiniFeatures((rows) => [...rows, ''])
  }

  function updateFeatureRow(index: number, value: string) {
    setMiniFeatures((rows) => rows.map((r, i) => (i === index ? value : r)))
  }

  function removeFeatureRow(index: number) {
    setMiniFeatures((rows) => (rows.length <= 1 ? [''] : rows.filter((_, i) => i !== index)))
  }

  function saveMiniPackage() {
    setInlineError(null)
    const basePrice = Number.parseFloat(miniBasePrice)
    if (!miniName.trim() || !Number.isFinite(basePrice)) {
      setInlineError('Name and base price are required.')
      return
    }
    const duration = Number.parseInt(miniDuration, 10)
    if (!Number.isFinite(duration) || duration < 1) {
      setInlineError('Duration must be at least 1 minute.')
      return
    }
    setSavingPackage(true)
    try {
      const features = miniFeatures.map((l) => l.trim()).filter(Boolean)
      const depositAmount = miniDeposit.trim()
        ? Number.parseFloat(miniDeposit)
        : undefined
      const pkg: EventPackage = {
        id: createPackageId(),
        serviceId,
        tier: miniTier,
        name: miniName.trim(),
        basePrice,
        features,
        addOns: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        depositAmount: Number.isFinite(depositAmount ?? Number.NaN) ? depositAmount : undefined,
        isWholeVenue: miniWholeVenue,
        requiresApproval: miniWholeVenue ? miniRequiresApproval : false,
        minChildSeats: parseOptionalInt(miniMinChild),
        maxChildSeats: parseOptionalInt(miniMaxChild),
        minAdultSeats: parseOptionalInt(miniMinAdult),
        maxAdultSeats: parseOptionalInt(miniMaxAdult),
        additionalChildPrice: parseOptionalFloat(miniExtraChild),
        duration,
        setupTime: parseOptionalInt(miniSetup) ?? 30,
        staffCount: parseOptionalInt(miniStaff) ?? 1,
        partyRooms: parseOptionalInt(miniRooms) ?? 1,
      }
      addPackage(pkg)
      toast({
        title: 'Package created',
        description: `Linked to ${serviceName}.`,
      })
      setMiniOpen(false)
      resetMiniForm()
    } finally {
      setSavingPackage(false)
    }
  }

  function parseOptionalInt(value: string): number | undefined {
    const t = value.trim()
    if (!t) return undefined
    const n = Number.parseInt(t, 10)
    return Number.isFinite(n) ? n : undefined
  }

  function parseOptionalFloat(value: string): number | undefined {
    const t = value.trim()
    if (!t) return undefined
    const n = Number.parseFloat(t)
    return Number.isFinite(n) ? n : undefined
  }

  function maxGuestsLabel(p: EventPackage): string {
    const c = p.maxChildSeats ?? 0
    const a = p.maxAdultSeats ?? 0
    if (!c && !a) return '—'
    return `${c + a} max`
  }

  function confirmDetach() {
    if (!detachTarget) return
    if (!canDetachPackage(serviceId, detachTarget.id)) {
      toast({
        title: 'Cannot remove package',
        description: 'This package has confirmed bookings.',
        variant: 'destructive',
      })
      setDetachTarget(null)
      return
    }
    updatePackage(detachTarget.id, { serviceId: 'unassigned' })
    setDetachTarget(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Linked packages</p>
        <p className="text-xs text-muted-foreground">For {serviceName}</p>
      </div>

      {linked.length > 0 ? (
        <div className="space-y-2 rounded-lg border border-border">
          {linked.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 last:border-b-0"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                    tierPillClass(p.tier),
                  )}
                >
                  {p.tier}
                </span>
                <span className="truncate text-sm font-semibold text-foreground">{p.name}</span>
                <span className="text-xs text-muted-foreground">{formatPrice(p.basePrice)}</span>
                <span className="text-xs text-muted-foreground">{maxGuestsLabel(p)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label={`Edit ${p.name}`}
                  onClick={() => onRequestEditPackage(p.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  aria-label={`Unlink ${p.name}`}
                  onClick={() => setDetachTarget(p)}
                >
                  <Unlink className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setDuplicateSource(p)}
                >
                  Duplicate
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No packages linked yet.</p>
      )}

      <div className="space-y-2">
        <Label>Link existing package</Label>
        <Popover open={attachOpen} onOpenChange={setAttachOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={miniOpen || attachCandidates.length === 0}
              className="w-full justify-between"
              title={miniOpen ? 'Close the new package form first.' : undefined}
            >
              Search existing packages…
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search packages…" />
              <CommandList>
                <CommandEmpty>No unlinked packages.</CommandEmpty>
                <CommandGroup>
                  {attachCandidates.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={`${p.name} ${p.tier}`}
                      onSelect={() => {
                        updatePackage(p.id, { serviceId })
                        setAttachOpen(false)
                        toast({ title: 'Package linked' })
                      }}
                    >
                      <span className="font-semibold">{p.tier}</span>
                      <span className="ml-2 truncate">{p.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatPrice(p.basePrice)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={attachOpen}
          title={attachOpen ? 'Close the package picker first.' : undefined}
          onClick={handleToggleMini}
        >
          {miniOpen ? 'Close new package form' : '+ Create new package'}
        </Button>
      </div>

      {miniOpen ? (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-foreground">New package</p>
            <Button type="button" size="sm" variant="ghost" onClick={handleToggleMini}>
              ×
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mini-name">Package name</Label>
            <Input
              id="mini-name"
              value={miniName}
              onChange={(e) => setMiniName(e.target.value)}
              placeholder="e.g. The VIP Play"
            />
          </div>
          <div className="space-y-2">
            <Label>Tier</Label>
            <div className="flex flex-wrap gap-2">
              {(['SILVER', 'GOLD', 'PLATINUM'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMiniTier(t)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-bold',
                    miniTier === t ? tierPillClass(t) : 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mini-base">Base price</Label>
              <Input
                id="mini-base"
                type="number"
                value={miniBasePrice}
                onChange={(e) => setMiniBasePrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mini-dep">Deposit (optional)</Label>
              <Input
                id="mini-dep"
                type="number"
                value={miniDeposit}
                onChange={(e) => setMiniDeposit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Leave blank for no deposit.</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div>
              <p className="text-sm font-semibold">Requires exclusive venue access</p>
            </div>
            <Switch checked={miniWholeVenue} onCheckedChange={setMiniWholeVenue} />
          </div>
          {miniWholeVenue ? (
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-semibold">Manager must approve before confirming</p>
              </div>
              <Switch
                checked={miniRequiresApproval}
                onCheckedChange={setMiniRequiresApproval}
              />
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mini-min-c">Min children</Label>
              <Input
                id="mini-min-c"
                inputMode="numeric"
                value={miniMinChild}
                onChange={(e) => setMiniMinChild(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mini-max-c">Max children</Label>
              <Input
                id="mini-max-c"
                inputMode="numeric"
                value={miniMaxChild}
                onChange={(e) => setMiniMaxChild(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mini-min-a">Min adults</Label>
              <Input
                id="mini-min-a"
                inputMode="numeric"
                value={miniMinAdult}
                onChange={(e) => setMiniMinAdult(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mini-max-a">Max adults</Label>
              <Input
                id="mini-max-a"
                inputMode="numeric"
                value={miniMaxAdult}
                onChange={(e) => setMiniMaxAdult(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mini-extra-c">Extra per child (beyond max)</Label>
            <Input
              id="mini-extra-c"
              type="number"
              value={miniExtraChild}
              onChange={(e) => setMiniExtraChild(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mini-dur">Party duration (minutes)</Label>
              <Input
                id="mini-dur"
                inputMode="numeric"
                value={miniDuration}
                onChange={(e) => setMiniDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mini-setup">Setup time (minutes)</Label>
              <Input
                id="mini-setup"
                inputMode="numeric"
                value={miniSetup}
                onChange={(e) => setMiniSetup(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mini-staff">Staff count</Label>
              <Input
                id="mini-staff"
                inputMode="numeric"
                value={miniStaff}
                onChange={(e) => setMiniStaff(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mini-rooms">Party rooms</Label>
              <Input
                id="mini-rooms"
                inputMode="numeric"
                value={miniRooms}
                onChange={(e) => setMiniRooms(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Included features</Label>
            {miniFeatures.map((row, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={row}
                  onChange={(e) => updateFeatureRow(i, e.target.value)}
                  placeholder="Feature bullet"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => removeFeatureRow(i)}>
                  Remove
                </Button>
              </div>
            ))}
            <Button type="button" variant="link" className="h-auto px-0 text-sm" onClick={addFeatureRow}>
              + Add feature
            </Button>
          </div>
          {inlineError ? <p className="text-sm text-destructive">{inlineError}</p> : null}
          <Button type="button" disabled={savingPackage} onClick={saveMiniPackage}>
            {savingPackage ? 'Creating package…' : 'Save package'}
          </Button>
        </div>
      ) : null}

      <AlertDialog open={Boolean(detachTarget)} onOpenChange={() => setDetachTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this package from the service?</AlertDialogTitle>
            <AlertDialogDescription>
              The package will stay in the catalog but won&apos;t be linked to this service.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDetach}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DuplicatePackageDialog
        open={duplicateSource != null}
        onOpenChange={(next) => {
          if (!next) {
            setDuplicateSource(null)
          }
        }}
        sourcePackage={duplicateSource}
        defaultServiceId={serviceId}
        defaultSubCategoryId={serviceCategoryId}
        onConfirm={({ packageId, serviceId: targetServiceId, placement }) => {
          duplicatePackage(packageId, buildDuplicatePackagePatch(targetServiceId, placement))
          setDuplicateSource(null)
          toast({ title: 'Package duplicated' })
        }}
      />
    </div>
  )
}
