import type { ConversionResult } from './types'
import { ConversionError } from './types'
import { convertTxt } from './convertTxt'

export const ACCEPTED_EXTENSIONS = ['.docx', '.txt', '.pdf'] as const

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

export async function convertFile(file: File): Promise<ConversionResult> {
  switch (extensionOf(file.name)) {
    case '.docx': {
      const { convertDocx } = await import('./convertDocx')
      return convertDocx(await file.arrayBuffer())
    }
    case '.txt':
      return convertTxt(await file.text())
    case '.pdf': {
      const { convertPdf } = await import('./convertPdf')
      return convertPdf(await file.arrayBuffer())
    }
    case '.doc':
    case '.pages':
      throw new ConversionError(
        `Can't read ${extensionOf(file.name)} files in the browser.`,
        'Open the file in Word or Pages and use "Save As" / "Export" to create a .docx, then upload that.',
      )
    default:
      throw new ConversionError(
        'Unsupported file type.',
        'Upload a .docx, .txt, or .pdf file.',
      )
  }
}
