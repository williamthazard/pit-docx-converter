export interface ConversionResult {
  /** Clean HTML fragment (no <html>/<body> wrapper). */
  html: string
  /** Human-readable notes, e.g. "3 images removed". */
  notes: string[]
  /** Caveats, e.g. PDF structure loss. */
  warnings: string[]
}

/** Thrown for unreadable or unsupported input. `guidance` is user-facing advice. */
export class ConversionError extends Error {
  guidance?: string
  constructor(message: string, guidance?: string) {
    super(message)
    this.name = 'ConversionError'
    this.guidance = guidance
  }
}
