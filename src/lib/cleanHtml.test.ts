// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { cleanHtml } from './cleanHtml'

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

  it('keeps a <br>-only paragraph (blank line from Word)', () => {
    const out = cleanHtml('<p>keep</p><p><br></p>')
    expect(out.html).toContain('<br>')
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
