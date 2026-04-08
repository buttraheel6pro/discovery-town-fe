/** ClientNotesList — list of notes for a contact with inline add form. */
'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ContactNote } from '@/lib/types'

interface ClientNotesListProps {
  readonly notes: ContactNote[]
  readonly contactId: string
  readonly onAddNote: (content: string) => void
}

export function ClientNotesList({
  notes,
  contactId,
  onAddNote,
}: Readonly<ClientNotesListProps>) {
  const [draft, setDraft] = useState<string>('')

  const contactNotes = notes.filter((n) => n.contactId === contactId)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return
    onAddNote(trimmed)
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add an internal note about this client..."
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm">
            Add note
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {contactNotes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No notes yet. Add the first note using the form above.
          </p>
        ) : (
          contactNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-md border border-border bg-muted/40 px-3 py-2 space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {note.authorName ?? 'Team member'}
                </span>
                <span className="text-muted-foreground">
                  {new Date(note.createdAt).toLocaleString('en-GB', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <p className="text-xs text-foreground leading-snug whitespace-pre-line">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

