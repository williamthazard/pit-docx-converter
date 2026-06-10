// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { toCanvasHtml } from './canvasHtml'

describe('toCanvasHtml', () => {
  it('inlines styles onto block elements', () => {
    const out = toCanvasHtml('<h1>Title</h1><p>Body</p>')
    expect(out).toMatch(/<h1 style="[^"]*font-weight: 700/)
    expect(out).toMatch(/<p style="[^"]*line-height: 1\.5/)
  })

  it('styles links and headings with PIT colors', () => {
    const out = toCanvasHtml('<h2>Heading</h2><p><a href="https://x.test">link</a></p>')
    expect(out).toMatch(/<h2 style="[^"]*color: #3161ac/)
    // The link keeps its href and gains the PIT-blue inline style (attr order
    // may vary, so assert both are present within the same <a> tag).
    expect(out).toMatch(/<a [^>]*href="https:\/\/x\.test"/)
    expect(out).toMatch(/<a [^>]*color: #3161ac/)
  })

  it('gives tables collapsed borders and promotes the first row to a header', () => {
    const out = toCanvasHtml(
      '<table><tr><td>Week</td><td>Topic</td></tr><tr><td>1</td><td>Intro</td></tr></table>',
    )
    expect(out).toMatch(/<table style="[^"]*border-collapse: collapse/)
    expect(out).toContain('cellspacing="0"')
    // First-row cells get the header background; later cells don't.
    const headerCells = out.match(/background: #eef2fb/g) ?? []
    expect(headerCells.length).toBe(2)
  })

  it('zeroes the margin of Word’s paragraph wrappers inside table cells', () => {
    const out = toCanvasHtml('<table><tr><td><p>Cell</p></td></tr></table>')
    expect(out).toMatch(/<p style="margin: 0/)
  })

  it('separates top-level blocks with a blank line', () => {
    const out = toCanvasHtml('<h1>A</h1><p>B</p>')
    expect(out).toContain('</h1>\n\n')
  })

  it('indents nested table structure', () => {
    const out = toCanvasHtml('<table><tr><td>x</td></tr></table>')
    expect(out).toContain('\n  <tbody')
    expect(out).toMatch(/\n {4}<tr/)
  })
})
