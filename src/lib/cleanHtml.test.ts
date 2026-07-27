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

  it('enforces one H1 per page rule by demoting subsequent <h1> tags to <h2>', () => {
    const input = '<h1>Title One</h1><p>Text</p><h1>Title Two</h1>'
    const out = cleanHtml(input)
    expect(out.html).toContain('<h1>Title One</h1>')
    expect(out.html).toContain('<h2>Title Two</h2>')
    expect(out.html).not.toContain('<h1>Title Two</h1>')
  })

  it('converts bullet pseudo-lists into <ul> lists', () => {
    const input = '<p>• First item</p><p>• Second item</p>'
    const out = cleanHtml(input)
    expect(out.html).toContain('<ul><li>First item</li><li>Second item</li></ul>')
  })

  it('converts numbered pseudo-lists into <ol> lists', () => {
    const input = '<p>1. First item</p><p>2. Second item</p>'
    const out = cleanHtml(input)
    expect(out.html).toContain('<ol><li>First item</li><li>Second item</li></ol>')
  })

  it('fixes nested list structure and removes duplicate bullet markers', () => {
    const input = '<ul><li>• Bullet Item</li><ul><li>Sub item</li></ul></ul>'
    const out = cleanHtml(input)
    expect(out.html).not.toContain('• Bullet')
    expect(out.html).toContain('<li>Bullet Item<ul><li>Sub item</li></ul></li>')
  })

  it('ensures every table has an accessible <caption> element', () => {
    const input = '<p>Course Schedule</p><table><tr><td>Week 1</td></tr></table>'
    const out = cleanHtml(input)
    expect(out.html).toContain('<caption>Course Schedule</caption>')
  })
})
