/** Client-side CSV export button. */
'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export interface ExportColumn {
  readonly key: string
  readonly header: string
}

export interface ExportButtonProps {
  readonly label?: string
  readonly data: Record<string, unknown>[]
  readonly filename: string
  readonly columns: ExportColumn[]
  readonly className?: string
}

function exportToCsv(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string,
): void {
  const headers = columns.map((c) => c.header).join(',')
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key] ?? ''
        const str = String(val)
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replaceAll('"', '""')}"`
          : str
      })
      .join(','),
  )
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportButton({
  label = 'Export CSV',
  data,
  filename,
  columns,
  className,
}: Readonly<ExportButtonProps>) {
  const [busy, setBusy] = useState(false)

  function handleClick() {
    setBusy(true)
    window.setTimeout(() => {
      exportToCsv(data, columns, filename)
      setBusy(false)
    }, 200)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={handleClick}
      disabled={busy || data.length === 0}
      aria-busy={busy}
    >
      {busy ? (
        <>
          <Spinner className="mr-2 h-4 w-4" />
          Generating…
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  )
}
