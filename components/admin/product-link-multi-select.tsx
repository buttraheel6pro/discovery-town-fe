/** Searchable multi-select for linking products and coupons in admin product forms. */
'use client'

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { Check, ChevronsUpDown } from 'lucide-react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn, formatPrice } from '@/lib/utils'

export interface ProductLinkPickerOption {
  id: string
  label: string
  imageUrl?: string
  secondary?: string
  description?: string
  price?: number
}

export interface ProductLinkMultiSelectProps {
  readonly label: string
  readonly placeholder: string
  readonly searchPlaceholder: string
  readonly options: ProductLinkPickerOption[]
  readonly selectedIds: string[]
  readonly onChange: (next: string[]) => void
  readonly maxSelections?: number
  readonly helperText?: string
  readonly doneLabel?: string
  readonly requiresLimit?: boolean
  readonly onBlockedSelection?: () => void
  readonly modalExtraContent?: ReactNode
}

export function ProductLinkMultiSelect({
  label,
  placeholder,
  searchPlaceholder,
  options,
  selectedIds,
  onChange,
  maxSelections,
  helperText,
  doneLabel = 'Done',
  requiresLimit = false,
  onBlockedSelection,
  modalExtraContent,
}: Readonly<ProductLinkMultiSelectProps>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((option) =>
      `${option.label} ${option.secondary ?? ''}`.toLowerCase().includes(q),
    )
  }, [options, query])
  const visibleOptions = filtered

  const selectedLabel = useMemo(() => {
    if (selectedIds.length === 0) return placeholder
    if (selectedIds.length === 1) {
      return options.find((option) => option.id === selectedIds[0])?.label ?? '1 selected'
    }
    return `${selectedIds.length} selected`
  }, [options, placeholder, selectedIds])

  const toggle = useCallback(
    (id: string) => {
      if (requiresLimit && typeof maxSelections !== 'number') {
        onBlockedSelection?.()
        return
      }
      if (selectedSet.has(id)) {
        onChange(selectedIds.filter((rowId) => rowId !== id))
        return
      }
      if (typeof maxSelections === 'number' && selectedIds.length >= maxSelections) {
        return
      }
      onChange([...selectedIds, id])
    },
    [maxSelections, onBlockedSelection, onChange, requiresLimit, selectedIds, selectedSet],
  )

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={() => {
          if (requiresLimit && typeof maxSelections !== 'number') {
            onBlockedSelection?.()
            return
          }
          setOpen(true)
        }}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </Button>
      <CrudModal
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setQuery('')
          }
        }}
        title={label}
        description={helperText ?? null}
        size="lg"
        variant="edit"
        className="sm:max-w-5xl"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{selectedIds.length} selected</span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selectedIds.length === 0}
                onClick={() => onChange([])}
              >
                Clear
              </Button>
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                {doneLabel}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <Command className="h-[500px] rounded-md border border-border">
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="h-[calc(500px-52px)] max-h-none">
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {visibleOptions.map((option) => {
                  const isSelected = selectedSet.has(option.id)
                  const maxReached =
                    typeof maxSelections === 'number' && selectedIds.length >= maxSelections
                  const disabled = !isSelected && maxReached
                  return (
                    <CommandItem
                      key={option.id}
                      value={`${option.label} ${option.secondary ?? ''}`}
                      disabled={disabled}
                      onSelect={() => toggle(option.id)}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {option.imageUrl ? (
                        <div className="relative h-8 w-8 overflow-hidden rounded-md border border-border">
                          <Image
                            src={option.imageUrl}
                            alt={option.label}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-md border border-dashed border-border bg-muted/30" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{option.label}</p>
                        {option.secondary ? (
                          <p className="truncate text-xs text-muted-foreground">{option.secondary}</p>
                        ) : null}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
          {modalExtraContent ? (
            <div className="rounded-lg border border-border p-3">
              {modalExtraContent}
            </div>
          ) : null}
        </div>
      </CrudModal>
      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const item = options.find((option) => option.id === id)
            if (!item) return null
            return (
              <HoverCard key={id} openDelay={120} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    className="relative h-12 w-12 overflow-hidden rounded-md border border-border bg-muted/30"
                    aria-label={`Selected: ${item.label}`}
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.label}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
                        {item.label.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </button>
                </HoverCardTrigger>
                <HoverCardContent
                  side="top"
                  align="start"
                  className="w-72 space-y-3 rounded-xl border border-border bg-card p-0"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-muted/30">
                    <Image
                      src={item.imageUrl ?? '/placeholder.jpg'}
                      alt={item.label}
                      fill
                      className="object-cover"
                      sizes="288px"
                    />
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    {item.secondary ? (
                      <p className="text-xs text-muted-foreground">{item.secondary}</p>
                    ) : null}
                    {item.description ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                    ) : null}
                    {typeof item.price === 'number' ? (
                      <p className="text-sm font-semibold text-foreground">{formatPrice(item.price)}</p>
                    ) : null}
                  </div>
                </HoverCardContent>
              </HoverCard>
            )
          })}
        </div>
      ) : null}
      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
    </div>
  )
}
