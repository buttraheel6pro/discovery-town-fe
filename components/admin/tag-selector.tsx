/** TagSelector — searchable multi-select for contact tags, using Command + Popover. */
'use client'

import { useMemo, useState } from 'react'

import { Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
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
import { TagPill } from '@/components/customer/tag-pill'
import { cn } from '@/lib/utils'
import type { ContactTag } from '@/lib/types'

interface TagSelectorProps {
  readonly allTags: ContactTag[]
  readonly selectedTagIds: string[]
  readonly onChange: (nextIds: string[]) => void
}

export function TagSelector({
  allTags,
  selectedTagIds,
  onChange,
}: Readonly<TagSelectorProps>) {
  const [open, setOpen] = useState(false)

  const selectedTags = useMemo(
    () => allTags.filter((tag) => selectedTagIds.includes(tag.id)),
    [allTags, selectedTagIds],
  )

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between"
          >
            <span className="truncate text-xs">
              {selectedTags.length
                ? `${selectedTags.length} tag${selectedTags.length === 1 ? '' : 's'} selected`
                : 'Add tags'}
            </span>
            <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandGroup>
                {allTags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id)
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => toggleTag(tag.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selected ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="truncate">{tag.name}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <TagPill
              key={tag.id}
              tag={tag}
              onRemove={() => toggleTag(tag.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

