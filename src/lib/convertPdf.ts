import type { ConversionResult } from './types'
import { cleanHtml, escapeHtml } from './cleanHtml'

export const PDF_WARNING =
  'PDF: text extracted only — headings, tables, and lists are not preserved.'

/** Turn per-page extracted text into a clean paragraph fragment. */
export function assemblePdfHtml(pageTexts: string[]): string {
  const paragraphs = pageTexts
    .flatMap((t) => t.split(/\r?\n\s*\r?\n/))
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `<p>${escapeHtml(s)}</p>`)

  return cleanHtml(paragraphs.join('\n')).html
}

/** Extract text from a PDF in the browser via pdf.js (dynamically imported). */
export async function convertPdf(data: ArrayBuffer): Promise<ConversionResult> {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const pdf = await pdfjs.getDocument({ data }).promise
  const pageTexts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pageTexts.push(text)
  }

  return { html: assemblePdfHtml(pageTexts), notes: [], warnings: [PDF_WARNING] }
}
