/** Admin clients — searchable directory with filters and bulk tag assignment. */
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { TagSelector } from '@/components/admin/tag-selector'
import { AddCreditModal } from '@/components/admin/add-credit-modal'
import { ContactAvatar } from '@/components/customer/contact-avatar'
import { ContactTypeBadge } from '@/components/customer/contact-type-badge'
import { FilterDrawer } from '@/components/customer/filter-drawer'
import { SubscriptionStatusBadge } from '@/components/customer/subscription-status-badge'
import { TagPill } from '@/components/customer/tag-pill'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useClients } from '@/lib/client-store'
import { isAdminApiReady } from '@/lib/api/client'
import {
  updateContact,
  assignTagToContact,
  addContactCredit,
} from '@/lib/services/contacts'
import type { ContactFilters, ContactType, SubscriptionStatus } from '@/lib/types'
import { MoreHorizontal, Plus, Search } from 'lucide-react'

export default function AdminClientsPage() {
  const {
    contacts,
    tags,
    filteredContacts,
    assignTag,
    deactivateContact,
    addCredit,
  } = useClients()

  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [typeFilters, setTypeFilters] = useState<ContactType[]>([])
  const [tagFilterIds, setTagFilterIds] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkTagOpen, setBulkTagOpen] = useState(false)
  const [bulkTagId, setBulkTagId] = useState<string>('')
  const [creditContactId, setCreditContactId] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const filters: ContactFilters = useMemo(
    () => ({
      search: debounced || undefined,
      contactTypes: typeFilters.length ? typeFilters : undefined,
      tagIds: tagFilterIds.length ? tagFilterIds : undefined,
    }),
    [debounced, typeFilters, tagFilterIds],
  )

  const rows = useMemo(() => filteredContacts(filters), [filteredContacts, filters])

  const filterCount =
    (debounced ? 1 : 0) + typeFilters.length + tagFilterIds.length

  function toggleType(t: ContactType) {
    setTypeFilters((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(rows.map((r) => r.id)))
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function applyBulkTag() {
    if (!bulkTagId) return
    selected.forEach((id) => {
      assignTag(id, bulkTagId)
      if (isAdminApiReady()) {
        assignTagToContact(id, bulkTagId).catch(() => {})
      }
    })
    setBulkTagOpen(false)
    setBulkTagId('')
    setSelected(new Set())
  }

  function creditBalance(c: (typeof contacts)[0]): number {
    return c.creditLedger?.[0]?.balanceAfter ?? 0
  }

  function membershipLabel(c: (typeof contacts)[0]): SubscriptionStatus | null {
    const sub = c.subscriptions?.find(
      (s) =>
        s.status === 'ACTIVE' ||
        s.status === 'TRIALING' ||
        s.status === 'PAUSED',
    )
    return sub?.status ?? null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Clients
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search, filter, and manage CRM contacts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={selected.size === 0}
            onClick={() => setBulkTagOpen(true)}
          >
            Assign tag ({selected.size})
          </Button>
          <Link href="/admin/clients/new">
            <Button type="button" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New contact
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search clients"
          />
        </div>
        <FilterDrawer
          title="Client filters"
          activeCount={filterCount}
          onClear={() => {
            setSearch('')
            setTypeFilters([])
            setTagFilterIds([])
          }}
        >
          <div className="space-y-2">
            <Label>Contact type</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  'CUSTOMER',
                  'CHILD',
                  'CORPORATE',
                  'LEAD',
                  'STAFF',
                ] as ContactType[]
              ).map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={typeFilters.includes(t)}
                    onCheckedChange={() => toggleType(t)}
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagSelector
              allTags={tags}
              selectedTagIds={tagFilterIds}
              onChange={setTagFilterIds}
            />
          </div>
        </FilterDrawer>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    rows.length > 0 && selected.size === rows.length
                  }
                  onCheckedChange={(v) => toggleAll(v === true)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden lg:table-cell">Tags</TableHead>
              <TableHead className="hidden lg:table-cell">Membership</TableHead>
              <TableHead className="text-right">Credits</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No contacts match your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => {
                const mem = membershipLabel(c)
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(c.id)}
                        onCheckedChange={(v) => toggleOne(c.id, v === true)}
                        aria-label={`Select ${c.firstName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/clients/${c.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <ContactAvatar
                          firstName={c.firstName}
                          lastName={c.lastName}
                          imageUrl={c.avatarUrl}
                          contactType={c.contactType}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate group-hover:text-accent">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.email ?? c.phone ?? '—'}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <ContactTypeBadge contactType={c.contactType} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags ?? []).slice(0, 3).map((a) =>
                          a.tag ? (
                            <TagPill key={a.id} tag={a.tag} />
                          ) : null,
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {mem ? (
                        <SubscriptionStatusBadge status={mem} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {creditBalance(c)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/clients/${c.id}`}>View</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/clients/${c.id}?edit=1`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setCreditContactId(c.id)}
                          >
                            Add credit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              deactivateContact(c.id)
                              if (isAdminApiReady()) {
                                updateContact(c.id, { isActive: false }).catch(() => {})
                              }
                            }}
                          >
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={bulkTagOpen} onOpenChange={setBulkTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign tag to {selected.size} contacts</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label>Tag</Label>
            <Select value={bulkTagId} onValueChange={setBulkTagId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a tag" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBulkTagOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={applyBulkTag} disabled={!bulkTagId}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddCreditModal
        open={creditContactId !== null}
        onOpenChange={(open) => {
          if (!open) setCreditContactId(null)
        }}
        onSubmit={(amount, reason) => {
          if (!creditContactId) return
          const contact = contacts.find((x) => x.id === creditContactId)
          if (!contact) return
          const entry = {
            id: `cl-${creditContactId}-${Date.now()}`,
            tenantId: contact.tenantId,
            contactId: creditContactId,
            transactionType: 'MANUAL_ADD' as const,
            creditsChange: amount,
            balanceAfter: 0,
            description: reason || 'Manual credit',
            createdAt: new Date().toISOString(),
          }
          addCredit(creditContactId, entry)
          if (isAdminApiReady()) {
            addContactCredit(creditContactId, { amount, reason: reason || 'Manual credit' }).catch(() => {})
          }
          setCreditContactId(null)
        }}
      />
    </div>
  )
}
