/** SignDocumentWidget — scroll-enforced document viewer with consent and canvas signature. */
'use client'

import React, { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface SignDocumentWidgetProps {
  readonly documentTitle: string
  readonly documentHtml: string
  readonly onSubmit: (signatureDataUrl: string) => void
  readonly className?: string
}

export function SignDocumentWidget({
  documentTitle,
  documentHtml,
  onSubmit,
  className,
}: Readonly<SignDocumentWidgetProps>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false)
  const [hasAgreed, setHasAgreed] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111827'
  }, [])

  function handlePointerDown(
    event: React.PointerEvent<HTMLCanvasElement>,
  ): void {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    canvas.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLCanvasElement>,
  ): void {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function handlePointerUp(
    event: React.PointerEvent<HTMLCanvasElement>,
  ): void {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.closePath()
    setIsDrawing(false)
    canvas.releasePointerCapture(event.pointerId)
  }

  function handleClear(): void {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  function handleScrollEnd(event: React.UIEvent<HTMLDivElement>): void {
    const target = event.currentTarget
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 4) {
      setHasScrolledToEnd(true)
    }
  }

  function handleSubmit(): void {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    onSubmit(dataUrl)
  }

  const canSubmit = hasScrolledToEnd && hasAgreed

  return (
    <div className={cn('space-y-4', className)} ref={containerRef}>
      <div className="space-y-2">
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {documentTitle}
        </h2>
        <p className="text-xs text-muted-foreground">
          Please read the full document, confirm that you agree to the terms, and
          sign in the box below.
        </p>
      </div>

      <ScrollArea
        className="border rounded-md h-48 bg-background"
        onScrollCapture={handleScrollEnd}
      >
        <div
          className="prose prose-sm max-w-none px-4 py-3"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: documentHtml }}
        />
      </ScrollArea>

      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <Checkbox
          checked={hasAgreed}
          onCheckedChange={(value) => setHasAgreed(value === true)}
          className="mt-0.5"
        />
        <span>
          I confirm that I have read and agree to the terms of this document and that
          the signature below is legally binding.
        </span>
      </label>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Draw your signature
        </p>
        <div className="border rounded-md bg-muted/30">
          <canvas
            ref={canvasRef}
            width={600}
            height={160}
            className="w-full h-40 touch-none cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
          >
            Clear signature
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Confirm & sign
          </Button>
        </div>
      </div>
    </div>
  )
}

