import type { ConversionResult } from './types'
import { cleanHtml } from './cleanHtml'

const STYLE_MAP = [
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Heading 1'] => h2:fresh",
  "p[style-name='Heading 2'] => h3:fresh",
  "p[style-name='Heading 3'] => h4:fresh",
]

export async function convertDocx(data: ArrayBuffer): Promise<ConversionResult> {
  const mammoth = await import('mammoth')

  // mammoth's browser bundle accepts { arrayBuffer }, but the Node bundle
  // (used by Vitest even in jsdom mode) only accepts { buffer }. Support both.
  const input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer } =
    typeof Buffer !== 'undefined'
      ? { buffer: Buffer.from(data) }
      : { arrayBuffer: data }

  const result = await mammoth.convertToHtml(
    input,
    {
      styleMap: STYLE_MAP,
      // Emit bare <img> tags (no base64 bloat); cleanHtml strips them and counts them.
      convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: '' })),
    },
  )

  const cleaned = cleanHtml(result.value)
  const notes: string[] = []
  if (cleaned.removedImages > 0) {
    const n = cleaned.removedImages
    notes.push(`${n} image${n === 1 ? '' : 's'} removed — re-add ${n === 1 ? 'it' : 'them'} in Canvas.`)
  }

  return { html: cleaned.html, notes, warnings: [] }
}
