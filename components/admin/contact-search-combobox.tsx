/** ContactSearchCombobox — searchable combobox for selecting a single contact. */
'use client'

import { useMemo, useState } from 'react'

import { ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ContactAvatar } from '@/components/customer/contact-avatar'
import { cn } from '@/lib/utils'
import type { CmContact } from '@/lib/types'

interface ContactSearchComboboxProps {
  readonly contacts: CmContact[]
  readonly value?: string
  readonly onChange: (contactId: string | undefined) => void
  readonly placeholder?: string
}

export function ContactSearchCombobox({
  contacts,
  value,
  onChange,
  placeholder = 'Search contacts...',
}: Readonly<ContactSearchComboboxProps>) {
  const [open, setOpen] = useState(false)

  const selected = useMemo(
    () => contacts.find((c) => c.id === value),
    [contacts, value],
  )

  function handleSelect(contactId: string) {
    onChange(contactId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate text-xs">
              <ContactAvatar
                firstName={selected.firstName}
                lastName={selected.lastName}
                imageUrl={selected.avatarUrl}
                contactType={selected.contactType}
                className="h-6 w-6"
              />
              <span className="truncate">
                {selected.firstName} {selected.lastName}
              </span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground truncate">
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No contacts found.</CommandEmpty>
            <CommandGroup>
              {contacts.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.firstName} ${c.lastName} ${c.email ?? ''}`}
                  onSelect={() => handleSelect(c.id)}
                >
                  <div className="flex items-center gap-2">
                    <ContactAvatar
                      firstName={c.firstName}
                      lastName={c.lastName}
                      imageUrl={c.avatarUrl}
                      contactType={c.contactType}
                      className="h-7 w-7"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {c.email ?? c.phone ?? 'No contact details'}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

