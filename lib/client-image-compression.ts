/** Client-side image compression for admin catalog uploads — keeps payloads localStorage-safe. */

const MAX_INPUT_BYTES = 15 * 1024 * 1024
const MAX_OUTPUT_BYTES = 280_000
const MAX_WIDTH = 960
const MAX_HEIGHT = 540
const INITIAL_JPEG_QUALITY = 0.82
const MIN_JPEG_QUALITY = 0.45

export class ClientImageCompressionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ClientImageCompressionError'
  }
}

function estimateDataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',')
  if (commaIndex < 0) {
    return dataUrl.length
  }
  const base64 = dataUrl.slice(commaIndex + 1)
  return Math.ceil((base64.length * 3) / 4)
}

/**
 * Resize and re-encode an uploaded image as a compact JPEG data URL.
 * Prevents multi-megabyte base64 strings from freezing the UI or exceeding storage quota.
 */
export async function compressImageFileForCatalog(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new ClientImageCompressionError('Please choose an image file.')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ClientImageCompressionError('Image must be smaller than 15 MB.')
  }

  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height)
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new ClientImageCompressionError('Could not process this image in the browser.')
    }

    context.drawImage(bitmap, 0, 0, width, height)

    let quality = INITIAL_JPEG_QUALITY
    let dataUrl = canvas.toDataURL('image/jpeg', quality)

    while (estimateDataUrlBytes(dataUrl) > MAX_OUTPUT_BYTES && quality > MIN_JPEG_QUALITY) {
      quality -= 0.08
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }

    if (estimateDataUrlBytes(dataUrl) > MAX_OUTPUT_BYTES) {
      throw new ClientImageCompressionError(
        'Image is still too large after compression. Use a smaller photo or paste an https:// URL instead.',
      )
    }

    return dataUrl
  } finally {
    bitmap.close()
  }
}

export function isInlineImageDataUrl(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().startsWith('data:')
}

/** API payloads should only carry remote URLs — never multi-hundred-KB data URLs. */
export function imageUrlForApiPayload(value: string | null | undefined): string | null | undefined {
  const trimmed = value?.trim()
  if (!trimmed) {
    return null
  }
  if (isInlineImageDataUrl(trimmed)) {
    return undefined
  }
  return trimmed
}
