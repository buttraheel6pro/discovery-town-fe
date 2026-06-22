/** Admin image field for scheduling sub-categories — compressed upload + URL input. */
'use client'

import { startTransition, useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  ClientImageCompressionError,
  compressImageFileForCatalog,
} from '@/lib/client-image-compression'

export interface SchedulingCategoryImageFieldProps {
  readonly value: string
  readonly onChange: (next: string) => void
  readonly disabled?: boolean
  readonly helpText?: string
}

const DEFAULT_HELP_TEXT =
  'Shown on Play, Gym, Events, and Learn category cards and hero banners. Uploads are automatically compressed. For production APIs, prefer an https:// image URL.'

export function SchedulingCategoryImageField({
  value,
  onChange,
  disabled = false,
  helpText = DEFAULT_HELP_TEXT,
}: Readonly<SchedulingCategoryImageFieldProps>) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  const previewSrc = value.trim()

  async function onPickImageFile(file: File | null): Promise<void> {
    if (!file) {
      return
    }
    setUploading(true)
    try {
      const dataUrl = await compressImageFileForCatalog(file)
      startTransition(() => {
        onChange(dataUrl)
      })
      toast({
        title: 'Image ready',
        description: 'Compressed for fast saving. Click Save sub-category to apply.',
      })
    } catch (error) {
      const description =
        error instanceof ClientImageCompressionError
          ? error.message
          : 'Could not process the selected image. Try another file or paste an https:// URL.'
      toast({
        title: 'Image upload failed',
        description,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Category card image</Label>
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <Input
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://... or upload"
          disabled={disabled || uploading}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            void onPickImageFile(file)
            event.target.value = ''
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? 'Processing…' : 'Upload'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{helpText}</p>
      {previewSrc ? (
        <div className="relative mt-2 h-28 w-full max-w-sm overflow-hidden rounded-lg border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt="Category preview"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
    </div>
  )
}
