/** Modal to rename or hide a single customer top-nav link from the event catalog sidebar. */
'use client'

import { useEffect, useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useCustomerNavLabels } from '@/hooks/use-customer-nav-labels'
import {
  CUSTOMER_NAV_LABEL_ROUTES,
  DEFAULT_CUSTOMER_NAV_LABELS,
  type CustomerNavLabelKey,
} from '@/lib/customer-nav-labels'

interface CustomerNavSettingsModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly navKey: CustomerNavLabelKey | null
  readonly sectionLabel: string
}

export function CustomerNavSettingsModal({
  open,
  onOpenChange,
  navKey,
  sectionLabel,
}: CustomerNavSettingsModalProps) {
  const { toast } = useToast()
  const { labels, hidden, saveNavSettings } = useCustomerNavLabels()
  const [draftLabel, setDraftLabel] = useState('')
  const [draftVisible, setDraftVisible] = useState(true)

  useEffect(() => {
    if (!open || navKey == null) {
      return
    }
    setDraftLabel(labels[navKey])
    setDraftVisible(!hidden[navKey])
  }, [hidden, labels, navKey, open])

  function handleSave(): void {
    if (navKey == null) {
      return
    }
    const trimmed = draftLabel.trim()
    if (trimmed.length === 0) {
      toast({
        title: 'Label required',
        description: 'Enter a display name for the customer navbar.',
        variant: 'destructive',
      })
      return
    }

    const ok = saveNavSettings({
      labels: { ...labels, [navKey]: trimmed },
      hidden: { ...hidden, [navKey]: !draftVisible },
    })

    if (!ok) {
      toast({
        title: 'Save failed',
        description: 'Could not update customer navbar settings.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Navbar updated',
      description: `Customer navigation for ${sectionLabel} was saved.`,
    })
    onOpenChange(false)
  }

  const defaultLabel = navKey != null ? DEFAULT_CUSTOMER_NAV_LABELS[navKey] : ''
  const routeHint = navKey != null ? CUSTOMER_NAV_LABEL_ROUTES[navKey] : ''

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Customer navbar — ${sectionLabel}`}
      description="Control how this section appears in the customer site header. Hidden sections are removed from the navbar and return page not found on direct URLs."
      size="sm"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="customer-nav-visible" className="text-sm font-medium">
            Show in navbar
          </Label>
          <Switch
            id="customer-nav-visible"
            checked={draftVisible}
            onCheckedChange={setDraftVisible}
            aria-label={`Show ${sectionLabel} in customer navbar`}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-nav-label">
            Navbar display name
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (default: {defaultLabel})
            </span>
          </Label>
          <Input
            id="customer-nav-label"
            value={draftLabel}
            onChange={(event) => setDraftLabel(event.target.value)}
            placeholder={defaultLabel}
            maxLength={48}
            disabled={!draftVisible}
          />
          <p className="text-xs text-muted-foreground">
            Route {routeHint} does not change. When hidden, direct URLs for this section show page
            not found.
          </p>
        </div>
      </div>
    </CrudModal>
  )
}
