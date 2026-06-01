// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { cleanHtml, escapeHtml } from './cleanHtml'

describe('escapeHtml', () => {
  it('escapes the HTML-significant characters', () => {
    expect(escapeHtml('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d')
  })
})

describe('cleanHtml', () => {
  it('removes <img> elements and reports the count', () => {
    const out = cleanHtml('<p>Hi</p><img src="data:image/png;base64,AAAA"><img>')
    expect(out.html).not.toContain('<img')
    expect(out.removedImages).toBe(2)
  })

  it('drops empty paragraphs', () => {
    const out = cleanHtml('<p>keep</p><p></p><p>   </p>')
    expect(out.html).toBe('<p>keep</p>')
  })

  it('strips style and id attributes', () => {
    const out = cleanHtml('<p style="color:red" id="x">t</p>')
    expect(out.html).toBe('<p>t</p>')
  })

  it('returns empty string for empty input', () => {
    expect(cleanHtml('').html).toBe('')
    expect(cleanHtml('').removedImages).toBe(0)
  })

  it('removes <script> tags (sanitization)', () => {
    const out = cleanHtml('<p>ok</p><script>alert(1)</script>')
    expect(out.html).toBe('<p>ok</p>')
  })

  it('strips inline event-handler attributes (sanitization)', () => {
    const out = cleanHtml('<p onclick="alert(1)">t</p>')
    expect(out.html).toBe('<p>t</p>')
  })

  it('strips javascript: URLs on links (sanitization)', () => {
    const out = cleanHtml('<a href="javascript:alert(1)">x</a>')
    expect(out.html).not.toContain('javascript:')
  })
})
