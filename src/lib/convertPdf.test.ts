// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { assemblePdfHtml, PDF_WARNING } from './convertPdf'

describe('assemblePdfHtml', () => {
  it('wraps each page-text block into escaped paragraphs', () => {
    const html = assemblePdfHtml(['Page one text', 'Page two text'])
    expect(html).toBe('<p>Page one text</p>\n<p>Page two text</p>')
  })

  it('splits blank-line-separated blocks within a page and escapes', () => {
    const html = assemblePdfHtml(['Intro <x>\n\nSecond'])
    expect(html).toBe('<p>Intro &lt;x&gt;</p>\n<p>Second</p>')
  })

  it('ignores empty pages', () => {
    expect(assemblePdfHtml(['', '   '])).toBe('')
  })
})

describe('PDF_WARNING', () => {
  it('mentions that structure is not preserved', () => {
    expect(PDF_WARNING.toLowerCase()).toContain('text')
  })
})
