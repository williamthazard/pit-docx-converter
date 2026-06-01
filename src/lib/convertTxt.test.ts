// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { convertTxt } from './convertTxt'

describe('convertTxt', () => {
  it('wraps blank-line-separated blocks in <p> and joins single newlines with <br>', () => {
    const r = convertTxt('Para one line one\nline two\n\nPara two')
    expect(r.html).toBe('<p>Para one line one<br>line two</p>\n<p>Para two</p>')
    expect(r.notes).toEqual([])
    expect(r.warnings).toEqual([])
  })

  it('escapes HTML-significant characters', () => {
    const r = convertTxt('a < b & c')
    expect(r.html).toBe('<p>a &lt; b &amp; c</p>')
  })

  it('returns empty html for empty/whitespace input', () => {
    expect(convertTxt('   \n  ').html).toBe('')
  })
})
