/** First step when creating an add-on — choose simple catalog vs complex cafe-style product. */
'use client'

import { Layers, Package } from 'lucide-react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface AddOnTypePickerModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSelectSimple: () => void
  readonly onSelectComplex: () => void
}

interface TypeOptionProps {
  readonly title: string
  readonly description: string
  readonly icon: typeof Package
  readonly onSelect: () => void
}

function TypeOption({ title, description, icon: Icon, onSelect }: Readonly<TypeOptionProps>) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left',
        'transition-colors hover:border-accent/50 hover:bg-accent/5 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}

export function AddOnTypePickerModal({
  open,
  onOpenChange,
  onSelectSimple,
  onSelectComplex,
}: Readonly<AddOnTypePickerModalProps>) {
  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title="New add-on"
      description="Choose how this add-on should be configured."
      size="md"
      variant="create"
      footer={
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TypeOption
          title="Simple"
          description="Name, pricing, and optional inventory link — same as the standard add-on form."
          icon={Package}
          onSelect={onSelectSimple}
        />
        <TypeOption
          title="Complex"
          description="Cafe & Food style product with modifiers, attributes, rotation, and availability rules."
          icon={Layers}
          onSelect={onSelectComplex}
        />
      </div>
    </CrudModal>
  )
}
