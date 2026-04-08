/** CSV import modal — mock in-browser import for products. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Product } from '@/lib/types'

type Step = 'upload' | 'results'

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildTemplateCsv(): string {
  return ['name,sku,price,stockCount,categoryId', 'Example Product,SKU-123,9.99,10,pcat-swim'].join(
    '\n',
  )
}

function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

type ImportResult = {
  created: number
  updated: number
  errors: string[]
}

export interface CSVImportModalProps {
  readonly open: boolean
  readonly onClose: () => void
}

export function CSVImportModal({ open, onClose }: Readonly<CSVImportModalProps>) {
  const { products, productCategories, addProduct, updateProduct } = useInventory()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    if (!open) return
    setStep('upload')
    setFile(null)
    setResult(null)
  }, [open])

  const canImport = file !== null

  const categoryIdFallback = useMemo(() => {
    return productCategories[0]?.id ?? 'pcat-swim'
  }, [productCategories])

  async function importCsv() {
    if (!file) return
    const text = await file.text()
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    const errors: string[] = []
    if (lines.length < 2) {
      errors.push('CSV must contain a header row and at least one data row.')
    }

    const header = (lines[0] ?? '').split(',').map((h) => h.trim())
    const idx = {
      name: header.indexOf('name'),
      sku: header.indexOf('sku'),
      price: header.indexOf('price'),
      stockCount: header.indexOf('stockCount'),
      categoryId: header.indexOf('categoryId'),
    }

    for (const [key, value] of Object.entries(idx)) {
      if (value < 0) errors.push(`Missing required column: ${key}`)
    }

    let created = 0
    let updated = 0

    if (errors.length === 0) {
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i] ?? ''
        const cols = row.split(',').map((c) => c.trim())
        const name = cols[idx.name] ?? ''
        const sku = cols[idx.sku] ?? ''
        const priceRaw = cols[idx.price] ?? ''
        const stockRaw = cols[idx.stockCount] ?? ''
        const categoryId = cols[idx.categoryId] ?? categoryIdFallback

        const price = Number.parseFloat(priceRaw)
        const stockCount = Number.parseInt(stockRaw, 10)

        if (!name) {
          errors.push(`Row ${i + 1}: name is required`)
          continue
        }
        if (!Number.isFinite(price)) {
          errors.push(`Row ${i + 1}: price must be a number`)
          continue
        }
        if (!Number.isFinite(stockCount)) {
          errors.push(`Row ${i + 1}: stockCount must be a number`)
          continue
        }

        const existing = products.find((p) => (p.sku ?? '').toUpperCase() === sku.toUpperCase())
        const nowIso = new Date().toISOString()

        if (existing) {
          updateProduct(existing.id, {
            name,
            price,
            stockCount,
            categoryId,
            updatedAt: nowIso,
          })
          updated++
          continue
        }

        const id = `prod-import-${Date.now()}-${i}`
        const createdProduct: Product = {
          id,
          tenantId: 'tenant-1',
          categoryId,
          name,
          slug: slugify(name) || id,
          description: '',
          sku: sku || undefined,
          price,
          memberPrice: undefined,
          stockCount,
          lowStockThreshold: 10,
          allowBackorders: false,
          imageUrl: undefined,
          galleryImages: [],
          isActive: true,
          isFeatured: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        }
        addProduct(createdProduct)
        created++
      }
    }

    const nextResult: ImportResult = { created, updated, errors }
    setResult(nextResult)
    setStep('results')
    toast({
      title: 'Import complete',
      description: `Created ${created}, updated ${updated}.`,
    })
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title="Import products (CSV)"
      description="Upload a CSV to create or update products in the mock store."
      size="sm"
      variant="create"
      footer={
        step === 'upload' ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={importCsv} disabled={!canImport}>
              Import
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Done</Button>
        )
      }
    >
      {step === 'upload' ? (
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadTextFile('products-template.csv', buildTemplateCsv())}
          >
            Download CSV template
          </Button>

          <div className="space-y-2">
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Columns: <span className="font-mono">name, sku, price, stockCount, categoryId</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold text-muted-foreground">Created</p>
              <p className="text-lg font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
                {result?.created ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold text-muted-foreground">Updated</p>
              <p className="text-lg font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
                {result?.updated ?? 0}
              </p>
            </div>
          </div>

          <Separator />

          {result?.errors?.length ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Errors</p>
              <ul className={cn('list-disc space-y-1 pl-5 text-xs text-destructive')}>
                {result.errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No errors.</p>
          )}
        </div>
      )}
    </CrudModal>
  )
}

