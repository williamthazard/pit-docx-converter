import type { ConversionResult } from './types'
import { ConversionError } from './types'

/** The only format we convert. Drives the Dropzone's accept filter + pills. */
export const ACCEPTED_EXTENSIONS = ['.docx'] as const

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

/** Format-specific advice for getting an unsupported file into .docx. */
function guidanceFor(ext: string): string {
  switch (ext) {
    case '.doc':
      return 'Open it in Word and use “Save As” to create a .docx, then upload that.'
    case '.pages':
      return 'In Pages, use “Export To → Word” to create a .docx, then upload that.'
    default:
      return 'Open it in Word or Google Docs and export a .docx, then upload that.'
  }
}

export async function convertFile(file: File): Promise<ConversionResult> {
  const ext = extensionOf(file.name)
  if (ext === '.docx') {
    // Dynamic import so mammoth is code-split (loaded only on first conversion).
    const { convertDocx } = await import('./convertDocx')
    return convertDocx(await file.arrayBuffer())
  }
  throw new ConversionError('Please upload a Word (.docx) file.', guidanceFor(ext))
}
