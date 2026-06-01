import type { ConversionResult } from './types'
import { cleanHtml, escapeHtml } from './cleanHtml'

export function convertTxt(text: string): ConversionResult {
  const blocks = text
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => `<p>${escapeHtml(b).replace(/\r?\n/g, '<br>')}</p>`)

  const html = cleanHtml(blocks.join('\n')).html
  return { html, notes: [], warnings: [] }
}
